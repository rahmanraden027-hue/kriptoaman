import { createHash } from 'node:crypto';
import { normalizeAddress } from './rpc.mjs';

export const PAIR_CREATED_TOPIC = '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9';

const hexBlock = (value) => Number.parseInt(String(value || '0x0').slice(2), 16);
const topicAddress = (topic) => normalizeAddress(String(topic || '').slice(-40));
const dataAddress = (data) => normalizeAddress(String(data || '').replace(/^0x/, '').slice(24, 64));
const iso = () => new Date().toISOString();

const hashCode = (code) => {
  if (!code || code === '0x') return null;
  return createHash('sha256').update(code).digest('hex');
};

export class ChainIndexer {
  constructor({ config, rpc, store, state, broadcast }) {
    this.config = config;
    this.rpc = rpc;
    this.store = store;
    this.state = state;
    this.broadcast = broadcast;
    this.syncing = false;
    this.requestedHead = null;
    this.stopped = false;
    this.ws = null;
  }

  async verifyChain() {
    const actual = String(await this.rpc.chainId()).toLowerCase();
    if (actual !== this.config.chainIdHex.toLowerCase()) {
      throw new Error(`ZEVARYQ chain mismatch: expected ${this.config.chainIdHex}, received ${actual}`);
    }
    return actual;
  }

  async requestSync(head = null) {
    const resolved = Number.isInteger(head) ? head : await this.rpc.blockNumber();
    if (!Number.isInteger(resolved)) throw new Error('Unable to resolve first-party chain head');
    this.requestedHead = Math.max(this.requestedHead ?? -1, resolved);
    if (this.syncing) return;
    this.syncing = true;
    try {
      while (Number.isInteger(this.requestedHead)) {
        const target = this.requestedHead;
        this.requestedHead = null;
        await this.syncTo(target);
      }
    } finally {
      this.syncing = false;
    }
  }

  async syncTo(head) {
    let last = this.store.lastBlock();
    let next = last ? last.block_number + 1 : head;

    while (!this.stopped && next <= head) {
      const receivedAt = iso();
      const block = await this.rpc.blockByNumber(next, true);
      if (!block?.hash || !block?.parentHash) throw new Error(`Block ${next} unavailable from first-party RPC`);

      const previous = next > 0 ? this.store.block(next - 1) : null;
      if (previous && previous.block_hash.toLowerCase() !== String(block.parentHash).toLowerCase()) {
        const rewind = Math.max(0, next - 1);
        this.store.rewindFrom(rewind);
        const event = this.store.recordEvent('chain.reorg', {
          blockNumber: next,
          payload: { rewindFrom: rewind, observedParent: block.parentHash, expectedParent: previous.block_hash },
        });
        this.broadcast(event);
        next = rewind;
        continue;
      }

      await this.processBlock(block, receivedAt);
      this.store.finalizeThrough(next - this.config.finalityDepth);
      next += 1;
    }
  }

  async processBlock(block, receivedAt) {
    const blockNumber = hexBlock(block.number);
    const timestamp = hexBlock(block.timestamp);
    const detectedAt = new Date(timestamp * 1000).toISOString();
    const txs = Array.isArray(block.transactions) ? block.transactions : [];

    for (const tx of txs) {
      const receipt = await this.rpc.receipt(tx.hash);
      if (!receipt) continue;

      if (!tx.to && receipt.contractAddress) {
        await this.detectContract(tx, receipt, blockNumber, detectedAt);
      }
      this.detectPools(receipt, blockNumber, detectedAt);
    }

    const indexedAt = iso();
    this.store.upsertBlock({
      blockNumber,
      hash: String(block.hash).toLowerCase(),
      parentHash: String(block.parentHash).toLowerCase(),
      timestamp,
      receivedAt,
      indexedAt,
      status: 'included',
    });
    this.state.lastBlock = blockNumber;
    this.state.lastBlockHash = String(block.hash).toLowerCase();
    this.state.lastIndexedAt = indexedAt;
    this.state.ready = true;

    const event = this.store.recordEvent('block.indexed', {
      blockNumber,
      payload: {
        hash: this.state.lastBlockHash,
        txCount: txs.length,
        blockTimestamp: detectedAt,
        nodeReceivedAt: receivedAt,
        indexedAt,
        source: this.config.sourceLabel,
      },
    });
    this.broadcast(event);
  }

  async detectContract(tx, receipt, blockNumber, detectedAt) {
    const address = normalizeAddress(receipt.contractAddress);
    if (!address) return;
    const creator = normalizeAddress(tx.from);
    const code = await this.rpc.code(address).catch(() => '0x');

    this.store.recordContract({
      address,
      creator,
      txHash: tx.hash,
      blockNumber,
      codeHash: hashCode(code),
      detectedAt,
      source: this.config.sourceLabel,
    });

    const metadata = await this.rpc.erc20Metadata(address);
    if (!metadata.isTokenLike) {
      const contractEvent = this.store.recordEvent('contract.detected', {
        blockNumber, txHash: tx.hash, subject: address,
        payload: { address, creator, tokenLike: false, source: this.config.sourceLabel },
      });
      this.broadcast(contractEvent);
      return;
    }

    const indexedAt = iso();
    this.store.recordToken({
      address,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
      totalSupply: metadata.totalSupply,
      creator,
      txHash: tx.hash,
      blockNumber,
      detectedAt,
      indexedAt,
      source: this.config.sourceLabel,
      passportStatus: 'metadata-resolved',
    });

    const event = this.store.recordEvent('token.detected', {
      blockNumber, txHash: tx.hash, subject: address,
      payload: {
        address, creator, ...metadata,
        blockTimestamp: detectedAt,
        indexedAt,
        source: this.config.sourceLabel,
      },
    });
    this.broadcast(event);
  }

  detectPools(receipt, blockNumber, detectedAt) {
    if (!this.config.factoryAddresses.length) return;
    for (const log of receipt.logs || []) {
      const factory = normalizeAddress(log.address);
      if (!factory || !this.config.factoryAddresses.includes(factory)) continue;
      if (String(log.topics?.[0] || '').toLowerCase() !== PAIR_CREATED_TOPIC) continue;
      const token0 = topicAddress(log.topics?.[1]);
      const token1 = topicAddress(log.topics?.[2]);
      const pool = dataAddress(log.data);
      if (!token0 || !token1 || !pool) continue;

      const indexedAt = iso();
      this.store.recordPool({
        address: pool, factory, token0, token1,
        txHash: receipt.transactionHash,
        blockNumber, detectedAt, indexedAt,
        source: this.config.sourceLabel,
      });
      const event = this.store.recordEvent('pool.detected', {
        blockNumber,
        txHash: receipt.transactionHash,
        subject: pool,
        payload: { pool, factory, token0, token1, blockTimestamp: detectedAt, indexedAt, source: this.config.sourceLabel },
      });
      this.broadcast(event);
    }
  }

  startPolling() {
    const poll = async () => {
      if (this.stopped) return;
      try {
        await this.requestSync();
        this.state.lastError = null;
      } catch (error) {
        this.state.lastError = String(error?.message || error);
      } finally {
        if (!this.stopped) setTimeout(poll, this.config.pollIntervalMs);
      }
    };
    poll();
  }

  startUpstreamWebSocket() {
    if (!this.config.rpcWsUrl) return;
    const connect = () => {
      if (this.stopped) return;
      const ws = new WebSocket(this.config.rpcWsUrl);
      this.ws = ws;
      const subscriptionId = 1;

      ws.addEventListener('open', () => {
        this.state.upstreamWs = true;
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: subscriptionId, method: 'eth_subscribe', params: ['newHeads'] }));
      });
      ws.addEventListener('message', (message) => {
        try {
          const payload = JSON.parse(String(message.data));
          const number = payload?.params?.result?.number;
          if (typeof number === 'string') this.requestSync(hexBlock(number)).catch(() => {});
        } catch {}
      });
      const closed = () => {
        this.state.upstreamWs = false;
        if (!this.stopped) setTimeout(connect, 2000);
      };
      ws.addEventListener('close', closed, { once: true });
      ws.addEventListener('error', () => {
        this.state.upstreamWs = false;
        try { ws.close(); } catch {}
      }, { once: true });
    };
    connect();
  }

  stop() {
    this.stopped = true;
    try { this.ws?.close(); } catch {}
  }
}

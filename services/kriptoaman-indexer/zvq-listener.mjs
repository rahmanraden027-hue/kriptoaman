#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const EXPECTED_CHAIN = '0x560c';
const HTTP_RPC = process.env.ZVQ_INDEXER_HTTP_RPC || 'http://127.0.0.1:8545';
const WS_RPC = process.env.ZVQ_INDEXER_WS_RPC || 'ws://127.0.0.1:8546';
const HOST = '127.0.0.1';
const PORT = Number(process.env.ZVQ_INDEXER_PORT || 8765);
const STATE_DIR = process.env.ZVQ_INDEXER_STATE_DIR || '/var/lib/kriptoaman-indexer';
const CURSOR_FILE = path.join(STATE_DIR, 'zvq-cursor.bin');
const MAX_EVENTS = 250;
const MAX_CATCHUP_BLOCKS = 256;
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

let ws;
let reconnectTimer;
let reconnectAttempt = 0;
let lastHeadAt = 0;
let lastHead = null;
let events = [];
let latencies = [];
let requestId = 10;
let catchupTruncated = false;
let wsSubscribed = false;
let wsSubscriptionId = null;

const now = () => Date.now();

function parseHexInt(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 16);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function safeHash(value) {
  return typeof value === 'string' && HASH_RE.test(value) ? value.toLowerCase() : null;
}

function safeAddress(value) {
  return typeof value === 'string' && ADDRESS_RE.test(value) ? value.toLowerCase() : null;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
}

async function rpc(method, params = []) {
  const response = await fetch(HTTP_RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: requestId++, method, params }),
  });
  if (!response.ok) throw new Error(`RPC ${method} HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.error) throw new Error(payload.error.message || `RPC ${method} failed`);
  return payload.result;
}

// Persist only a validated numeric cursor as a fixed-width binary value.
// Raw network strings, hashes, addresses, transactions and logs never touch disk.
async function persistCursor(blockNumber) {
  if (!Number.isSafeInteger(blockNumber) || blockNumber < 0) throw new Error('invalid cursor block');
  await fs.mkdir(STATE_DIR, { recursive: true, mode: 0o750 });
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(blockNumber), 0);
  const temp = `${CURSOR_FILE}.tmp`;
  await fs.writeFile(temp, buffer, { mode: 0o640 });
  await fs.rename(temp, CURSOR_FILE);
}

async function readCursor() {
  try {
    const buffer = await fs.readFile(CURSOR_FILE);
    if (buffer.length !== 8) return null;
    const value = buffer.readBigUInt64BE(0);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 ? number : null;
  } catch {
    return null;
  }
}

async function processBlock(block, receivedAt = now()) {
  const number = parseHexInt(block?.number);
  const hash = safeHash(block?.hash);
  const parentHash = safeHash(block?.parentHash);
  const blockTimestampSeconds = parseHexInt(block?.timestamp);
  if (number == null || !hash || !parentHash || blockTimestampSeconds == null) return false;

  const blockTimestamp = blockTimestampSeconds * 1000;
  const latency = Math.max(0, receivedAt - blockTimestamp);
  latencies = [...latencies, latency].slice(-500);

  if (lastHead?.number === number && lastHead.hash !== hash) {
    events = events.map(event => event.blockNumber === number && event.blockHash !== hash
      ? { ...event, confirmationState: 'reorged', reorgDetectedAt: receivedAt }
      : event);
  }

  const next = [];
  for (const tx of Array.isArray(block.transactions) ? block.transactions : []) {
    if (tx?.to != null) continue;
    const txHash = safeHash(tx?.hash);
    const from = safeAddress(tx?.from);
    if (!txHash || !from) continue;

    let receipt = null;
    try { receipt = await rpc('eth_getTransactionReceipt', [txHash]); } catch {}
    const contractAddress = safeAddress(receipt?.contractAddress);

    next.push({
      type: 'CONTRACT_CREATION',
      chainId: 22028,
      blockNumber: number,
      blockHash: hash,
      txHash,
      from,
      contractAddress,
      observedAt: receivedAt,
      confirmationState: 'observed',
    });
  }

  events = [...next, ...events].slice(0, MAX_EVENTS);
  lastHead = { number, hash, parentHash, timestamp: blockTimestamp };
  lastHeadAt = receivedAt;
  await persistCursor(number);
  return true;
}

async function processHead(header) {
  const number = parseHexInt(header?.number);
  if (number == null) return;
  const block = await rpc('eth_getBlockByNumber', [`0x${number.toString(16)}`, true]);
  await processBlock(block, now());
}

async function catchUp() {
  const currentHex = await rpc('eth_blockNumber');
  const current = parseHexInt(currentHex);
  if (current == null) throw new Error('invalid current block');
  const cursor = await readCursor();
  const desiredStart = cursor == null ? current : cursor + 1;
  const boundedStart = Math.max(desiredStart, current - MAX_CATCHUP_BLOCKS + 1);
  catchupTruncated = desiredStart < boundedStart;

  for (let number = boundedStart; number <= current; number += 1) {
    const block = await rpc('eth_getBlockByNumber', [`0x${number.toString(16)}`, true]);
    await processBlock(block, now());
  }
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  const delay = Math.min(30000, 1000 * (2 ** Math.min(reconnectAttempt, 5)));
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(connect, delay);
}

async function connect() {
  try {
    const chain = await rpc('eth_chainId');
    if (chain !== EXPECTED_CHAIN) throw new Error(`Unexpected chain ${chain}`);
    await catchUp();
  } catch (error) {
    console.error('chain preflight/catch-up failed', error.message);
    scheduleReconnect();
    return;
  }

  try {
    ws = new WebSocket(WS_RPC);
  } catch (error) {
    console.error('websocket constructor failed', error.message);
    scheduleReconnect();
    return;
  }

  ws.addEventListener('open', () => {
    reconnectAttempt = 0;
    wsSubscribed = false;
    wsSubscriptionId = null;
    ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_subscribe', params: ['newHeads'] }));
  });
  ws.addEventListener('message', event => {
    try {
      const payload = JSON.parse(String(event.data));
      if (payload?.id === 1 && typeof payload?.result === 'string') {
        wsSubscriptionId = payload.result;
        wsSubscribed = true;
        return;
      }
      if (payload?.method === 'eth_subscription'
        && payload?.params?.subscription === wsSubscriptionId
        && payload?.params?.result?.number) {
        processHead(payload.params.result).catch(error => console.error('head processing failed', error.message));
      }
    } catch (error) {
      console.error('websocket message parse failed', error.message);
    }
  });
  ws.addEventListener('close', () => {
    wsSubscribed = false;
    wsSubscriptionId = null;
    scheduleReconnect();
  });
  ws.addEventListener('error', () => {
    wsSubscribed = false;
    try { ws.close(); } catch {}
  });
}

function publicState() {
  const headFresh = lastHeadAt > 0 && now() - lastHeadAt < 30000;
  const fresh = wsSubscribed && headFresh;
  return {
    status: fresh ? 'live' : 'unavailable',
    version: 1,
    network: 'ZEVARYQ Mainnet',
    chainId: 22028,
    chainIdHex: EXPECTED_CHAIN,
    source: { ownership: 'first-party', transport: 'WebSocket+JSON-RPC', ws: 'local-node', http: 'local-node' },
    head: lastHead,
    lastHeadAt: lastHeadAt || null,
    streamFresh: fresh,
    websocketSubscribed: wsSubscribed,
    catchupTruncated,
    events,
    latency: {
      samples: latencies.length,
      p50Ms: percentile(latencies, .50),
      p95Ms: percentile(latencies, .95),
      p99Ms: percentile(latencies, .99),
    },
    publishedAt: now(),
  };
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' || !['/health', '/v1/discovery'].includes(req.url)) {
    res.writeHead(404).end();
    return;
  }
  const state = publicState();
  const body = req.url === '/health'
    ? { status: state.status, chainId: state.chainId, websocketSubscribed: state.websocketSubscribed, lastHeadAt: state.lastHeadAt, head: state.head, catchupTruncated }
    : state;
  res.writeHead(state.status === 'live' ? 200 : 503, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(body));
});

server.listen(PORT, HOST, () => {
  console.log(`KriptoAman ZEVARYQ first-party indexer listening on http://${HOST}:${PORT}`);
  connect();
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    clearTimeout(reconnectTimer);
    try { ws?.close(); } catch {}
    server.close(() => process.exit(0));
  });
}

const RPC_URL = 'https://rpc.kriptoaman.com/';
const EXPLORER_BLOCKS_URL = 'https://explorer.kriptoaman.com/api/v2/blocks';
const EXPECTED_CHAIN_ID = 22028;
const EXPECTED_CHAIN_ID_HEX = '0x560c';
const BLOCK_WINDOW = 5;
const RPC_TIMEOUT_MS = 5_000;
const EXPLORER_TIMEOUT_MS = 5_000;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=1, s-maxage=2, stale-while-revalidate=4',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });

function hexToNumber(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 16);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function safeHash(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value) ? value.toLowerCase() : null;
}

function safeAddress(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) ? value.toLowerCase() : null;
}

async function withTimeout(task, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

let requestId = 1;
async function rpc(method, params = []) {
  return withTimeout(async (signal) => {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: 'https://kriptoaman.com',
        'User-Agent': 'KriptoAman-Live-Block-Flow/1.0',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: requestId++, method, params }),
      signal,
    });
    if (!response.ok) throw new Error(`RPC ${method} HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.error || payload?.result == null) throw new Error(payload?.error?.message || `RPC ${method} invalid response`);
    return payload.result;
  }, RPC_TIMEOUT_MS);
}

async function optionalRpc(method, params = []) {
  const startedAt = Date.now();
  try {
    return {
      available: true,
      result: await rpc(method, params),
      latencyMs: Date.now() - startedAt,
      reason: null,
    };
  } catch (error) {
    return {
      available: false,
      result: null,
      latencyMs: Date.now() - startedAt,
      reason: error?.name === 'AbortError' ? 'timeout' : 'not-publicly-available',
    };
  }
}

async function explorerHead() {
  const startedAt = Date.now();
  try {
    const payload = await withTimeout(async (signal) => {
      const response = await fetch(EXPLORER_BLOCKS_URL, {
        headers: { Accept: 'application/json', 'User-Agent': 'KriptoAman-Live-Block-Flow/1.0' },
        signal,
      });
      if (!response.ok) throw new Error(`Explorer HTTP ${response.status}`);
      return response.json();
    }, EXPLORER_TIMEOUT_MS);
    const height = Number(payload?.items?.[0]?.height);
    return {
      ok: Number.isSafeInteger(height) && height >= 0,
      height: Number.isSafeInteger(height) && height >= 0 ? height : null,
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return { ok: false, height: null, latencyMs: Date.now() - startedAt };
  }
}

function normalizeBlock(block, head) {
  const number = hexToNumber(block?.number);
  const timestampSeconds = hexToNumber(block?.timestamp);
  if (number == null || timestampSeconds == null) return null;
  const hash = safeHash(block?.hash);
  if (!hash) return null;
  return {
    number,
    hash,
    parentHash: safeHash(block?.parentHash),
    timestamp: timestampSeconds * 1000,
    txCount: Array.isArray(block?.transactions) ? block.transactions.length : 0,
    gasUsed: hexToNumber(block?.gasUsed),
    gasLimit: hexToNumber(block?.gasLimit),
    proposer: safeAddress(block?.miner),
    confirmations: Math.max(0, head - number),
  };
}

export async function onRequestGet() {
  const startedAt = Date.now();
  const observationId = crypto.randomUUID();

  try {
    const rpcStartedAt = Date.now();
    const [chainIdHex, headHex, syncingProbe, peerProbe, validatorProbe] = await Promise.all([
      rpc('eth_chainId'),
      rpc('eth_blockNumber'),
      optionalRpc('eth_syncing'),
      optionalRpc('net_peerCount'),
      optionalRpc('qbft_getValidatorsByBlockNumber', ['latest']),
    ]);
    const rpcIdentityLatencyMs = Date.now() - rpcStartedAt;

    if (String(chainIdHex).toLowerCase() !== EXPECTED_CHAIN_ID_HEX) {
      return json({
        status: 'unavailable',
        code: 'CHAIN_ID_MISMATCH',
        expected: EXPECTED_CHAIN_ID_HEX,
        actual: chainIdHex,
        observationId,
      }, 503);
    }

    const head = hexToNumber(headHex);
    if (head == null) {
      return json({ status: 'unavailable', code: 'INVALID_HEAD', observationId }, 503);
    }

    const heights = Array.from({ length: BLOCK_WINDOW }, (_, index) => head - index).filter((height) => height >= 0);
    const blockStartedAt = Date.now();
    const [rawBlocks, explorer] = await Promise.all([
      Promise.all(heights.map((height) => rpc('eth_getBlockByNumber', [`0x${height.toString(16)}`, false]))),
      explorerHead(),
    ]);
    const blockFetchLatencyMs = Date.now() - blockStartedAt;

    const blocks = rawBlocks
      .map((block) => normalizeBlock(block, head))
      .filter(Boolean)
      .sort((a, b) => b.number - a.number);

    if (!blocks.length || blocks[0].number !== head) {
      return json({ status: 'unavailable', code: 'HEAD_BLOCK_UNAVAILABLE', observationId }, 503);
    }

    const intervals = [];
    for (let index = 0; index < blocks.length - 1; index += 1) {
      const seconds = (blocks[index].timestamp - blocks[index + 1].timestamp) / 1000;
      if (Number.isFinite(seconds) && seconds >= 0 && seconds < 600) intervals.push(seconds);
    }
    const averageBlockTimeSeconds = intervals.length
      ? Number((intervals.reduce((sum, value) => sum + value, 0) / intervals.length).toFixed(2))
      : null;

    const indexedHead = explorer.ok ? explorer.height : null;
    const indexerLagBlocks = indexedHead == null ? null : Math.max(0, head - indexedHead);
    const observedProposers = [...new Set(blocks.map((block) => block.proposer).filter(Boolean))];

    const peerCount = peerProbe.available ? hexToNumber(peerProbe.result) : null;
    const validatorAddresses = validatorProbe.available && Array.isArray(validatorProbe.result)
      ? validatorProbe.result.map(safeAddress).filter(Boolean)
      : [];
    const validatorSetAvailable = validatorProbe.available
      && Array.isArray(validatorProbe.result)
      && validatorAddresses.length === validatorProbe.result.length;
    const syncStatus = syncingProbe.available
      ? syncingProbe.result === false
        ? 'synced'
        : typeof syncingProbe.result === 'object' && syncingProbe.result !== null
          ? 'syncing'
          : 'unavailable'
      : 'unavailable';

    return json({
      status: 'live',
      schemaVersion: 1,
      network: 'ZEVARYQ Mainnet',
      symbol: 'ZVQ',
      chainId: EXPECTED_CHAIN_ID,
      chainIdHex: EXPECTED_CHAIN_ID_HEX,
      head: {
        number: head,
        hash: blocks[0].hash,
        timestamp: blocks[0].timestamp,
      },
      blocks,
      metrics: {
        averageBlockTimeSeconds,
        latestTxCount: blocks[0].txCount,
        rpcIdentityLatencyMs,
        blockFetchLatencyMs,
        explorerLatencyMs: explorer.latencyMs,
        indexedHead,
        indexerLagBlocks,
      },
      networkEvidence: {
        sync: {
          available: syncingProbe.available,
          status: syncStatus,
          latencyMs: syncingProbe.latencyMs,
          reason: syncingProbe.available ? null : syncingProbe.reason,
        },
        peerCount: {
          available: peerProbe.available && Number.isSafeInteger(peerCount),
          count: Number.isSafeInteger(peerCount) ? peerCount : null,
          latencyMs: peerProbe.latencyMs,
          reason: peerProbe.available && Number.isSafeInteger(peerCount) ? null : peerProbe.reason || 'invalid-response',
        },
        validatorSet: {
          available: validatorSetAvailable,
          count: validatorSetAvailable ? validatorAddresses.length : null,
          addresses: validatorSetAvailable ? validatorAddresses : [],
          latencyMs: validatorProbe.latencyMs,
          reason: validatorSetAvailable ? null : validatorProbe.reason || 'invalid-response',
          evidenceType: validatorSetAvailable ? 'public-qbft-rpc' : 'unavailable',
        },
        observedProposers: {
          available: observedProposers.length > 0,
          count: observedProposers.length,
          addresses: observedProposers,
          sampleBlocks: blocks.length,
          evidenceType: 'recent-public-blocks',
        },
      },
      provenance: {
        ownership: 'first-party',
        rpcEndpoint: 'rpc.kriptoaman.com',
        explorerEndpoint: 'explorer.kriptoaman.com/api/v2/blocks',
        transport: ['JSON-RPC', 'Blockscout v2'],
        externalMarketProviderUsed: false,
      },
      truthPolicy: {
        animationAdvancesOnlyWithVerifiedHeadIncrease: true,
        syntheticBlocksAllowed: false,
        propagationLatencyMeasured: false,
        indexerLagIsBlockHeightDifference: true,
        optionalPeerCountIsNeverInferred: true,
        validatorSetIsShownOnlyWhenPublicQbftRpcReturnsIt: true,
        proposerEvidenceIsNotValidatorSetEvidence: true,
      },
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      observationId,
    });
  } catch (error) {
    return json({
      status: 'unavailable',
      code: error?.name === 'AbortError' ? 'LIVE_BLOCK_TIMEOUT' : 'LIVE_BLOCK_UNAVAILABLE',
      message: error?.message || 'ZEVARYQ live block data unavailable',
      chainId: EXPECTED_CHAIN_ID,
      chainIdHex: EXPECTED_CHAIN_ID_HEX,
      truthPolicy: {
        animationAdvancesOnlyWithVerifiedHeadIncrease: true,
        syntheticBlocksAllowed: false,
        propagationLatencyMeasured: false,
      },
      checkedAt: new Date().toISOString(),
      observationId,
    }, 503);
  }
}

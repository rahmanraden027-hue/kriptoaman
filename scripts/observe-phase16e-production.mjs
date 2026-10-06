import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import manifest from '../release/phase16e-production-observation-baseline.json' with { type: 'json' };

const BASE = process.env.PHASE16E_BASE_URL || 'https://kriptoaman.com';
const EXPLORER = process.env.PHASE16E_EXPLORER_URL || 'https://explorer.kriptoaman.com';
const RPC = process.env.PHASE16E_RPC_URL || 'https://rpc.kriptoaman.com';
const evidenceDir = resolve(process.env.PHASE16E_EVIDENCE_DIR || 'phase16e-observation');
const runId = String(process.env.GITHUB_RUN_ID || 'manual').replace(/[^0-9A-Za-z_-]/g, '');
const policy = manifest.observationPolicy;

await mkdir(evidenceDir, { recursive: true });

const now = () => Date.now();
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));
const finite = value => Number.isFinite(Number(value));
const safeBlock = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const startedAt = now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'KriptoAman-Phase16E-Observation/1.0',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' ' + url + ': ' + JSON.stringify(payload));
    }
    return { payload, latencyMs: now() - startedAt, status: response.status };
  } finally {
    clearTimeout(timeout);
  }
}

async function rpc(method, id) {
  const startedAt = now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(RPC, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: BASE,
        'User-Agent': 'KriptoAman-Phase16E-Observation/1.0',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params: [] }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.error || payload?.result == null) {
      throw new Error('RPC ' + method + ' failed: ' + JSON.stringify(payload));
    }
    return { result: payload.result, latencyMs: now() - startedAt };
  } finally {
    clearTimeout(timeout);
  }
}

function explorerHeight(payload) {
  const height = Number(payload?.items?.[0]?.height);
  return Number.isSafeInteger(height) && height > 0 ? height : null;
}

function marketAgeMs(payload) {
  const capturedAt = Number(payload?.capturedAt);
  return Number.isFinite(capturedAt) && capturedAt > 0 ? Math.max(0, now() - capturedAt) : null;
}

async function sample(label, includeStatic = false) {
  const cacheBust = encodeURIComponent(runId + '-' + label + '-' + now());
  const tasks = {
    network: fetchJson(BASE + '/api/kam/network-status?phase16e=' + cacheBust),
    onChain: fetchJson(BASE + '/api/zvq-token-intelligence?phase16e=' + cacheBust, {}, 20000),
    explorerBlocks: fetchJson(EXPLORER + '/api/v2/blocks'),
    rpcChain: rpc('eth_chainId', label + '-chain'),
    rpcBlock: rpc('eth_blockNumber', label + '-block'),
  };

  if (includeStatic) {
    tasks.health = fetchJson(BASE + '/api/health?phase16e=' + cacheBust);
    tasks.market = fetchJson(BASE + '/api/market-snapshot-page?page=0&limit=100&phase16e=' + cacheBust);
    tasks.explorerNetwork = fetchJson(EXPLORER + '/developer/network.json?phase16e=' + cacheBust);
  }

  const entries = await Promise.all(Object.entries(tasks).map(async ([key, promise]) => [key, await promise]));
  return Object.fromEntries(entries);
}

const warnings = [];
const assertions = [];

function hard(condition, message, details = null) {
  assertions.push({ type: 'hard', pass: Boolean(condition), message, details });
  if (!condition) throw new Error(message + (details ? ': ' + JSON.stringify(details) : ''));
}

function warn(condition, message, details = null) {
  const pass = Boolean(condition);
  assertions.push({ type: 'warning', pass, message, details });
  if (!pass) warnings.push({ message, details });
}

const sample1 = await sample('s1', true);
await sleep(policy.sampleIntervalMs);
const sample2 = await sample('s2', false);

const expected = manifest.expectedChain;
const n1 = sample1.network.payload;
const n2 = sample2.network.payload;
const o1 = sample1.onChain.payload;
const o2 = sample2.onChain.payload;
const market = sample1.market.payload;
const health = sample1.health.payload;
const explorerNetwork = sample1.explorerNetwork.payload;

hard(n1?.live === true && n1?.verified === true, 'ZEVARYQ network sample 1 must be live and verified');
hard(n2?.live === true && n2?.verified === true, 'ZEVARYQ network sample 2 must be live and verified');
hard(Number(n1?.chainId) === expected.chainId && String(n1?.chainIdHex).toLowerCase() === expected.chainIdHex, 'ZEVARYQ network identity mismatch in sample 1');
hard(Number(n2?.chainId) === expected.chainId && String(n2?.chainIdHex).toLowerCase() === expected.chainIdHex, 'ZEVARYQ network identity mismatch in sample 2');
hard(String(n1?.syncStatus).toLowerCase() === 'synced' && String(n2?.syncStatus).toLowerCase() === 'synced', 'ZEVARYQ network must remain synced');
hard(safeBlock(n1?.blockNumber) && safeBlock(n2?.blockNumber), 'ZEVARYQ network block height must be available');
hard(Number(n2.blockNumber) >= Number(n1.blockNumber), 'ZEVARYQ network block height moved backward');

hard(o1?.status === 'live' && o2?.status === 'live', 'ZEVARYQ on-chain evidence must remain live');
hard(Number(o1?.chainId) === expected.chainId && Number(o2?.chainId) === expected.chainId, 'On-chain evidence Chain ID mismatch');
hard(o1?.provenance?.ownership === 'first-party' && o2?.provenance?.ownership === 'first-party', 'On-chain evidence must remain first-party');
hard(o1?.provenance?.endpoint === 'rpc.kriptoaman.com' && o2?.provenance?.endpoint === 'rpc.kriptoaman.com', 'On-chain evidence endpoint mismatch');
hard(safeBlock(o1?.head?.number) && safeBlock(o2?.head?.number), 'On-chain evidence head must be available');
hard(Number(o2.head.number) >= Number(o1.head.number), 'On-chain evidence head moved backward');

hard(String(sample1.rpcChain.result).toLowerCase() === expected.chainIdHex, 'RPC sample 1 Chain ID mismatch');
hard(String(sample2.rpcChain.result).toLowerCase() === expected.chainIdHex, 'RPC sample 2 Chain ID mismatch');
hard(/^0x[0-9a-f]+$/i.test(String(sample1.rpcBlock.result)) && /^0x[0-9a-f]+$/i.test(String(sample2.rpcBlock.result)), 'RPC block result malformed');
const rpcBlock1 = Number.parseInt(sample1.rpcBlock.result, 16);
const rpcBlock2 = Number.parseInt(sample2.rpcBlock.result, 16);
hard(safeBlock(rpcBlock1) && safeBlock(rpcBlock2), 'RPC block height unavailable');
if (policy.rpcProgressRequired) hard(rpcBlock2 > rpcBlock1, 'RPC block height did not advance', { rpcBlock1, rpcBlock2 });

const explorerBlock1 = explorerHeight(sample1.explorerBlocks.payload);
const explorerBlock2 = explorerHeight(sample2.explorerBlocks.payload);
hard(safeBlock(explorerBlock1) && safeBlock(explorerBlock2), 'Explorer indexed height unavailable');
hard(explorerBlock2 >= explorerBlock1, 'Explorer indexed height moved backward');
hard(Number(explorerNetwork?.chainId) === expected.chainId, 'Explorer Chain ID mismatch');
hard(String(explorerNetwork?.chainIdHex).toLowerCase() === expected.chainIdHex, 'Explorer Chain ID hex mismatch');
hard(explorerNetwork?.nativeCurrency?.symbol === expected.symbol, 'Explorer native symbol mismatch');

const totalAssets = Number(market?.totalAssets);
const ageMs = marketAgeMs(market);
hard(Number.isFinite(totalAssets) && totalAssets >= policy.marketAssetFloor, 'Market asset coverage below Phase 16E floor', { totalAssets, floor: policy.marketAssetFloor });
hard(Number.isFinite(ageMs) && ageMs <= policy.marketFreshnessMs, 'Market snapshot exceeded freshness budget', { ageMs, freshnessMs: policy.marketFreshnessMs });
warn(ageMs <= policy.marketWarningAgeMs, 'Market snapshot is inside hard freshness budget but above preferred age', { ageMs, preferredMs: policy.marketWarningAgeMs });

hard(health?.ok === true && health?.overall !== 'outage', 'Production health endpoint is not healthy');
hard(['ok', 'degraded'].includes(health?.overall), 'Production health endpoint returned unknown state', { overall: health?.overall });

const crossSurfaceDelta1 = Math.abs(Number(n1.blockNumber) - Number(o1.head.number));
const crossSurfaceDelta2 = Math.abs(Number(n2.blockNumber) - Number(o2.head.number));
hard(crossSurfaceDelta1 <= policy.maximumCrossSurfaceBlockDelta, 'Network/on-chain sample 1 drift exceeded baseline', { crossSurfaceDelta1 });
hard(crossSurfaceDelta2 <= policy.maximumCrossSurfaceBlockDelta, 'Network/on-chain sample 2 drift exceeded baseline', { crossSurfaceDelta2 });

const explorerLag1 = Math.max(0, rpcBlock1 - explorerBlock1);
const explorerLag2 = Math.max(0, rpcBlock2 - explorerBlock2);
hard(explorerLag1 <= policy.explorerMaximumLagBlocks && explorerLag2 <= policy.explorerMaximumLagBlocks, 'Explorer index lag exceeded maximum baseline', { explorerLag1, explorerLag2 });
warn(explorerLag1 <= policy.explorerWarningLagBlocks && explorerLag2 <= policy.explorerWarningLagBlocks, 'Explorer index lag is above preferred baseline', { explorerLag1, explorerLag2 });

const networkProbe1 = Number(n1?.probeDurationMs);
const networkProbe2 = Number(n2?.probeDurationMs);
hard(finite(networkProbe1) && finite(networkProbe2) && networkProbe1 <= policy.maxNetworkProbeMs && networkProbe2 <= policy.maxNetworkProbeMs, 'Network RPC probe exceeded hard latency baseline', { networkProbe1, networkProbe2 });
warn(networkProbe1 <= policy.networkWarningProbeMs && networkProbe2 <= policy.networkWarningProbeMs, 'Network RPC probe is above preferred latency baseline', { networkProbe1, networkProbe2 });

const onChainLatency1 = Number(o1?.latencyMs);
const onChainLatency2 = Number(o2?.latencyMs);
hard(finite(onChainLatency1) && finite(onChainLatency2) && onChainLatency1 <= policy.maxOnChainLatencyMs && onChainLatency2 <= policy.maxOnChainLatencyMs, 'On-chain evidence exceeded hard latency baseline', { onChainLatency1, onChainLatency2 });
warn(onChainLatency1 <= policy.onChainWarningLatencyMs && onChainLatency2 <= policy.onChainWarningLatencyMs, 'On-chain evidence is above preferred latency baseline', { onChainLatency1, onChainLatency2 });

const summary = {
  phase: '16E',
  result: warnings.length ? 'STABLE_WITH_WARNINGS' : 'STABLE',
  checkedAt: new Date().toISOString(),
  architectureFrozen: manifest.architectureFrozen,
  visualBaseline: manifest.visualBaseline,
  chain: {
    chainId: expected.chainId,
    chainIdHex: expected.chainIdHex,
    symbol: expected.symbol,
    rpcBlock1,
    rpcBlock2,
    networkBlock1: Number(n1.blockNumber),
    networkBlock2: Number(n2.blockNumber),
    onChainHead1: Number(o1.head.number),
    onChainHead2: Number(o2.head.number),
    explorerBlock1,
    explorerBlock2,
    explorerLag1,
    explorerLag2
  },
  market: {
    totalAssets,
    capturedAt: market?.capturedAt || null,
    ageMs,
    source: market?.source || null,
    delivery: market?.delivery || null
  },
  latency: {
    networkProbe1,
    networkProbe2,
    onChainLatency1,
    onChainLatency2,
    directRpc1: sample1.rpcBlock.latencyMs,
    directRpc2: sample2.rpcBlock.latencyMs
  },
  health: {
    overall: health?.overall || null,
    checkedAt: health?.checked_at || null
  },
  warnings,
  assertions,
  mutationPolicy: manifest.mutationPolicy
};

await writeFile(join(evidenceDir, 'phase16e-production-observation.json'), JSON.stringify(summary, null, 2) + '\n');
console.log('PHASE16E_PRODUCTION_OBSERVATION=' + summary.result);
console.log(JSON.stringify(summary, null, 2));

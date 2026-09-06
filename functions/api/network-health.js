import { primarySession, readSession } from '../_shared/d1-session.js';

const DEFAULT_PROVIDER_TIMEOUT_MS = 2500;
const SLOW_PROVIDER_TIMEOUT_MS = 3500;
const EXTENDED_PROVIDER_TIMEOUT_MS = 5000;
const SNAPSHOT_TTL_MS = 45_000;
const STALE_SNAPSHOT_MAX_AGE_MS = 5 * 60 * 1000;
const LAST_GOOD_TTL_MS = 10 * 60 * 1000;
const MIN_ACTIVE_TARGET = 12;

const NETWORKS = [
  { name: 'Bitcoin', type: 'bitcoin', timeoutMs: SLOW_PROVIDER_TIMEOUT_MS, urls: ['https://mempool.space/api/blocks/tip/height', 'https://blockstream.info/api/blocks/tip/height'] },
  { name: 'Ethereum', type: 'evm', urls: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'] },
  { name: 'BNB Chain', type: 'evm', urls: ['https://bsc-dataseed.binance.org', 'https://bsc-rpc.publicnode.com'] },
  { name: 'Polygon', type: 'evm', urls: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon.drpc.org'] },
  { name: 'Arbitrum', type: 'evm', urls: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'] },
  { name: 'Optimism', type: 'evm', urls: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com'] },
  { name: 'Base', type: 'evm', urls: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com', 'https://base-mainnet.public.blastapi.io'] },
  { name: 'Avalanche', type: 'evm', urls: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-c-chain-rpc.publicnode.com'] },
  { name: 'Gnosis', type: 'evm', urls: ['https://rpc.gnosischain.com', 'https://gnosis-rpc.publicnode.com'] },
  { name: 'Celo', type: 'evm', urls: ['https://forno.celo.org', 'https://celo-rpc.publicnode.com'] },
  { name: 'Linea', type: 'evm', urls: ['https://rpc.linea.build', 'https://linea-rpc.publicnode.com'] },
  { name: 'Scroll', type: 'evm', urls: ['https://rpc.scroll.io', 'https://scroll-rpc.publicnode.com'] },
  { name: 'Mantle', type: 'evm', urls: ['https://rpc.mantle.xyz', 'https://mantle-rpc.publicnode.com'] },
  { name: 'Fantom', type: 'evm', urls: ['https://rpcapi.fantom.network', 'https://fantom.publicnode.com'] },
  { name: 'Solana', type: 'solana', timeoutMs: SLOW_PROVIDER_TIMEOUT_MS, urls: ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'] },
  { name: 'TRON', type: 'tron', timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS, urls: ['https://api.trongrid.io/wallet/getnowblock', 'https://tron-evm-rpc.publicnode.com'] },
  { name: 'XRP Ledger', type: 'xrp', timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS, urls: ['https://honeycluster.io/', 'https://xrplcluster.com', 'https://s1.ripple.com:51234/', 'https://s2.ripple.com:51234/'] },
  { name: 'Polkadot', type: 'polkadot', timeoutMs: SLOW_PROVIDER_TIMEOUT_MS, urls: ['https://rpc.polkadot.io', 'https://polkadot-rpc.publicnode.com'] },
  { name: 'Cardano', type: 'cardano', timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS, urls: ['https://api.koios.rest/api/v1/tip?select=block_no'] },
  { name: 'Litecoin', type: 'utxo', timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS, urls: ['https://litecoinspace.org/api/blocks/tip/height', 'https://ltc1.trezor.io/api/v2', 'https://ltc2.trezor.io/api/v2', 'https://api.blockchair.com/litecoin/stats', 'https://api.blockcypher.com/v1/ltc/main'] },
  { name: 'Dogecoin', type: 'utxo', timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS, urls: ['https://doge1.trezor.io/api/v2', 'https://doge2.trezor.io/api/v2', 'https://dogecoin.atomicwallet.io/api/v2', 'https://api.blockchair.com/dogecoin/stats', 'https://api.blockcypher.com/v1/doge/main'] },
];

const DURABLE_SNAPSHOT_SCHEMA = `
CREATE TABLE IF NOT EXISTS network_health_snapshots (
  id TEXT PRIMARY KEY,
  captured_at INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=240',
  'X-Content-Type-Options': 'nosniff',
};

let cachedSnapshot = null;
let cachedSnapshotAt = 0;
let refreshInFlight = null;
let durableSchemaReady = false;
const lastGoodByNetwork = new Map();

function json(data, init = {}, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...HEADERS, ...(init.headers || {}), ...extraHeaders },
  });
}

const scheduleBackground = (waitUntil, task) => {
  if (typeof waitUntil === 'function') waitUntil(task);
  else task.catch(() => undefined);
};

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const rpcBody = (method, params = []) => JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });

function requestHeaders(extra = {}) {
  return {
    Accept: 'application/json,text/plain,*/*',
    'User-Agent': 'KriptoAman-Network-Health/4.1',
    ...extra,
  };
}

async function probeUrl(item, url) {
  const started = Date.now();
  const timeoutMs = Number(item.timeoutMs) || DEFAULT_PROVIDER_TIMEOUT_MS;
  let response;
  let responseMode = 'json';

  if (item.type === 'evm') {
    response = await fetchWithTimeout(url, { method: 'POST', headers: requestHeaders({ 'Content-Type': 'application/json' }), body: rpcBody('eth_blockNumber') }, timeoutMs);
  } else if (item.type === 'solana') {
    response = await fetchWithTimeout(url, { method: 'POST', headers: requestHeaders({ 'Content-Type': 'application/json' }), body: rpcBody('getBlockHeight') }, timeoutMs);
  } else if (item.type === 'xrp') {
    response = await fetchWithTimeout(url, { method: 'POST', headers: requestHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ method: 'server_info', params: [{}] }) }, timeoutMs);
  } else if (item.type === 'polkadot') {
    response = await fetchWithTimeout(url, { method: 'POST', headers: requestHeaders({ 'Content-Type': 'application/json' }), body: rpcBody('chain_getHeader') }, timeoutMs);
  } else if (item.type === 'tron') {
    response = url === 'https://tron-evm-rpc.publicnode.com'
      ? await fetchWithTimeout(url, { method: 'POST', headers: requestHeaders({ 'Content-Type': 'application/json' }), body: rpcBody('eth_blockNumber') }, timeoutMs)
      : await fetchWithTimeout(url, { method: 'POST', headers: requestHeaders({ 'Content-Type': 'application/json' }), body: '{}' }, timeoutMs);
  } else if (item.type === 'utxo' && url.includes('/blocks/tip/height')) {
    responseMode = 'height-text';
    response = await fetchWithTimeout(url, { headers: requestHeaders() }, timeoutMs);
  } else {
    response = await fetchWithTimeout(url, { headers: requestHeaders() }, timeoutMs);
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  let detail = 'ok';
  if (item.type === 'bitcoin' || responseMode === 'height-text') {
    const height = Number((await response.text()).trim());
    if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid block height response');
    detail = String(height);
  } else {
    const payload = await response.json().catch(() => null);
    if (item.type === 'evm') {
      if (!payload?.result) throw new Error('Invalid EVM RPC response');
      detail = payload.result;
    } else if (item.type === 'solana') {
      if (!Number.isFinite(Number(payload?.result)) || Number(payload.result) <= 0) throw new Error('Invalid Solana response');
      detail = String(payload.result);
    } else if (item.type === 'xrp') {
      const seq = payload?.result?.info?.validated_ledger?.seq;
      if (!seq) throw new Error('Invalid XRP response');
      detail = String(seq);
    } else if (item.type === 'polkadot') {
      if (!payload?.result?.number) throw new Error('Invalid Polkadot response');
      detail = payload.result.number;
    } else if (item.type === 'tron') {
      const fullNodeBlock = payload?.block_header?.raw_data?.number;
      const evmBlock = payload?.result;
      if (!fullNodeBlock && !evmBlock) throw new Error('Invalid TRON response');
      detail = fullNodeBlock ? String(fullNodeBlock) : String(evmBlock);
    } else if (item.type === 'cardano') {
      if (!Array.isArray(payload) || !payload[0]?.block_no) throw new Error('Invalid Cardano response');
      detail = String(payload[0].block_no);
    } else if (item.type === 'utxo') {
      const height = Number(payload?.blockbook?.bestHeight ?? payload?.backend?.blocks ?? payload?.bestHeight ?? payload?.data?.blocks ?? payload?.data?.best_block_height ?? payload?.height);
      if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid UTXO chain response');
      detail = String(height);
    }
  }

  return {
    name: item.name,
    status: 'online',
    latency: Date.now() - started,
    provider: new URL(url).hostname,
    timeout_ms: timeoutMs,
    detail,
    checked_at: new Date().toISOString(),
  };
}

function providerFailure(url, error) {
  const failure = new Error(error?.message || 'provider unavailable');
  failure.provider = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  failure.reason = error?.name === 'AbortError' ? 'timeout' : error?.status ? `http_${error.status}` : 'unavailable';
  return failure;
}

async function probe(item) {
  const attempts = item.urls.map(async (url) => {
    try {
      return await probeUrl(item, url);
    } catch (error) {
      throw providerFailure(url, error);
    }
  });

  try {
    const result = await Promise.any(attempts);
    lastGoodByNetwork.set(item.name, { ...result, remembered_at: Date.now() });
    return result;
  } catch (aggregate) {
    const errors = Array.isArray(aggregate?.errors)
      ? aggregate.errors.map((error) => ({ provider: error?.provider || 'unknown', reason: error?.reason || 'unavailable' }))
      : [];
    const previous = lastGoodByNetwork.get(item.name);
    const lastKnownAgeMs = previous ? Date.now() - Number(previous.remembered_at || 0) : null;
    const hasRecentLastGood = previous && Number.isFinite(lastKnownAgeMs) && lastKnownAgeMs <= LAST_GOOD_TTL_MS;

    return {
      name: item.name,
      status: hasRecentLastGood ? 'degraded' : 'offline',
      latency: null,
      error: 'all_providers_unavailable',
      timeout_ms: Number(item.timeoutMs) || DEFAULT_PROVIDER_TIMEOUT_MS,
      providers_tried: errors,
      last_known_good: hasRecentLastGood ? { provider: previous.provider, detail: previous.detail, checked_at: previous.checked_at, age_ms: lastKnownAgeMs } : null,
      checked_at: new Date().toISOString(),
    };
  }
}

async function buildSnapshot() {
  const networks = await Promise.all(NETWORKS.map(probe));
  const online = networks.filter((item) => item.status === 'online').length;
  const degraded = networks.filter((item) => item.status === 'degraded').length;
  const total = networks.length;
  const offline = total - online - degraded;
  const checkedAt = new Date().toISOString();

  return {
    summary: {
      total,
      online,
      degraded,
      offline,
      health_pct: total ? Math.round((online / total) * 100) : 0,
      minimum_active_target: MIN_ACTIVE_TARGET,
      meets_minimum_active_target: online >= MIN_ACTIVE_TARGET,
    },
    networks,
    checked_at: checkedAt,
    policy: {
      liveOnlineRequiresSuccessfulCurrentProbe: true,
      lastKnownGoodNeverCountsAsOnline: true,
      defaultProviderTimeoutMs: DEFAULT_PROVIDER_TIMEOUT_MS,
      slowProviderTimeoutMs: SLOW_PROVIDER_TIMEOUT_MS,
      extendedProviderTimeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS,
      snapshotTtlMs: SNAPSHOT_TTL_MS,
      staleSnapshotMaxAgeMs: STALE_SNAPSHOT_MAX_AGE_MS,
      lastGoodTtlMs: LAST_GOOD_TTL_MS,
      publicRequestsMayUseRecentVerifiedSnapshot: true,
      refreshParameterAlwaysForcesFreshProbe: true,
      durableFreshSnapshotMaxAgeMs: SNAPSHOT_TTL_MS,
      durableRecentSnapshotMaxAgeMs: STALE_SNAPSHOT_MAX_AGE_MS,
      durableRecentSnapshotTriggersBackgroundRefresh: true,
      durableSnapshotCrossPop: true,
      fabricatedMetrics: false,
    },
  };
}

function isCompleteVerifiedSnapshot(snapshot) {
  const total = Number(snapshot?.summary?.total);
  const online = Number(snapshot?.summary?.online);
  const degraded = Number(snapshot?.summary?.degraded);
  const offline = Number(snapshot?.summary?.offline);
  const target = Number(snapshot?.summary?.minimum_active_target);
  return Boolean(
    Array.isArray(snapshot?.networks)
      && snapshot.networks.length === NETWORKS.length
      && total === NETWORKS.length
      && Number.isFinite(online)
      && Number.isFinite(degraded)
      && Number.isFinite(offline)
      && online >= 0
      && degraded >= 0
      && offline >= 0
      && online + degraded + offline === total
      && target === MIN_ACTIVE_TARGET,
  );
}

async function readDurableSnapshot(env) {
  if (!env?.AUTH_DB) return null;
  try {
    const db = readSession(env.AUTH_DB);
    const row = await db.prepare(
      'SELECT captured_at, payload FROM network_health_snapshots WHERE id = ?',
    ).bind('global').first();
    if (!row) return null;
    const capturedAt = Number(row.captured_at);
    const ageMs = Number.isFinite(capturedAt) ? Math.max(0, Date.now() - capturedAt) : Infinity;
    if (ageMs > STALE_SNAPSHOT_MAX_AGE_MS) return null;
    const snapshot = JSON.parse(row.payload);
    if (!isCompleteVerifiedSnapshot(snapshot)) return null;
    return { snapshot, ageMs, fresh: ageMs < SNAPSHOT_TTL_MS };
  } catch {
    return null;
  }
}

async function ensureDurableSchema(db) {
  if (durableSchemaReady) return;
  await db.prepare(DURABLE_SNAPSHOT_SCHEMA).run();
  durableSchemaReady = true;
}

async function persistDurableSnapshot(env, snapshot) {
  if (!env?.AUTH_DB || !isCompleteVerifiedSnapshot(snapshot)) return false;
  try {
    const db = primarySession(env.AUTH_DB);
    await ensureDurableSchema(db);
    await db.prepare(`
      INSERT INTO network_health_snapshots (id, captured_at, payload, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        captured_at = excluded.captured_at,
        payload = excluded.payload,
        updated_at = CURRENT_TIMESTAMP
    `).bind('global', Date.now(), JSON.stringify(snapshot)).run();
    return true;
  } catch (error) {
    console.error('Unable to persist durable network health snapshot', {
      error: error?.message || String(error),
    });
    return false;
  }
}

function startRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = buildSnapshot()
      .then((snapshot) => {
        cachedSnapshot = snapshot;
        cachedSnapshotAt = Date.now();
        return snapshot;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function getSnapshot(forceRefresh = false, waitUntil, env) {
  const now = Date.now();
  const ageMs = cachedSnapshot ? now - cachedSnapshotAt : null;

  if (forceRefresh) {
    const snapshot = await startRefresh();
    scheduleBackground(waitUntil, persistDurableSnapshot(env, snapshot));
    return { snapshot, deliveryMode: 'fresh-probe', ageMs: 0 };
  }

  if (cachedSnapshot && Number.isFinite(ageMs) && ageMs < SNAPSHOT_TTL_MS) {
    return { snapshot: cachedSnapshot, deliveryMode: 'memory-fresh', ageMs };
  }

  const durable = await readDurableSnapshot(env);
  if (durable) {
    scheduleBackground(
      waitUntil,
      startRefresh().then((snapshot) => persistDurableSnapshot(env, snapshot)),
    );
    return {
      snapshot: durable.snapshot,
      deliveryMode: durable.fresh ? 'd1-recent-verified' : 'd1-recent-verified-background-refresh',
      ageMs: durable.ageMs,
    };
  }

  if (cachedSnapshot && Number.isFinite(ageMs) && ageMs <= STALE_SNAPSHOT_MAX_AGE_MS) {
    scheduleBackground(
      waitUntil,
      startRefresh().then((snapshot) => persistDurableSnapshot(env, snapshot)),
    );
    return { snapshot: cachedSnapshot, deliveryMode: 'recent-verified-background-refresh', ageMs };
  }

  const snapshot = await startRefresh();
  scheduleBackground(waitUntil, persistDurableSnapshot(env, snapshot));
  return { snapshot, deliveryMode: 'fresh-probe', ageMs: 0 };
}

export async function onRequestGet({ request, waitUntil, env } = {}) {
  const requestUrl = new URL(request?.url || 'https://kriptoaman.com/api/network-health');
  const forceRefresh = requestUrl.searchParams.get('refresh') === '1';
  const edgeCache = globalThis.caches?.default;
  const cacheKey = new Request(`${requestUrl.origin}/api/network-health`, { method: 'GET', headers: { Accept: 'application/json' } });

  if (!forceRefresh && edgeCache) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) {
      const headers = new Headers(hit.headers);
      headers.set('X-KriptoAman-Network-Cache', 'HIT');
      return new Response(hit.body, { status: hit.status, headers });
    }
  }

  const { snapshot, deliveryMode, ageMs } = await getSnapshot(forceRefresh, waitUntil, env);
  const delivered = {
    ...snapshot,
    delivery: {
      mode: deliveryMode,
      snapshotAgeMs: ageMs,
      freshProbe: deliveryMode === 'fresh-probe',
      edgeCacheEligible: !forceRefresh && deliveryMode === 'fresh-probe',
    },
  };
  const status = snapshot.summary.online > 0 ? 200 : 503;
  const response = json(delivered, { status }, {
    'X-KriptoAman-Network-Cache': forceRefresh ? 'BYPASS' : 'MISS',
    'X-KriptoAman-Network-Delivery': deliveryMode,
  });

  if (!forceRefresh && edgeCache && status === 200 && deliveryMode === 'fresh-probe') {
    scheduleBackground(waitUntil, edgeCache.put(cacheKey, response.clone()));
  }

  return response;
}

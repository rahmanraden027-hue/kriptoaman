const DEFAULT_PROVIDER_TIMEOUT_MS = 2500;
const SLOW_PROVIDER_TIMEOUT_MS = 3500;
const EXTENDED_PROVIDER_TIMEOUT_MS = 5000;
const SNAPSHOT_TTL_MS = 45_000;
const LAST_GOOD_TTL_MS = 10 * 60 * 1000;
const MIN_ACTIVE_TARGET = 12;

const NETWORKS = [
  { name: 'Bitcoin', type: 'bitcoin', timeoutMs: SLOW_PROVIDER_TIMEOUT_MS, urls: ['https://mempool.space/api/blocks/tip/height', 'https://blockstream.info/api/blocks/tip/height'] },
  { name: 'Ethereum', type: 'evm', urls: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'] },
  { name: 'BNB Chain', type: 'evm', urls: ['https://bsc-dataseed.binance.org', 'https://bsc-rpc.publicnode.com'] },
  { name: 'Polygon', type: 'evm', urls: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon.drpc.org'] },
  { name: 'Arbitrum', type: 'evm', urls: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'] },
  { name: 'Optimism', type: 'evm', urls: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com'] },
  {
    name: 'Base',
    type: 'evm',
    urls: [
      'https://mainnet.base.org',
      'https://base-rpc.publicnode.com',
      'https://base-mainnet.public.blastapi.io',
    ],
  },
  { name: 'Avalanche', type: 'evm', urls: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-c-chain-rpc.publicnode.com'] },
  { name: 'Gnosis', type: 'evm', urls: ['https://rpc.gnosischain.com', 'https://gnosis-rpc.publicnode.com'] },
  { name: 'Celo', type: 'evm', urls: ['https://forno.celo.org', 'https://celo-rpc.publicnode.com'] },
  { name: 'Linea', type: 'evm', urls: ['https://rpc.linea.build', 'https://linea-rpc.publicnode.com'] },
  { name: 'Scroll', type: 'evm', urls: ['https://rpc.scroll.io', 'https://scroll-rpc.publicnode.com'] },
  { name: 'Mantle', type: 'evm', urls: ['https://rpc.mantle.xyz', 'https://mantle-rpc.publicnode.com'] },
  { name: 'Fantom', type: 'evm', urls: ['https://rpcapi.fantom.network', 'https://fantom.publicnode.com'] },
  { name: 'Solana', type: 'solana', timeoutMs: SLOW_PROVIDER_TIMEOUT_MS, urls: ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'] },
  {
    name: 'TRON',
    type: 'tron',
    timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS,
    urls: [
      'https://api.trongrid.io/wallet/getnowblock',
      'https://tron-evm-rpc.publicnode.com',
    ],
  },
  {
    name: 'XRP Ledger',
    type: 'xrp',
    timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS,
    urls: [
      'https://honeycluster.io/',
      'https://xrplcluster.com',
      'https://s1.ripple.com:51234/',
      'https://s2.ripple.com:51234/',
    ],
  },
  { name: 'Polkadot', type: 'polkadot', timeoutMs: SLOW_PROVIDER_TIMEOUT_MS, urls: ['https://rpc.polkadot.io', 'https://polkadot-rpc.publicnode.com'] },
  {
    name: 'Cardano',
    type: 'cardano',
    timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS,
    urls: ['https://api.koios.rest/api/v1/tip?select=block_no'],
  },
  {
    name: 'Litecoin',
    type: 'utxo',
    timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS,
    urls: [
      'https://litecoinspace.org/api/blocks/tip/height',
      'https://ltc1.trezor.io/api/v2',
      'https://ltc2.trezor.io/api/v2',
      'https://api.blockchair.com/litecoin/stats',
      'https://api.blockcypher.com/v1/ltc/main',
    ],
  },
  {
    name: 'Dogecoin',
    type: 'utxo',
    timeoutMs: EXTENDED_PROVIDER_TIMEOUT_MS,
    urls: [
      'https://doge1.trezor.io/api/v2',
      'https://doge2.trezor.io/api/v2',
      'https://dogecoin.atomicwallet.io/api/v2',
      'https://api.blockchair.com/dogecoin/stats',
      'https://api.blockcypher.com/v1/doge/main',
    ],
  },
];

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=180',
  'X-Content-Type-Options': 'nosniff',
};

let cachedSnapshot = null;
let cachedSnapshotAt = 0;
let refreshInFlight = null;
const lastGoodByNetwork = new Map();

function json(data, init = {}, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...HEADERS, ...(init.headers || {}), ...extraHeaders },
  });
}

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
    'User-Agent': 'KriptoAman-Network-Health/3.0',
    ...extra,
  };
}

async function probeUrl(item, url) {
  const started = Date.now();
  const timeoutMs = Number(item.timeoutMs) || DEFAULT_PROVIDER_TIMEOUT_MS;
  let response;
  let responseMode = 'json';

  if (item.type === 'evm') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: requestHeaders({ 'Content-Type': 'application/json' }),
      body: rpcBody('eth_blockNumber'),
    }, timeoutMs);
  } else if (item.type === 'solana') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: requestHeaders({ 'Content-Type': 'application/json' }),
      body: rpcBody('getBlockHeight'),
    }, timeoutMs);
  } else if (item.type === 'xrp') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: requestHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ method: 'server_info', params: [{}] }),
    }, timeoutMs);
  } else if (item.type === 'polkadot') {
    response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: requestHeaders({ 'Content-Type': 'application/json' }),
      body: rpcBody('chain_getHeader'),
    }, timeoutMs);
  } else if (item.type === 'tron') {
    if (url.includes('tron-evm-rpc.publicnode.com')) {
      response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: requestHeaders({ 'Content-Type': 'application/json' }),
        body: rpcBody('eth_blockNumber'),
      }, timeoutMs);
    } else {
      response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: requestHeaders({ 'Content-Type': 'application/json' }),
        body: '{}',
      }, timeoutMs);
    }
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
      const height = Number(
        payload?.blockbook?.bestHeight
        ?? payload?.backend?.blocks
        ?? payload?.bestHeight
        ?? payload?.data?.blocks
        ?? payload?.data?.best_block_height
        ?? payload?.height,
      );
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
      last_known_good: hasRecentLastGood ? {
        provider: previous.provider,
        detail: previous.detail,
        checked_at: previous.checked_at,
        age_ms: lastKnownAgeMs,
      } : null,
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
      lastGoodTtlMs: LAST_GOOD_TTL_MS,
      fabricatedMetrics: false,
    },
  };
}

async function getSnapshot(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSnapshot && now - cachedSnapshotAt < SNAPSHOT_TTL_MS) {
    return cachedSnapshot;
  }

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

export async function onRequestGet({ request, waitUntil } = {}) {
  const requestUrl = new URL(request?.url || 'https://kriptoaman.com/api/network-health');
  const forceRefresh = requestUrl.searchParams.get('refresh') === '1';
  const edgeCache = globalThis.caches?.default;
  const cacheKey = new Request(`${requestUrl.origin}/api/network-health`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!forceRefresh && edgeCache) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) {
      const headers = new Headers(hit.headers);
      headers.set('X-KriptoAman-Network-Cache', 'HIT');
      return new Response(hit.body, { status: hit.status, headers });
    }
  }

  const snapshot = await getSnapshot(forceRefresh);
  const status = snapshot.summary.online > 0 ? 200 : 503;
  const response = json(snapshot, { status }, {
    'X-KriptoAman-Network-Cache': forceRefresh ? 'BYPASS' : 'MISS',
  });

  if (!forceRefresh && edgeCache && status === 200) {
    const task = edgeCache.put(cacheKey, response.clone());
    if (typeof waitUntil === 'function') waitUntil(task);
    else await task;
  }

  return response;
}

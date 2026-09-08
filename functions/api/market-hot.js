import { readSession } from '../_shared/d1-session.js';

const HOT_SYMBOLS = new Set([
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX', 'AVAX', 'DOT',
  'LINK', 'POL', 'MATIC', 'LTC', 'UNI', 'USDT', 'USDC', 'SHIB', 'PEPE', 'ATOM', 'NEAR', 'ARB', 'OP', 'SUI', 'APT',
]);
const CORE_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
const MEMORY_TTL_MS = 15_000;
const HOT_STALE_AFTER_MS = 60_000;
const HOT_HEALTHY_AGE_MS = 60 * 60 * 1000;
const MAX_FALLBACK_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [150, 350];
const DURABLE_READ_BUDGET_MS = 350;
const PUBLIC_COLD_RESPONSE_BUDGET_MS = 1_800;
const EDGE_CACHE_WRITE_BUDGET_MS = 350;

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=5, s-maxage=15, stale-while-revalidate=45',
  'X-Content-Type-Options': 'nosniff',
};

let memorySnapshot = null;
let refreshInFlight = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const scheduleBackground = (waitUntil, task) => {
  if (typeof waitUntil === 'function') waitUntil(task);
  else task.catch(() => undefined);
};

async function withDeadline(task, timeoutMs, fallback = null) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(task),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url) {
  let lastError;
  const maxAttempts = RETRY_DELAYS_MS.length + 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'KriptoAman-Hot-Market/3.3' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`upstream HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts - 1) break;
      const retryDelay = RETRY_DELAYS_MS[attempt];
      if (Number.isFinite(retryDelay)) await sleep(retryDelay);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error('hot market upstream unavailable');
}

function normalizeCoinLore(rows) {
  if (!Array.isArray(rows)) return [];
  const seen = new Set();
  return rows.map((item) => {
    const symbol = String(item?.symbol || '').toUpperCase();
    if (!HOT_SYMBOLS.has(symbol) || seen.has(symbol)) return null;
    const price = Number(item.price_usd);
    if (!Number.isFinite(price)) return null;
    seen.add(symbol);
    return {
      symbol,
      price,
      change24h: Number.isFinite(Number(item.percent_change_24h)) ? Number(item.percent_change_24h) : null,
      high24h: null,
      low24h: null,
      volume24h: Number.isFinite(Number(item.volume24)) ? Number(item.volume24) : null,
      marketCap: Number.isFinite(Number(item.market_cap_usd)) ? Number(item.market_cap_usd) : null,
      rank: Number.isFinite(Number(item.rank)) ? Number(item.rank) : null,
    };
  }).filter(Boolean);
}

function normalizePersisted(rows) {
  if (!Array.isArray(rows)) return [];
  const seen = new Set();
  return rows.map((item) => {
    const symbol = String(item?.symbol || '').toUpperCase();
    if (!HOT_SYMBOLS.has(symbol) || seen.has(symbol)) return null;
    const price = Number(item.current_price);
    if (!Number.isFinite(price)) return null;
    seen.add(symbol);
    return {
      symbol,
      price,
      change24h: Number.isFinite(Number(item.price_change_percentage_24h)) ? Number(item.price_change_percentage_24h) : null,
      high24h: Number.isFinite(Number(item.high_24h)) ? Number(item.high_24h) : null,
      low24h: Number.isFinite(Number(item.low_24h)) ? Number(item.low_24h) : null,
      volume24h: Number.isFinite(Number(item.total_volume)) ? Number(item.total_volume) : null,
      marketCap: Number.isFinite(Number(item.market_cap)) ? Number(item.market_cap) : null,
      rank: Number.isFinite(Number(item.market_cap_rank)) ? Number(item.market_cap_rank) : null,
    };
  }).filter(Boolean);
}

function hasCoreSymbols(data) {
  const symbols = new Set(data.map((item) => item.symbol));
  return CORE_SYMBOLS.every((symbol) => symbols.has(symbol));
}

function freshnessState(ageMs) {
  if (ageMs <= HOT_STALE_AFTER_MS) return 'live';
  if (ageMs <= HOT_HEALTHY_AGE_MS) return 'stale';
  if (ageMs <= MAX_FALLBACK_AGE_MS) return 'archived';
  return 'expired';
}

function snapshotAgeMs(snapshot, now = Date.now()) {
  const capturedAt = Number(snapshot?.capturedAt);
  return Number.isFinite(capturedAt) ? Math.max(0, now - capturedAt) : Infinity;
}

function isAvailableSnapshot(snapshot, now = Date.now()) {
  return Boolean(snapshot && hasCoreSymbols(snapshot.data || []) && snapshotAgeMs(snapshot, now) <= MAX_FALLBACK_AGE_MS);
}

async function readPersistedFallback(env) {
  if (!env?.AUTH_DB) return null;
  const db = readSession(env.AUTH_DB);
  const row = await db.prepare(
    'SELECT source, captured_at, payload FROM market_snapshots WHERE id = ?',
  ).bind('global').first();
  if (!row?.payload) return null;
  try {
    const data = normalizePersisted(JSON.parse(row.payload));
    if (!hasCoreSymbols(data)) return null;
    const capturedAt = Number(row.captured_at);
    if (!Number.isFinite(capturedAt)) return null;
    const snapshot = {
      source: `snapshot:${row.source || 'persisted'}`,
      capturedAt,
      data,
    };
    return isAvailableSnapshot(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}

async function fetchLiveHot() {
  const payload = await fetchJson('https://api.coinlore.net/api/tickers/?start=0&limit=100');
  const data = normalizeCoinLore(payload?.data);
  if (!hasCoreSymbols(data)) throw new Error('hot market response missing core assets');
  return {
    source: 'coinlore-live',
    capturedAt: Date.now(),
    data,
  };
}

async function refreshHot(env) {
  try {
    const live = await fetchLiveHot();
    memorySnapshot = live;
    return live;
  } catch (error) {
    const fallback = await readPersistedFallback(env);
    if (fallback) {
      memorySnapshot = fallback;
      return fallback;
    }
    throw error;
  }
}

function startRefresh(env) {
  if (!refreshInFlight) {
    refreshInFlight = refreshHot(env).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function getHot(env, waitUntil) {
  const now = Date.now();
  if (memorySnapshot && now - Number(memorySnapshot.capturedAt) < MEMORY_TTL_MS) {
    return { snapshot: memorySnapshot, deliveryMode: 'memory-fresh' };
  }

  const durableRead = readPersistedFallback(env);
  const durable = await withDeadline(durableRead, DURABLE_READ_BUDGET_MS, null);
  if (durable) {
    memorySnapshot = durable;
    scheduleBackground(waitUntil, startRefresh(env).catch(() => undefined));
    return { snapshot: durable, deliveryMode: 'durable-verified-background-refresh' };
  }
  scheduleBackground(
    waitUntil,
    durableRead.then((snapshot) => {
      if (snapshot && isAvailableSnapshot(snapshot)) memorySnapshot = snapshot;
    }).catch(() => undefined),
  );

  if (isAvailableSnapshot(memorySnapshot, now)) {
    scheduleBackground(waitUntil, startRefresh(env).catch(() => undefined));
    return { snapshot: memorySnapshot, deliveryMode: 'memory-stale-background-refresh' };
  }

  const refresh = startRefresh(env);
  const snapshot = await withDeadline(refresh, PUBLIC_COLD_RESPONSE_BUDGET_MS, null);
  if (snapshot && isAvailableSnapshot(snapshot)) {
    return { snapshot, deliveryMode: 'fresh-or-fallback-probe' };
  }

  scheduleBackground(waitUntil, refresh.catch(() => undefined));
  return { snapshot: null, deliveryMode: 'warming-background-refresh' };
}

function warmingPayload(requestId, deliveryMode) {
  return {
    schemaVersion: '1.4',
    healthy: false,
    available: false,
    freshness: 'unavailable',
    source: null,
    capturedAt: null,
    ageMs: null,
    stale: false,
    assetCount: 0,
    data: [],
    requestId,
    availability: {
      state: 'warming',
      reason: 'verified_hot_market_snapshot_unavailable_within_response_budget',
    },
    delivery: {
      mode: deliveryMode,
      durableReadBudgetMs: DURABLE_READ_BUDGET_MS,
      publicColdResponseBudgetMs: PUBLIC_COLD_RESPONSE_BUDGET_MS,
      edgeCacheWriteBudgetMs: EDGE_CACHE_WRITE_BUDGET_MS,
      backgroundRefreshContinues: true,
      fabricatedMetrics: false,
    },
  };
}

export async function onRequestGet({ env = {}, request, waitUntil } = {}) {
  const requestId = crypto.randomUUID();
  const requestUrl = new URL(request?.url || 'https://kriptoaman.com/api/market-hot');
  const edgeCache = globalThis.caches?.default;
  const cacheKey = new Request(requestUrl.origin + '/api/market-hot', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (edgeCache) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) {
      const headers = new Headers(hit.headers);
      headers.set('X-KriptoAman-Market-Cache', 'HIT');
      return new Response(hit.body, { status: hit.status, headers });
    }
  }

  try {
    const { snapshot, deliveryMode } = await getHot(env, waitUntil);
    if (!snapshot) {
      return json(warmingPayload(requestId, deliveryMode), 503, {
        'Retry-After': '2',
        'X-KriptoAman-Market-Cache': 'MISS',
        'X-KriptoAman-Market-Delivery': deliveryMode,
      });
    }

    const ageMs = snapshotAgeMs(snapshot);
    const freshness = freshnessState(ageMs);
    const stale = freshness !== 'live';
    const healthy = hasCoreSymbols(snapshot.data) && ageMs <= HOT_HEALTHY_AGE_MS;
    const available = hasCoreSymbols(snapshot.data) && ageMs <= MAX_FALLBACK_AGE_MS;
    const responseStatus = available ? 200 : 503;
    const extraHeaders = {
      'X-KriptoAman-Market-Cache': 'MISS',
      'X-KriptoAman-Market-Freshness': freshness,
      'X-KriptoAman-Market-Delivery': deliveryMode,
      ...(stale ? {
        'X-KriptoAman-Market-Stale': 'true',
        Warning: '110 - "Response is stale"',
      } : {}),
    };
    const response = json({
      schemaVersion: '1.4',
      healthy,
      available,
      freshness,
      source: snapshot.source,
      capturedAt: snapshot.capturedAt,
      ageMs,
      stale,
      assetCount: snapshot.data.length,
      data: snapshot.data,
      requestId,
      delivery: {
        mode: deliveryMode,
        memoryTtlMs: MEMORY_TTL_MS,
        healthyAgeMs: HOT_HEALTHY_AGE_MS,
        maxFallbackAgeMs: MAX_FALLBACK_AGE_MS,
        edgeSMaxAgeSeconds: 15,
        durableReadBudgetMs: DURABLE_READ_BUDGET_MS,
        publicColdResponseBudgetMs: PUBLIC_COLD_RESPONSE_BUDGET_MS,
        edgeCacheWriteBudgetMs: EDGE_CACHE_WRITE_BUDGET_MS,
        d1SessionRead: Boolean(env.AUTH_DB && typeof env.AUTH_DB.withSession === 'function'),
        singleFlight: true,
        durableFirstOnColdRead: true,
        fabricatedMetrics: false,
      },
    }, responseStatus, extraHeaders);

    if (edgeCache && available) {
      const cacheWrite = edgeCache.put(cacheKey, response.clone())
        .then(() => true)
        .catch(() => false);
      const cacheWritten = await withDeadline(cacheWrite, EDGE_CACHE_WRITE_BUDGET_MS, false);
      if (!cacheWritten) scheduleBackground(waitUntil, cacheWrite.then(() => undefined));
    }
    return response;
  } catch (error) {
    console.error('Hot market unavailable', { requestId, error: error?.message || String(error) });
    return json({
      error: 'Hot market unavailable',
      code: 'HOT_MARKET_UNAVAILABLE',
      requestId,
    }, 503, { 'Retry-After': '2', 'X-KriptoAman-Market-Cache': 'MISS' });
  }
}

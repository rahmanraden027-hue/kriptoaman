import { readSession } from '../_shared/d1-session.js';

const HOT_SYMBOLS = new Set([
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX', 'AVAX', 'DOT',
  'LINK', 'POL', 'MATIC', 'LTC', 'UNI', 'USDT', 'USDC', 'SHIB', 'PEPE', 'ATOM', 'NEAR', 'ARB', 'OP', 'SUI', 'APT',
]);
const CORE_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
const MEMORY_TTL_MS = 15_000;
const HOT_STALE_AFTER_MS = 60_000;
const MAX_FALLBACK_AGE_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [150, 350];

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

async function fetchJson(url) {
  let lastError;
  const maxAttempts = RETRY_DELAYS_MS.length + 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'KriptoAman-Hot-Market/3.1' },
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

async function readPersistedFallback(env) {
  if (!env.AUTH_DB) return null;
  const db = readSession(env.AUTH_DB);
  const row = await db.prepare(
    'SELECT source, captured_at, payload FROM market_snapshots WHERE id = ?',
  ).bind('global').first();
  if (!row?.payload) return null;
  try {
    const data = normalizePersisted(JSON.parse(row.payload));
    if (!hasCoreSymbols(data)) return null;
    return {
      source: `snapshot:${row.source || 'persisted'}`,
      capturedAt: Number(row.captured_at),
      data,
    };
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

async function getHot(env) {
  const now = Date.now();
  if (memorySnapshot && now - Number(memorySnapshot.capturedAt) < MEMORY_TTL_MS) return memorySnapshot;
  if (!refreshInFlight) {
    refreshInFlight = refreshHot(env).finally(() => {
      refreshInFlight = null;
    });
  }
  try {
    return await refreshInFlight;
  } catch (error) {
    if (memorySnapshot && now - Number(memorySnapshot.capturedAt) <= MAX_FALLBACK_AGE_MS) return memorySnapshot;
    throw error;
  }
}

export async function onRequestGet({ env, request, waitUntil }) {
  const requestId = crypto.randomUUID();
  const edgeCache = globalThis.caches?.default;
  const cacheKey = new Request(new URL(request.url).origin + '/api/market-hot', {
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
    const snapshot = await getHot(env);
    const ageMs = Math.max(0, Date.now() - Number(snapshot.capturedAt));
    const stale = ageMs > HOT_STALE_AFTER_MS;
    const healthy = hasCoreSymbols(snapshot.data) && ageMs <= MAX_FALLBACK_AGE_MS;
    const response = json({
      schemaVersion: '1.2',
      healthy,
      source: snapshot.source,
      capturedAt: snapshot.capturedAt,
      ageMs,
      stale,
      assetCount: snapshot.data.length,
      data: snapshot.data,
      requestId,
      delivery: {
        memoryTtlMs: MEMORY_TTL_MS,
        edgeSMaxAgeSeconds: 15,
        d1SessionRead: Boolean(env.AUTH_DB && typeof env.AUTH_DB.withSession === 'function'),
        singleFlight: true,
      },
    }, healthy ? 200 : 503, { 'X-KriptoAman-Market-Cache': 'MISS' });

    if (edgeCache && healthy) {
      const task = edgeCache.put(cacheKey, response.clone());
      if (typeof waitUntil === 'function') waitUntil(task);
      else await task;
    }
    return response;
  } catch (error) {
    console.error('Hot market unavailable', { requestId, error });
    return json({
      error: 'Hot market unavailable',
      code: 'HOT_MARKET_UNAVAILABLE',
      requestId,
    }, 503, { 'Retry-After': '15', 'X-KriptoAman-Market-Cache': 'MISS' });
  }
}

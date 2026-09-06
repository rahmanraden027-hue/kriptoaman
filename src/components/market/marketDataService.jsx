/**
 * KriptoAman Market History Service
 *
 * User-facing historical charts read only from KriptoAman's persisted
 * `/api/market-history` store. The server read path never fetches upstream and
 * never synthesizes missing candles. A browser last-known-good copy is kept so
 * previously viewed charts can remain visible during a prolonged API/origin
 * outage, while coverage gaps and provenance remain explicit.
 */

const SUPPORTED_HISTORY_ASSETS = new Set([
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX', 'AVAX', 'DOT',
  'LINK', 'MATIC', 'POL', 'LTC', 'UNI', 'ATOM', 'NEAR', 'APT', 'SUI', 'ARB',
  'OP', 'AAVE', 'CRV', 'INJ', 'SHIB', 'USDT', 'USDC', 'PEPE', 'BCH', 'XLM',
  'TON', 'HBAR', 'ICP', 'ETC', 'FIL', 'LDO', 'DAI', 'CRO', 'MKR', 'ALGO',
  'VET', 'TIA', 'IMX', 'GRT', 'STX', 'RUNE', 'KAS',
]);
const INTERVAL_MS = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};
const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 12 * 1000;
const HISTORY_CACHE_PREFIX = 'ka_market_history_v3';

const _historyCache = new Map();

const normalizeAsset = (coinId) => String(coinId || '').toUpperCase();

const chooseInterval = (days) => {
  const numericDays = Math.max(1, Number(days) || 7);
  // Keep every supported UI timeframe within the API's 500-row hard limit.
  if (numericDays <= 7) return '1h';
  if (numericDays <= 80) return '4h';
  return '1d';
};

const buildRange = (days, interval) => {
  const intervalMs = INTERVAL_MS[interval] || INTERVAL_MS['1d'];
  const numericDays = Math.max(1, Number(days) || 7);
  const now = Date.now();
  const to = Math.floor(now / intervalMs) * intervalMs + intervalMs;
  const from = Math.max(0, to - Math.round(numericDays * DAY_MS));
  return { from, to };
};

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`KriptoAman market-history request failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

const memoryGet = (key) => {
  const cached = _historyCache.get(key);
  if (!cached || Date.now() - cached.ts >= CACHE_TTL) return null;
  return cached.value;
};

const memoryPut = (key, value) => {
  _historyCache.set(key, { value, ts: Date.now() });
  return value;
};

const browserCacheKey = (asset, interval, days) =>
  `${HISTORY_CACHE_PREFIX}:${asset}:${interval}:${Math.max(1, Number(days) || 7)}`;

const readBrowserHistory = (key) => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (!Array.isArray(cached?.candles) || cached.candles.length < 2) return null;
    return {
      ...cached,
      source: 'browser-last-known-good',
      cached: true,
      stale: true,
    };
  } catch {
    return null;
  }
};

const persistBrowserHistory = (key, snapshot) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({
      asset: snapshot.asset,
      interval: snapshot.interval,
      range: snapshot.range,
      savedAt: Date.now(),
      capturedAt: snapshot.capturedAt,
      candles: snapshot.candles,
      coverage: snapshot.coverage,
      gaps: snapshot.gaps,
      policy: snapshot.policy,
    }));
  } catch {
    // Quota/privacy restrictions must not interrupt an already rendered chart.
  }
};

const latestObservationAt = (candles) => candles.reduce((latest, candle) => {
  const observed = Number(candle?.providerObservedAt || candle?.retrievedAt || candle?.closeTime || 0);
  return Number.isFinite(observed) ? Math.max(latest, observed) : latest;
}, 0) || null;

export async function getHistoricalSeries(coinId, days = 7) {
  const asset = normalizeAsset(coinId);
  if (!SUPPORTED_HISTORY_ASSETS.has(asset)) {
    return {
      available: false,
      asset,
      candles: [],
      gaps: [],
      coverage: null,
      source: 'unsupported',
      policy: { syntheticCandles: false, missingIntervals: 'explicit-not-filled' },
    };
  }

  const interval = chooseInterval(days);
  const { from, to } = buildRange(days, interval);
  const key = browserCacheKey(asset, interval, days);
  const memoryKey = `${key}:${from}:${to}`;
  const memory = memoryGet(memoryKey);
  if (memory) return memory;

  const fallback = readBrowserHistory(key);

  try {
    const params = new URLSearchParams({
      asset,
      interval,
      from: String(from),
      to: String(to),
      limit: '500',
    });
    const payload = await fetchJson(`/api/market-history?${params.toString()}`);
    const candles = Array.isArray(payload?.candles) ? payload.candles : [];

    if (candles.length < 2) {
      return memoryPut(memoryKey, fallback || {
        available: Boolean(payload?.available),
        asset,
        interval,
        range: payload?.range || { from, to },
        candles: [],
        gaps: Array.isArray(payload?.gaps) ? payload.gaps : [],
        coverage: payload?.coverage || null,
        source: 'kriptoaman-history-empty',
        cached: false,
        stale: false,
        policy: payload?.policy || { syntheticCandles: false, missingIntervals: 'explicit-not-filled' },
      });
    }

    const snapshot = {
      available: true,
      asset,
      interval,
      range: payload?.range || { from, to },
      candles,
      gaps: Array.isArray(payload?.gaps) ? payload.gaps : [],
      coverage: payload?.coverage || null,
      policy: payload?.policy || { syntheticCandles: false, missingIntervals: 'explicit-not-filled' },
      capturedAt: latestObservationAt(candles),
      source: 'kriptoaman-persisted-history',
      cached: false,
      stale: false,
    };
    persistBrowserHistory(key, snapshot);
    return memoryPut(memoryKey, snapshot);
  } catch {
    return memoryPut(memoryKey, fallback || {
      available: false,
      asset,
      interval,
      range: { from, to },
      candles: [],
      gaps: [],
      coverage: null,
      source: 'unavailable',
      cached: false,
      stale: true,
      policy: { syntheticCandles: false, missingIntervals: 'explicit-not-filled' },
    });
  }
}

const formatDate = (timestamp, days) => new Date(Number(timestamp)).toLocaleString('en-US', {
  ...(Number(days) > 1 ? { month: 'short', day: 'numeric' } : {}),
  hour: '2-digit',
  minute: '2-digit',
});

export async function getHistoricalData(coinId, days = 7) {
  const snapshot = await getHistoricalSeries(coinId, days);
  return snapshot.candles.map((candle) => ({
    timestamp: Number(candle.openTime),
    date: formatDate(candle.openTime, days),
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: candle.volume == null ? null : Number(candle.volume),
    source: snapshot.source,
    cached: Boolean(snapshot.cached),
  })).filter((row) =>
    Number.isFinite(row.timestamp) &&
    Number.isFinite(row.open) &&
    Number.isFinite(row.high) &&
    Number.isFinite(row.low) &&
    Number.isFinite(row.close),
  );
}

export async function getMarketChart(coinId, days = 7) {
  const snapshot = await getHistoricalSeries(coinId, days);
  return snapshot.candles.map((candle) => ({
    timestamp: Number(candle.openTime),
    date: formatDate(candle.openTime, days),
    price: Number(candle.close),
    source: snapshot.source,
    cached: Boolean(snapshot.cached),
  })).filter((row) => Number.isFinite(row.timestamp) && Number.isFinite(row.price));
}

export async function getMultiAssetSnapshot(coinIds, days = 30) {
  const results = {};
  await Promise.allSettled(
    coinIds.map(async (id) => {
      results[id] = await getMarketChart(id, days);
    }),
  );
  return results;
}

/**
 * Forex and commodity modules intentionally expose no generated values.
 * They can be connected to an approved verified provider later without
 * changing callers or risking simulated data being shown as market data.
 */
export function getForexRates() {
  return {};
}

export function getForexHistory() {
  return [];
}

export function getCommodityRates() {
  return {};
}

const _subscribers = new Map();

export function subscribeToPrice(coinId, callback) {
  if (!_subscribers.has(coinId)) _subscribers.set(coinId, new Set());
  _subscribers.get(coinId).add(callback);
  return () => _subscribers.get(coinId)?.delete(callback);
}

export function publishPrice(coinId, priceData) {
  _subscribers.get(coinId)?.forEach((callback) => callback(priceData));
}

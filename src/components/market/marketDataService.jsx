/**
 * Market Data Service
 *
 * User-facing market history is sourced from CoinGecko only. When verified
 * upstream data is unavailable, callers receive an empty collection instead
 * of generated prices, volume, forex, or commodity values.
 */

const GECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  TRX: 'tron',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  LINK: 'chainlink',
  MATIC: 'matic-network',
  POL: 'matic-network',
  LTC: 'litecoin',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  NEAR: 'near',
  APT: 'aptos',
  SUI: 'sui',
  ARB: 'arbitrum',
  OP: 'optimism',
  AAVE: 'aave',
  CRV: 'curve-dao-token',
  INJ: 'injective-protocol',
  SHIB: 'shiba-inu',
  USDT: 'tether',
  USDC: 'usd-coin',
  PEPE: 'pepe',
  BCH: 'bitcoin-cash',
  XLM: 'stellar',
  TON: 'the-open-network',
  HBAR: 'hedera-hashgraph',
  ICP: 'internet-computer',
  ETC: 'ethereum-classic',
  FIL: 'filecoin',
  LDO: 'lido-dao',
  DAI: 'dai',
  CRO: 'crypto-com-chain',
  MKR: 'maker',
  ALGO: 'algorand',
  VET: 'vechain',
  TIA: 'celestia',
  IMX: 'immutable-x',
  GRT: 'the-graph',
  STX: 'blockstack',
  RUNE: 'thorchain',
  KAS: 'kaspa',
};

const _historyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const REQUEST_TIMEOUT = 12 * 1000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Market provider request failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

const getCached = (key) => {
  const cached = _historyCache.get(key);
  if (!cached || Date.now() - cached.ts >= CACHE_TTL) return null;
  return cached.data;
};

const putCached = (key, data) => {
  _historyCache.set(key, { data, ts: Date.now() });
  return data;
};

export async function getHistoricalData(coinId, days = 7, interval = 'daily') {
  const geckoId = GECKO_IDS[String(coinId || '').toUpperCase()];
  if (!geckoId) return [];

  const cacheKey = `ohlc-${geckoId}-${days}-${interval}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const raw = await fetchJson(
      `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`,
    );
    if (!Array.isArray(raw)) return [];

    const data = raw
      .map(([ts, open, high, low, close]) => ({
        timestamp: Number(ts),
        date: new Date(Number(ts)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        // CoinGecko's OHLC endpoint does not provide volume. Never fabricate it.
        volume: null,
        source: 'coingecko',
      }))
      .filter((row) =>
        Number.isFinite(row.timestamp) &&
        Number.isFinite(row.open) &&
        Number.isFinite(row.high) &&
        Number.isFinite(row.low) &&
        Number.isFinite(row.close),
      );

    return putCached(cacheKey, data);
  } catch {
    return [];
  }
}

export async function getMarketChart(coinId, days = 7) {
  const geckoId = GECKO_IDS[String(coinId || '').toUpperCase()];
  if (!geckoId) return [];

  const cacheKey = `chart-${geckoId}-${days}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      days: String(days),
      interval: days <= 1 ? 'minutely' : 'daily',
    });
    const json = await fetchJson(
      `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?${params.toString()}`,
    );
    if (!Array.isArray(json?.prices)) return [];

    const data = json.prices
      .map(([ts, price]) => ({
        timestamp: Number(ts),
        date: new Date(Number(ts)).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          ...(days > 1 ? { month: 'short', day: 'numeric' } : {}),
        }),
        price: Number(price),
        source: 'coingecko',
      }))
      .filter((row) => Number.isFinite(row.timestamp) && Number.isFinite(row.price));

    return putCached(cacheKey, data);
  } catch {
    return [];
  }
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

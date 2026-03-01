/**
 * Market Data Service
 * Unified service for real-time prices (Binance WS), historical OHLCV data,
 * and forex/crypto/commodity rates.
 */

// ── CoinGecko IDs for historical data ──────────────────────────────────────
const GECKO_IDS = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
  DOGE: 'dogecoin', MATIC: 'matic-network', LTC: 'litecoin',
  AVAX: 'avalanche-2', FTM: 'fantom', XRP: 'ripple', ADA: 'cardano',
  DOT: 'polkadot', TRX: 'tron', ATOM: 'cosmos', LINK: 'chainlink',
  UNI: 'uniswap', NEAR: 'near', APT: 'aptos', SUI: 'sui',
  ARB: 'arbitrum', OP: 'optimism', AAVE: 'aave', CRV: 'curve-dao-token',
  INJ: 'injective-protocol', SHIB: 'shiba-inu',
};

// ── Forex pairs simulated (no free public API, use ECB/openexchangerates style fallbacks) ──
const FOREX_BASES = {
  'EUR/USD': 1.085, 'GBP/USD': 1.265, 'USD/JPY': 149.5, 'USD/IDR': 15800,
  'AUD/USD': 0.655, 'USD/SGD': 1.345, 'USD/CNY': 7.24, 'USD/INR': 83.1,
  'USD/KRW': 1330, 'EUR/GBP': 0.858, 'GBP/JPY': 189.2, 'XAU/USD': 2045,
};

// In-memory historical cache (Map<geckoId|pair, {days, data, ts}>)
const _historyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// ── Historical OHLCV via CoinGecko ──────────────────────────────────────────
export async function getHistoricalData(coinId, days = 7, interval = 'daily') {
  const geckoId = GECKO_IDS[coinId];
  if (!geckoId) return generateSyntheticHistory(coinId, days);

  const cacheKey = `${geckoId}-${days}-${interval}`;
  const cached = _historyCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('CoinGecko OHLC failed');
    const raw = await res.json();

    // raw = [[timestamp, open, high, low, close], ...]
    const data = raw.map(([ts, open, high, low, close]) => ({
      timestamp: ts,
      date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open, high, low, close,
      volume: Math.random() * 1e9, // volume not in free OHLC endpoint
    }));

    _historyCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch {
    return generateSyntheticHistory(coinId, days);
  }
}

// ── Market chart (prices only) for sparklines/charts ────────────────────────
export async function getMarketChart(coinId, days = 7) {
  const geckoId = GECKO_IDS[coinId];
  if (!geckoId) return generateSyntheticPrices(coinId, days);

  const cacheKey = `chart-${geckoId}-${days}`;
  const cached = _historyCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}&interval=${days <= 1 ? 'minutely' : 'daily'}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('CoinGecko chart failed');
    const json = await res.json();

    const data = (json.prices || []).map(([ts, price]) => ({
      timestamp: ts,
      date: new Date(ts).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
        ...(days > 1 ? { month: 'short', day: 'numeric' } : {}),
      }),
      price,
    }));

    _historyCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch {
    return generateSyntheticPrices(coinId, days);
  }
}

// ── Multi-asset snapshot (for backtesting / analytics) ──────────────────────
export async function getMultiAssetSnapshot(coinIds, days = 30) {
  const results = {};
  await Promise.allSettled(
    coinIds.map(async id => {
      results[id] = await getMarketChart(id, days);
    })
  );
  return results;
}

// ── Forex rates (simulated with micro-drift) ────────────────────────────────
let _forexPrices = { ...FOREX_BASES };
let _forexInitTs = Date.now();

export function getForexRates() {
  // Drift rates slightly for realism
  const elapsed = (Date.now() - _forexInitTs) / 1000;
  const rates = {};
  Object.entries(FOREX_BASES).forEach(([pair, base]) => {
    const drift = Math.sin(elapsed * 0.01 + base) * 0.002;
    rates[pair] = parseFloat((base * (1 + drift)).toFixed(pair.includes('JPY') || pair.includes('IDR') || pair.includes('KRW') ? 2 : 4));
  });
  _forexPrices = rates;
  return rates;
}

export function getForexHistory(pair, days = 7) {
  const base = FOREX_BASES[pair] || 1;
  return generateSyntheticPricesForBase(pair, base, days * 24);
}

// ── Commodity prices (Gold, Oil, Silver) ────────────────────────────────────
const COMMODITY_BASES = { 'XAU/USD': 2045, 'XAG/USD': 23.5, 'OIL/USD': 78.5, 'XPT/USD': 930 };

export function getCommodityRates() {
  const rates = {};
  Object.entries(COMMODITY_BASES).forEach(([pair, base]) => {
    const drift = (Math.random() - 0.5) * 0.004;
    rates[pair] = parseFloat((base * (1 + drift)).toFixed(2));
  });
  return rates;
}

// ── Backtesting data: generate OHLCV for any pair ───────────────────────────
export function generateBacktestData(startPrice, days, volatility = 0.02) {
  const data = [];
  let price = startPrice;
  const msPerDay = 86400000;
  const startTs = Date.now() - days * msPerDay;
  for (let i = 0; i < days; i++) {
    const open = price;
    const highFactor = 1 + Math.random() * volatility;
    const lowFactor  = 1 - Math.random() * volatility;
    const closeFactor = 1 + (Math.random() - 0.48) * volatility;
    const high  = open * highFactor;
    const low   = open * lowFactor;
    const close = Math.max(open * closeFactor, low * 1.001);
    const volume = startPrice * (1e6 + Math.random() * 1e7);
    data.push({
      timestamp: startTs + i * msPerDay,
      date: new Date(startTs + i * msPerDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low:  parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
      volume: parseFloat(volume.toFixed(0)),
    });
    price = close;
  }
  return data;
}

// ── Internal synthetic generators (fallback) ─────────────────────────────────
const FALLBACK_PRICES = {
  BTC: 95200, ETH: 3420, BNB: 582, SOL: 172, AVAX: 38.5, MATIC: 0.46,
  DOT: 7.8, ATOM: 8.9, NEAR: 5.2, ADA: 0.48, LTC: 86, DOGE: 0.124,
  XRP: 0.57, TRX: 0.124, LINK: 14.8, UNI: 8.4, SUI: 3.8, APT: 12.5,
};

function generateSyntheticHistory(coinId, days) {
  const base = FALLBACK_PRICES[coinId] || 1;
  return generateBacktestData(base, days * 24);
}

function generateSyntheticPrices(coinId, points) {
  const base = FALLBACK_PRICES[coinId] || 1;
  return generateSyntheticPricesForBase(coinId, base, points * 24);
}

function generateSyntheticPricesForBase(id, base, points) {
  const data = [];
  let p = base * 0.96;
  const now = Date.now();
  for (let i = 0; i < points; i++) {
    p = p * (1 + (Math.random() - 0.49) * 0.012);
    data.push({
      timestamp: now - (points - i) * 3600000,
      date: new Date(now - (points - i) * 3600000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(p.toFixed(p > 100 ? 2 : p > 1 ? 4 : 6)),
    });
  }
  return data;
}

// ── Subscription pattern for components ──────────────────────────────────────
const _subscribers = new Map();

export function subscribeToPrice(coinId, callback) {
  if (!_subscribers.has(coinId)) _subscribers.set(coinId, new Set());
  _subscribers.get(coinId).add(callback);
  return () => _subscribers.get(coinId)?.delete(callback);
}

export function publishPrice(coinId, priceData) {
  _subscribers.get(coinId)?.forEach(cb => cb(priceData));
}
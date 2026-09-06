const CACHE_KEY = 'ka_readonly_market_prices_v1';

const PRICE_ALIASES = {
  ARB: 'ETH',
  OP: 'ETH',
  BASE: 'ETH',
};

const readCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached?.prices && typeof cached.prices === 'object' ? cached : null;
  } catch {
    return null;
  }
};

const saveCache = (prices, capturedAt) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      capturedAt: Number(capturedAt) || Date.now(),
      prices,
    }));
  } catch {
    // Storage restrictions must never interrupt display pricing.
  }
};

const normalizeHotPrices = (payload) => {
  const result = {};
  if (!Array.isArray(payload?.data)) return result;
  payload.data.forEach((row) => {
    const symbol = String(row?.symbol || '').toUpperCase();
    const price = Number(row?.price);
    if (!symbol || !Number.isFinite(price) || price <= 0) return;
    result[symbol === 'POL' ? 'MATIC' : symbol] = {
      price,
      change24h: Number.isFinite(Number(row?.change24h)) ? Number(row.change24h) : null,
      capturedAt: Number(payload?.capturedAt) || null,
      freshness: payload?.freshness || 'live',
    };
  });
  Object.entries(PRICE_ALIASES).forEach(([alias, source]) => {
    if (result[source]) result[alias] = { ...result[source] };
  });
  return result;
};

export async function getReadOnlyMarketPrices() {
  const cached = readCache();
  try {
    const response = await fetch('/api/market-hot', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Market hot HTTP ${response.status}`);
    const payload = await response.json();
    const prices = normalizeHotPrices(payload);
    if (Object.keys(prices).length === 0) throw new Error('Market hot returned no display prices');
    saveCache(prices, payload?.capturedAt);
    return prices;
  } catch {
    return cached?.prices || {};
  }
}

export function getCachedReadOnlyMarketPrices() {
  return readCache()?.prices || {};
}

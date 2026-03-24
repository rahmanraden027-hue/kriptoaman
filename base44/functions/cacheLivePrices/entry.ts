import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Cache live crypto prices from multiple sources with fallback.
 * Sources: Binance (primary) → CoinGecko (fallback)
 * Berjalan tanpa auth user — dipanggil via scheduled automation.
 */

const SYMBOLS = [
  { binance: 'BTCUSDT',  symbol: 'BTC' },
  { binance: 'ETHUSDT',  symbol: 'ETH' },
  { binance: 'BNBUSDT',  symbol: 'BNB' },
  { binance: 'SOLUSDT',  symbol: 'SOL' },
  { binance: 'XRPUSDT',  symbol: 'XRP' },
  { binance: 'ADAUSDT',  symbol: 'ADA' },
  { binance: 'DOGEUSDT', symbol: 'DOGE' },
  { binance: 'MATICUSDT',symbol: 'MATIC' },
  { binance: 'LTCUSDT',  symbol: 'LTC' },
  { binance: 'DOTUSDT',  symbol: 'DOT' },
  { binance: 'LINKUSDT', symbol: 'LINK' },
  { binance: 'AVAXUSDT', symbol: 'AVAX' },
  { binance: 'UNIUSDT',  symbol: 'UNI' },
  { binance: 'ATOMUSDT', symbol: 'ATOM' },
  { binance: 'TRXUSDT',  symbol: 'TRX' },
];

const COINGECKO_IDS = {
  BTC:'bitcoin', ETH:'ethereum', BNB:'binancecoin', SOL:'solana',
  XRP:'ripple', ADA:'cardano', DOGE:'dogecoin', MATIC:'matic-network',
  LTC:'litecoin', DOT:'polkadot', LINK:'chainlink', AVAX:'avalanche-2',
  UNI:'uniswap', ATOM:'cosmos', TRX:'tron',
};

async function fetchFromBinance() {
  const pairs = SYMBOLS.map(s => s.binance);
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(pairs)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
  const data = await res.json();
  const result = {};
  for (const item of data) {
    const sym = SYMBOLS.find(s => s.binance === item.symbol);
    if (sym) {
      result[sym.symbol] = {
        price: parseFloat(item.lastPrice),
        change24h: parseFloat(item.priceChangePercent),
        volume24h: parseFloat(item.quoteVolume),
        high24h: parseFloat(item.highPrice),
        low24h: parseFloat(item.lowPrice),
      };
    }
  }
  return result;
}

async function fetchFromCoinGecko() {
  const ids = Object.values(COINGECKO_IDS).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_high_24h=true&include_low_24h=true`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const data = await res.json();
  const result = {};
  for (const [sym, cgId] of Object.entries(COINGECKO_IDS)) {
    const d = data[cgId];
    if (d) {
      result[sym] = {
        price: d.usd || 0,
        change24h: d.usd_24h_change || 0,
        volume24h: d.usd_24h_vol || 0,
        high24h: d.usd_24h_high || 0,
        low24h: d.usd_24h_low || 0,
      };
    }
  }
  return result;
}

async function fetchIDRRate() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data?.rates?.IDR) return data.rates.IDR;
  } catch (_) {}
  // Fallback: coba sumber lain
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data?.rates?.IDR) return data.rates.IDR;
  } catch (_) {}
  return 16300; // hardcoded fallback
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const fetchedAt = new Date().toISOString();

    // Fetch prices — Binance first, fallback to CoinGecko
    let priceData = {};
    let source = 'binance';
    try {
      priceData = await fetchFromBinance();
      console.log('[cacheLivePrices] Fetched from Binance:', Object.keys(priceData).length, 'coins');
    } catch (binanceErr) {
      console.warn('[cacheLivePrices] Binance failed:', binanceErr.message, '— falling back to CoinGecko');
      source = 'coingecko';
      priceData = await fetchFromCoinGecko();
      console.log('[cacheLivePrices] Fetched from CoinGecko:', Object.keys(priceData).length, 'coins');
    }

    if (Object.keys(priceData).length === 0) {
      return Response.json({ error: 'Both Binance and CoinGecko failed' }, { status: 502 });
    }

    // Fetch IDR rate in parallel
    const idrRate = await fetchIDRRate();

    // Upsert cached prices
    const existing = await base44.asServiceRole.entities.CachedPrice.filter({});
    const existingMap = {};
    for (const rec of existing) existingMap[rec.symbol] = rec.id;

    const upserts = Object.entries(priceData).map(async ([sym, d]) => {
      const payload = {
        symbol: sym,
        price: d.price,
        change24h: d.change24h,
        volume24h: d.volume24h,
        high24h: d.high24h,
        low24h: d.low24h,
        idrRate,
        fetchedAt,
      };
      if (existingMap[sym]) {
        return base44.asServiceRole.entities.CachedPrice.update(existingMap[sym], payload);
      } else {
        return base44.asServiceRole.entities.CachedPrice.create(payload);
      }
    });

    await Promise.all(upserts);

    console.log(`[cacheLivePrices] Done. ${Object.keys(priceData).length} coins cached. IDR: ${idrRate}. Source: ${source}`);
    return Response.json({ success: true, updated: Object.keys(priceData).length, idrRate, source, fetchedAt });

  } catch (error) {
    console.error('[cacheLivePrices] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
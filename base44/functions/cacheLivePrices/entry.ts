import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Cache live crypto prices from multiple sources with fallback.
 * Sources: Binance → Kraken → CryptoCompare → CoinGecko
 * Berjalan tanpa auth user — dipanggil via scheduled automation.
 */

const SYMBOLS = [
  { binance: 'BTCUSDT',   kraken: 'XBTUSD',  cc: 'BTC',  symbol: 'BTC' },
  { binance: 'ETHUSDT',   kraken: 'ETHUSD',  cc: 'ETH',  symbol: 'ETH' },
  { binance: 'BNBUSDT',   kraken: null,       cc: 'BNB',  symbol: 'BNB' },
  { binance: 'SOLUSDT',   kraken: 'SOLUSD',  cc: 'SOL',  symbol: 'SOL' },
  { binance: 'XRPUSDT',   kraken: 'XRPUSD',  cc: 'XRP',  symbol: 'XRP' },
  { binance: 'ADAUSDT',   kraken: 'ADAUSD',  cc: 'ADA',  symbol: 'ADA' },
  { binance: 'DOGEUSDT',  kraken: 'XDGUSD',  cc: 'DOGE', symbol: 'DOGE' },
  { binance: 'MATICUSDT', kraken: 'MATICUSD',cc: 'MATIC',symbol: 'MATIC' },
  { binance: 'LTCUSDT',   kraken: 'XLTCZUSD',cc: 'LTC',  symbol: 'LTC' },
  { binance: 'DOTUSDT',   kraken: 'DOTUSD',  cc: 'DOT',  symbol: 'DOT' },
  { binance: 'LINKUSDT',  kraken: 'LINKUSD', cc: 'LINK', symbol: 'LINK' },
  { binance: 'AVAXUSDT',  kraken: 'AVAXUSD', cc: 'AVAX', symbol: 'AVAX' },
  { binance: 'UNIUSDT',   kraken: 'UNIUSD',  cc: 'UNI',  symbol: 'UNI' },
  { binance: 'ATOMUSDT',  kraken: 'ATOMUSD', cc: 'ATOM', symbol: 'ATOM' },
  { binance: 'TRXUSDT',   kraken: 'TRXUSD',  cc: 'TRX',  symbol: 'TRX' },
];

const COINGECKO_IDS = {
  BTC:'bitcoin', ETH:'ethereum', BNB:'binancecoin', SOL:'solana',
  XRP:'ripple', ADA:'cardano', DOGE:'dogecoin', MATIC:'matic-network',
  LTC:'litecoin', DOT:'polkadot', LINK:'chainlink', AVAX:'avalanche-2',
  UNI:'uniswap', ATOM:'cosmos', TRX:'tron',
};

// Source 1: Binance US (berbeda endpoint, kurang geo-block)
async function fetchFromBinanceUS() {
  const pairs = SYMBOLS.map(s => s.binance);
  const url = `https://api.binance.us/api/v3/ticker/24hr?symbols=${JSON.stringify(pairs)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`BinanceUS HTTP ${res.status}`);
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
  if (Object.keys(result).length === 0) throw new Error('BinanceUS: no data');
  return result;
}

// Source 2: Kraken (EU-based, tidak geo-block)
async function fetchFromKraken() {
  const krakenSymbols = SYMBOLS.filter(s => s.kraken);
  const pairs = krakenSymbols.map(s => s.kraken).join(',');
  const url = `https://api.kraken.com/0/public/Ticker?pair=${pairs}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Kraken HTTP ${res.status}`);
  const data = await res.json();
  if (data.error?.length) throw new Error(`Kraken: ${data.error[0]}`);
  const result = {};
  for (const sym of krakenSymbols) {
    // Kraken returns different key names sometimes
    const keys = Object.keys(data.result || {});
    const key = keys.find(k => k.includes(sym.kraken.replace('X', '').replace('Z', '')) || k === sym.kraken);
    if (key) {
      const t = data.result[key];
      result[sym.symbol] = {
        price: parseFloat(t.c[0]),
        change24h: 0, // Kraken doesn't provide 24h change directly in this endpoint
        volume24h: parseFloat(t.v[1]) * parseFloat(t.c[0]),
        high24h: parseFloat(t.h[1]),
        low24h: parseFloat(t.l[1]),
      };
    }
  }
  if (Object.keys(result).length === 0) throw new Error('Kraken: no data parsed');
  return result;
}

// Source 3: CryptoCompare (gratis, global)
async function fetchFromCryptoCompare() {
  const fsyms = SYMBOLS.map(s => s.cc).join(',');
  const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsyms}&tsyms=USD`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`CryptoCompare HTTP ${res.status}`);
  const data = await res.json();
  if (!data.RAW) throw new Error('CryptoCompare: no RAW data');
  const result = {};
  for (const sym of SYMBOLS) {
    const d = data.RAW[sym.cc]?.USD;
    if (d) {
      result[sym.symbol] = {
        price: d.PRICE || 0,
        change24h: d.CHANGEPCT24HOUR || 0,
        volume24h: d.TOTALVOLUME24HTO || 0,
        high24h: d.HIGH24HOUR || 0,
        low24h: d.LOW24HOUR || 0,
      };
    }
  }
  if (Object.keys(result).length === 0) throw new Error('CryptoCompare: no data');
  return result;
}

// Source 4: CoinGecko (last resort — rate limited)
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
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data?.rates?.IDR) return data.rates.IDR;
  } catch (_) {}
  return 16500;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const fetchedAt = new Date().toISOString();

    // Try sources in order: BinanceUS → CryptoCompare → Kraken → CoinGecko
    let priceData = {};
    let source = 'unknown';

    const sources = [
      { name: 'binance-us', fn: fetchFromBinanceUS },
      { name: 'cryptocompare', fn: fetchFromCryptoCompare },
      { name: 'kraken', fn: fetchFromKraken },
      { name: 'coingecko', fn: fetchFromCoinGecko },
    ];

    for (const s of sources) {
      try {
        priceData = await s.fn();
        source = s.name;
        console.log(`[cacheLivePrices] Fetched from ${s.name}: ${Object.keys(priceData).length} coins`);
        break;
      } catch (err) {
        console.warn(`[cacheLivePrices] ${s.name} failed: ${err.message}`);
      }
    }

    if (Object.keys(priceData).length === 0) {
      console.error('[cacheLivePrices] All sources failed');
      return Response.json({ error: 'All price sources failed' }, { status: 502 });
    }

    // Fetch IDR rate in parallel with price saving
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
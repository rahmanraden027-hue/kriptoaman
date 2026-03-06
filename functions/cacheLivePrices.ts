import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const COINGECKO_IDS = [
  'bitcoin','ethereum','binancecoin','solana','ripple',
  'cardano','dogecoin','tron','avalanche-2','polkadot',
  'matic-network','chainlink','litecoin','uniswap','cosmos'
];

const SYMBOL_MAP = {
  'bitcoin': 'BTC', 'ethereum': 'ETH', 'binancecoin': 'BNB',
  'solana': 'SOL', 'ripple': 'XRP', 'cardano': 'ADA',
  'dogecoin': 'DOGE', 'tron': 'TRX', 'avalanche-2': 'AVAX',
  'polkadot': 'DOT', 'matic-network': 'MATIC', 'chainlink': 'LINK',
  'litecoin': 'LTC', 'uniswap': 'UNI', 'cosmos': 'ATOM'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch from CoinGecko
    const ids = COINGECKO_IDS.join(',');
    const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_high_24h=true&include_low_24h=true`;
    const cgRes = await fetch(cgUrl, { headers: { 'Accept': 'application/json' } });
    const cgData = await cgRes.json();

    if (!cgData || typeof cgData !== 'object') {
      return Response.json({ error: 'Invalid CoinGecko response' }, { status: 502 });
    }

    // Fetch IDR rate
    let idrRate = 16200;
    try {
      const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const rateData = await rateRes.json();
      if (rateData?.rates?.IDR) idrRate = rateData.rates.IDR;
    } catch (_) {}

    const fetchedAt = new Date().toISOString();

    // Get existing cached records
    const existing = await base44.asServiceRole.entities.CachedPrice.filter({});
    const existingMap = {};
    for (const rec of existing) {
      existingMap[rec.symbol] = rec.id;
    }

    // Upsert each coin
    const updates = COINGECKO_IDS.map(async (id) => {
      const d = cgData[id];
      if (!d) return;
      const sym = SYMBOL_MAP[id];
      const data = {
        symbol: sym,
        price: d.usd || 0,
        change24h: d.usd_24h_change || 0,
        volume24h: d.usd_24h_vol || 0,
        high24h: d.usd_24h_high || 0,
        low24h: d.usd_24h_low || 0,
        idrRate,
        fetchedAt,
      };

      if (existingMap[sym]) {
        return base44.asServiceRole.entities.CachedPrice.update(existingMap[sym], data);
      } else {
        return base44.asServiceRole.entities.CachedPrice.create(data);
      }
    });

    await Promise.all(updates);

    return Response.json({
      success: true,
      updated: COINGECKO_IDS.length,
      idrRate,
      fetchedAt,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
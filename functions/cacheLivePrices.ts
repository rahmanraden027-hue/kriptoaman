import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SYMBOLS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT',
  'ADAUSDT','DOGEUSDT','TRXUSDT','AVAXUSDT','DOTUSDT',
  'MATICUSDT','LINKUSDT','LTCUSDT','UNIUSDT','ATOMUSDT'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch ticker data from Binance REST API
    const symbols = JSON.stringify(SYMBOLS);
    const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`;
    const binanceRes = await fetch(binanceUrl);
    const tickers = await binanceRes.json();

    if (!Array.isArray(tickers)) {
      return Response.json({ error: 'Invalid Binance response', detail: tickers }, { status: 502 });
    }

    // Fetch IDR rate
    let idrRate = 16200;
    try {
      const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const rateData = await rateRes.json();
      if (rateData?.rates?.IDR) idrRate = rateData.rates.IDR;
    } catch (_) {}

    const fetchedAt = new Date().toISOString();

    // Get existing cached records to update them
    const existing = await base44.asServiceRole.entities.CachedPrice.filter({});
    const existingMap = {};
    for (const rec of existing) {
      existingMap[rec.symbol] = rec.id;
    }

    // Upsert each symbol
    const updates = tickers.map(async (ticker) => {
      const sym = ticker.symbol.replace('USDT', '');
      const data = {
        symbol: sym,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChangePercent),
        volume24h: parseFloat(ticker.quoteVolume),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
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
      updated: tickers.length,
      idrRate,
      fetchedAt,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
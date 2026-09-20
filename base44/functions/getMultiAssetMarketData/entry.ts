import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fetch market data for different asset classes
async function getMarketData(assetClass, pair, timeframe = '1h') {
  try {
    if (assetClass === 'crypto') {
      return await getCryptoData(pair);
    } else if (assetClass === 'forex') {
      return await getForexData(pair);
    } else if (assetClass === 'indices') {
      return await getIndicesData(pair);
    } else if (assetClass === 'commodities') {
      return await getCommoditiesData(pair);
    }
  } catch (error) {
    console.error(`Error fetching ${assetClass} data for ${pair}:`, error);
    throw error;
  }
}

// Crypto data from Binance/CoinGecko
async function getCryptoData(pair) {
  const [symbol] = pair.split('/');
  
  try {
    // Fetch from CoinGecko for current price
    const geckoRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );
    const geckoData = await geckoRes.json();
    const priceData = geckoData[symbol.toLowerCase()];

    // Fetch historical data from Binance
    const binanceRes = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=100`
    );
    const klines = await binanceRes.json();

    const closes = klines.map(k => parseFloat(k[4]));
    const rsi = calculateRSI(closes);
    const atr = calculateATR(klines);

    return {
      symbol,
      pair,
      currentPrice: priceData.usd,
      change24h: priceData.usd_24h_change || 0,
      volume24h: priceData.usd_24h_vol || 0,
      marketCap: priceData.usd_market_cap || 0,
      rsi,
      atr,
      high: Math.max(...closes),
      low: Math.min(...closes),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Crypto data fetch error:', error);
    throw error;
  }
}

// Non-crypto providers fail closed until an approved live provider is configured.
async function getForexData(pair) {
  throw new Error(`Verified forex provider unavailable for ${pair}`);
}

async function getIndicesData(pair) {
  throw new Error(`Verified indices provider unavailable for ${pair}`);
}

async function getCommoditiesData(pair) {
  throw new Error(`Verified commodities provider unavailable for ${pair}`);
}

// Technical Indicators
function calculateRSI(prices, period = 14) {
  if (prices.length < period) return 50;
  
  let gains = 0, losses = 0;
  for (let i = 1; i < period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const rs = (gains / period) / (losses / period);
  return 100 - (100 / (1 + rs));
}

function calculateATR(klines, period = 14) {
  const trs = [];
  for (let i = 1; i < klines.length; i++) {
    const high = parseFloat(klines[i][2]);
    const low = parseFloat(klines[i][3]);
    const close = parseFloat(klines[i - 1][4]);
    
    const tr = Math.max(
      high - low,
      Math.abs(high - close),
      Math.abs(low - close)
    );
    trs.push(tr);
  }
  
  return trs.length >= period ? 
    trs.slice(-period).reduce((a, b) => a + b) / period : 
    (trs.reduce((a, b) => a + b, 0) / trs.length || 0);
}

function calculateATRFromPrices(prices) {
  if (prices.length < 14) return prices[prices.length - 1] * 0.02;
  const volatility = Math.sqrt(prices.slice(-14).reduce((sum, p, i, arr) => 
    sum + Math.pow(p - arr[i - 1] || p, 2), 0) / 14);
  return volatility;
}

// Main API endpoint
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetClass, pair } = await req.json();

    if (!assetClass || !pair) {
      return Response.json({ error: 'assetClass and pair are required' }, { status: 400 });
    }

    const marketData = await getMarketData(assetClass, pair);
    return Response.json(marketData);
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ status: 'UNAVAILABLE', error: error.message }, { status: 503 });
  }
});

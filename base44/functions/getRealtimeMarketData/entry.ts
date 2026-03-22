import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443/ws';

// Map symbols to CoinGecko IDs
const SYMBOL_TO_GECKO_ID = {
  'ETH': 'ethereum',
  'BTC': 'bitcoin',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network',
};

// Calculate RSI
function calculateRSI(prices, period = 14) {
  if (prices.length < period) return 50;
  
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / (avgLoss || 1);
  return 100 - (100 / (1 + rs));
}

// Calculate MACD
function calculateMACD(prices) {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  
  const macdLine = [];
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }
  
  const signal = calculateEMA(macdLine, 9)[macdLine.length - 1];
  return { macd, signal, histogram: macd - signal };
}

// Calculate EMA
function calculateEMA(prices, period) {
  const ema = [];
  const k = 2 / (period + 1);
  let sma = prices.slice(0, period).reduce((a, b) => a + b) / period;
  
  ema.push(sma);
  for (let i = period; i < prices.length; i++) {
    sma = prices[i] * k + sma * (1 - k);
    ema.push(sma);
  }
  
  return ema;
}

// Calculate ATR (Average True Range)
function calculateATR(highs, lows, closes, period = 14) {
  if (highs.length < period) return 0;
  
  let tr = 0;
  for (let i = Math.max(0, closes.length - period); i < closes.length; i++) {
    const h = highs[i];
    const l = lows[i];
    const c = closes[i - 1] || closes[i];
    const trValue = Math.max(h - l, Math.abs(h - c), Math.abs(l - c));
    tr += trValue;
  }
  
  return tr / period;
}

// Fetch CoinGecko data
async function fetchCoinGeckoData(symbol) {
  const geckoId = SYMBOL_TO_GECKO_ID[symbol] || symbol.toLowerCase();
  
  try {
    const res = await fetch(
      `${COINGECKO_API}/simple/price?ids=${geckoId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );
    const data = await res.json();
    return data[geckoId] || null;
  } catch (error) {
    console.error('CoinGecko error:', error);
    return null;
  }
}

// Fetch historical data from Binance
async function fetchBinanceHistoricalData(symbol, interval = '1h', limit = 100) {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    const data = await res.json();
    
    return data.map(candle => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[7]),
    }));
  } catch (error) {
    console.error('Binance error:', error);
    return [];
  }
}

// Calculate support and resistance levels
function calculateSupportResistance(candles) {
  if (candles.length < 5) return { support: 0, resistance: 0 };
  
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const recentLows = lows.slice(-20);
  const recentHighs = highs.slice(-20);
  
  const support = Math.min(...recentLows);
  const resistance = Math.max(...recentHighs);
  
  return { support, resistance };
}

// Calculate trend
function calculateTrend(closes) {
  if (closes.length < 2) return 'NEUTRAL';
  
  const recent = closes.slice(-10);
  const sma = recent.reduce((a, b) => a + b) / recent.length;
  const currentPrice = closes[closes.length - 1];
  
  if (currentPrice > sma * 1.02) return 'UPTREND';
  if (currentPrice < sma * 0.98) return 'DOWNTREND';
  return 'NEUTRAL';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol, pair } = await req.json();
    
    if (!symbol || !pair) {
      return Response.json(
        { error: 'symbol and pair required' },
        { status: 400 }
      );
    }

    // Fetch CoinGecko data (price, volume, change)
    const geckoData = await fetchCoinGeckoData(symbol);
    
    // Fetch historical data from Binance
    const historical = await fetchBinanceHistoricalData(pair, '1h', 100);
    
    if (!historical.length) {
      return Response.json(
        { error: 'No market data available' },
        { status: 404 }
      );
    }

    // Calculate technical indicators
    const closes = historical.map(c => c.close);
    const highs = historical.map(c => c.high);
    const lows = historical.map(c => c.low);
    const volumes = historical.map(c => c.volume);
    
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const atr = calculateATR(highs, lows, closes);
    const { support, resistance } = calculateSupportResistance(historical);
    const trend = calculateTrend(closes);
    
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    const currentPrice = closes[closes.length - 1];
    const change24h = geckoData?.usd_24h_change || 0;
    const volume24h = geckoData?.usd_24h_vol || 0;

    return Response.json({
      symbol,
      pair,
      currentPrice,
      change24h,
      volume24h,
      avgVolume,
      indicators: {
        rsi,
        macd,
        atr,
        support,
        resistance,
        trend,
      },
      marketData: {
        high: Math.max(...highs),
        low: Math.min(...lows),
        marketCap: geckoData?.usd_market_cap,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
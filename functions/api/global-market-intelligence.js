const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800, stale-if-error=7200',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const safeNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeSeries = payload => {
  if (!payload || !Array.isArray(payload.values)) return [];
  return payload.values
    .map(item => ({ date: String(item.datetime || '').slice(0, 10), close: safeNumber(item.close) }))
    .filter(item => item.date && item.close != null)
    .sort((a, b) => a.date.localeCompare(b.date));
};

const keyedPayload = (payload, symbol) => {
  if (!payload || typeof payload !== 'object') return null;
  if (Array.isArray(payload.values)) return payload;
  if (payload[symbol] && typeof payload[symbol] === 'object') return payload[symbol];
  return null;
};

const returnsByDate = series => {
  const result = new Map();
  for (let index = 1; index < series.length; index += 1) {
    const previous = series[index - 1]?.close;
    const current = series[index]?.close;
    if (!previous || !current) continue;
    result.set(series[index].date, (current / previous) - 1);
  }
  return result;
};

const pearson = (leftMap, rightMap) => {
  const pairs = [];
  for (const [date, left] of leftMap.entries()) {
    const right = rightMap.get(date);
    if (Number.isFinite(left) && Number.isFinite(right)) pairs.push([left, right]);
  }
  if (pairs.length < 10) return { value: null, samples: pairs.length };
  const leftMean = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
  const rightMean = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (const [left, right] of pairs) {
    const leftDelta = left - leftMean;
    const rightDelta = right - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }
  const denominator = Math.sqrt(leftVariance * rightVariance);
  return {
    value: denominator > 0 ? numerator / denominator : null,
    samples: pairs.length,
  };
};

const volatility = series => {
  const returns = [...returnsByDate(series).values()];
  if (returns.length < 10) return null;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / Math.max(1, returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
};

const momentum = (series, lookback = 20) => {
  if (series.length <= lookback) return null;
  const latest = series[series.length - 1]?.close;
  const base = series[series.length - 1 - lookback]?.close;
  if (!latest || !base) return null;
  return ((latest / base) - 1) * 100;
};

export async function onRequestGet({ env }) {
  const requestId = crypto.randomUUID();
  const apiKey = String(env?.TWELVE_DATA_API_KEY || '').trim();
  if (!apiKey) {
    return json({
      status: 'not_configured',
      code: 'PROFESSIONAL_MARKET_DATA_NOT_CONFIGURED',
      message: 'Cross-asset intelligence requires the professional market data provider.',
      requestId,
    }, 503, { 'Retry-After': '300' });
  }

  const dxyProviderSymbol = String(env?.TWELVE_DATA_DXY_SYMBOL || 'DXY').trim() || 'DXY';
  const symbols = ['BTC/USD', 'XAU/USD', dxyProviderSymbol];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const endpoint = new URL('https://api.twelvedata.com/time_series');
    endpoint.searchParams.set('symbol', symbols.join(','));
    endpoint.searchParams.set('interval', '1day');
    endpoint.searchParams.set('outputsize', '100');
    endpoint.searchParams.set('order', 'asc');
    endpoint.searchParams.set('timezone', 'UTC');

    const response = await fetch(endpoint.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `apikey ${apiKey}`,
        'User-Agent': 'KriptoAman-Global-Markets/2.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return json({ status: 'unavailable', code: `GLOBAL_INTELLIGENCE_HTTP_${response.status}`, requestId }, 503, { 'Retry-After': '120' });
    }

    const payload = await response.json();
    const btc = normalizeSeries(keyedPayload(payload, 'BTC/USD'));
    const gold = normalizeSeries(keyedPayload(payload, 'XAU/USD'));
    const dxy = normalizeSeries(keyedPayload(payload, dxyProviderSymbol));

    if (btc.length < 20 || gold.length < 20) {
      return json({
        status: 'degraded',
        code: 'GLOBAL_INTELLIGENCE_INSUFFICIENT_HISTORY',
        availability: { btc: btc.length, gold: gold.length, dxy: dxy.length },
        requestId,
      }, 206);
    }

    const btcReturns = returnsByDate(btc);
    const goldReturns = returnsByDate(gold);
    const dxyReturns = returnsByDate(dxy);
    const btcGold = pearson(btcReturns, goldReturns);
    const goldDxy = dxy.length ? pearson(goldReturns, dxyReturns) : { value: null, samples: 0 };
    const btcDxy = dxy.length ? pearson(btcReturns, dxyReturns) : { value: null, samples: 0 };

    return json({
      schemaVersion: '1.0',
      status: dxy.length >= 20 ? 'available' : 'degraded',
      provider: 'Twelve Data',
      window: 'up-to-100-daily-observations',
      methodology: {
        correlation: 'Pearson correlation of overlapping daily close-to-close returns',
        volatility: 'Sample standard deviation of daily returns annualized by sqrt(252)',
        momentum: '20-session close-to-close percentage change',
      },
      correlations: {
        btcGold: btcGold.value,
        goldDxy: goldDxy.value,
        btcDxy: btcDxy.value,
      },
      correlationSamples: {
        btcGold: btcGold.samples,
        goldDxy: goldDxy.samples,
        btcDxy: btcDxy.samples,
      },
      volatilityPct: {
        btc: volatility(btc),
        gold: volatility(gold),
        dxy: dxy.length ? volatility(dxy) : null,
      },
      momentum20Pct: {
        btc: momentum(btc),
        gold: momentum(gold),
        dxy: dxy.length ? momentum(dxy) : null,
      },
      latest: {
        btcUsd: btc.at(-1)?.close || null,
        xauUsd: gold.at(-1)?.close || null,
        dxy: dxy.at(-1)?.close || null,
      },
      dxy: {
        available: dxy.length >= 20,
        providerSymbol: dxyProviderSymbol,
      },
      attribution: {
        required: true,
        label: 'Data provided by Twelve Data',
        url: 'https://twelvedata.com/',
      },
      disclosure: 'Analytics are descriptive market statistics, not forecasts, investment advice, or trading signals.',
      requestId,
    }, 200, { 'X-KriptoAman-Global-Intelligence': 'cross-asset-v1' });
  } catch (error) {
    console.error('Global market intelligence unavailable', { requestId, error });
    return json({ status: 'unavailable', code: 'GLOBAL_INTELLIGENCE_FAILED', requestId }, 503, { 'Retry-After': '120' });
  } finally {
    clearTimeout(timeout);
  }
}

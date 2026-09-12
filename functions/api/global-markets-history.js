const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=900, stale-if-error=3600',
  'X-Content-Type-Options': 'nosniff',
};

const ALLOWED_SYMBOLS = new Set([
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'XAU/USD', 'BTC/USD', 'DXY',
]);
const ALLOWED_INTERVALS = new Set(['1min', '5min', '15min', '1h', '4h', '1day']);

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const numberOrNull = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function onRequestGet({ env, request }) {
  const requestId = crypto.randomUUID();
  const apiKey = String(env?.TWELVE_DATA_API_KEY || '').trim();
  if (!apiKey) {
    return json({
      status: 'not_configured',
      code: 'PROFESSIONAL_MARKET_DATA_NOT_CONFIGURED',
      message: 'Professional OHLC market data provider is not configured.',
      requestId,
    }, 503, { 'Retry-After': '300' });
  }

  const url = new URL(request.url);
  const publicSymbol = String(url.searchParams.get('symbol') || 'XAU/USD').toUpperCase();
  const interval = String(url.searchParams.get('interval') || '1h');
  const requestedOutput = Number.parseInt(url.searchParams.get('outputsize') || '120', 10);
  const outputsize = Number.isFinite(requestedOutput) ? Math.max(20, Math.min(200, requestedOutput)) : 120;

  if (!ALLOWED_SYMBOLS.has(publicSymbol) || !ALLOWED_INTERVALS.has(interval)) {
    return json({
      status: 'invalid_request',
      code: 'GLOBAL_MARKET_HISTORY_NOT_ALLOWED',
      requestId,
    }, 400);
  }

  const providerSymbol = publicSymbol === 'DXY'
    ? String(env?.TWELVE_DATA_DXY_SYMBOL || 'DXY').trim() || 'DXY'
    : publicSymbol;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const endpoint = new URL('https://api.twelvedata.com/time_series');
    endpoint.searchParams.set('symbol', providerSymbol);
    endpoint.searchParams.set('interval', interval);
    endpoint.searchParams.set('outputsize', String(outputsize));
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
      return json({
        status: 'unavailable',
        code: `GLOBAL_MARKET_HISTORY_HTTP_${response.status}`,
        requestId,
      }, 503, { 'Retry-After': '60' });
    }

    const payload = await response.json();
    if (payload?.status === 'error' || !Array.isArray(payload?.values)) {
      return json({
        status: 'unavailable',
        code: payload?.code ? `TWELVE_DATA_${payload.code}` : 'GLOBAL_MARKET_HISTORY_EMPTY',
        message: payload?.message || 'OHLC data is unavailable for this instrument.',
        requestId,
      }, 503, { 'Retry-After': '60' });
    }

    const values = payload.values.map(item => ({
      datetime: item.datetime,
      open: numberOrNull(item.open),
      high: numberOrNull(item.high),
      low: numberOrNull(item.low),
      close: numberOrNull(item.close),
      volume: numberOrNull(item.volume),
    })).filter(item => item.datetime && item.close != null);

    return json({
      schemaVersion: '1.0',
      status: 'available',
      symbol: publicSymbol,
      providerSymbol,
      interval,
      provider: 'Twelve Data',
      values,
      attribution: {
        required: true,
        label: 'Data provided by Twelve Data',
        url: 'https://twelvedata.com/',
      },
      requestId,
    }, 200, { 'X-KriptoAman-Market-History': 'twelve-data-v1' });
  } catch (error) {
    console.error('Global market history unavailable', { requestId, error });
    return json({
      status: 'unavailable',
      code: 'GLOBAL_MARKET_HISTORY_FAILED',
      requestId,
    }, 503, { 'Retry-After': '60' });
  } finally {
    clearTimeout(timeout);
  }
}

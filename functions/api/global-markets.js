const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300, stale-if-error=1800',
  'X-Content-Type-Options': 'nosniff',
};

const TWELVE_DATA_BASE = 'https://api.twelvedata.com';
const FALLBACK_URL = 'https://api.exchangerate.fun/latest?base=USD';

const CORE_INSTRUMENTS = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex', precision: 5 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', assetClass: 'forex', precision: 5 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', assetClass: 'forex', precision: 3 },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', assetClass: 'forex', precision: 5 },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', assetClass: 'forex', precision: 5 },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', assetClass: 'forex', precision: 5 },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', assetClass: 'forex', precision: 5 },
  { symbol: 'XAU/USD', name: 'Gold Spot / US Dollar', assetClass: 'metal', precision: 2 },
];

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...HEADERS, ...extraHeaders },
});

const safeNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const inverse = value => {
  const n = safeNumber(value);
  return n ? 1 / n : null;
};

const instrument = ({ symbol, name, assetClass, precision }, price, change24h = null, meta = {}) => ({
  symbol,
  name,
  assetClass,
  price: safeNumber(price),
  precision,
  change24h: Number.isFinite(Number(change24h)) ? Number(change24h) : null,
  changeStatus: Number.isFinite(Number(change24h)) ? 'available' : 'unavailable',
  ...meta,
});

const normalizeBatchQuote = (payload, symbol) => {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.symbol === symbol) return payload;
  if (payload[symbol] && typeof payload[symbol] === 'object') return payload[symbol];
  if (Array.isArray(payload.data)) return payload.data.find(item => item?.symbol === symbol) || null;
  return null;
};

async function fetchProfessionalMarketData(env, signal) {
  const apiKey = String(env?.TWELVE_DATA_API_KEY || '').trim();
  if (!apiKey) return null;

  const dxySymbol = String(env?.TWELVE_DATA_DXY_SYMBOL || 'DXY').trim() || 'DXY';
  const definitions = [
    ...CORE_INSTRUMENTS,
    { symbol: dxySymbol, publicSymbol: 'DXY', name: 'US Dollar Index', assetClass: 'index', precision: 3 },
  ];
  const symbols = definitions.map(item => item.symbol).join(',');
  const url = `${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbols)}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `apikey ${apiKey}`,
      'User-Agent': 'KriptoAman-Global-Markets/2.0',
    },
    signal,
  });

  if (!response.ok) throw new Error(`TWELVE_DATA_HTTP_${response.status}`);
  const payload = await response.json();

  const instruments = definitions.map(definition => {
    const quote = normalizeBatchQuote(payload, definition.symbol);
    const latest = quote?.close ?? quote?.price;
    if (!safeNumber(latest)) return null;
    const change24h = quote?.rolling_1d_change ?? quote?.percent_change;
    return instrument(
      {
        ...definition,
        symbol: definition.publicSymbol || definition.symbol,
      },
      latest,
      change24h,
      {
        providerSymbol: definition.symbol,
        marketOpen: typeof quote?.is_market_open === 'boolean' ? quote.is_market_open : null,
        quoteTimestamp: Number(quote?.timestamp) || Number(quote?.last_quote_at) || null,
      },
    );
  }).filter(Boolean);

  if (instruments.length < 4) throw new Error('TWELVE_DATA_PARTIAL');

  return {
    schemaVersion: '2.0',
    status: instruments.length >= CORE_INSTRUMENTS.length ? 'available' : 'degraded',
    base: 'USD',
    provider: 'Twelve Data',
    providerCadence: 'real-time-or-delayed-by-plan',
    providerMode: 'professional',
    marketUse: 'information-only',
    capturedAt: new Date().toISOString(),
    instruments,
    attribution: {
      required: true,
      label: 'Data provided by Twelve Data',
      url: 'https://twelvedata.com/',
    },
  };
}

async function fetchReferenceFallback(signal) {
  const response = await fetch(FALLBACK_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KriptoAman-Global-Markets/2.0',
    },
    signal,
  });

  if (!response.ok) throw new Error(`FALLBACK_HTTP_${response.status}`);
  const payload = await response.json();
  const rates = payload?.rates || {};
  const bySymbol = {
    'EUR/USD': inverse(rates.EUR),
    'GBP/USD': inverse(rates.GBP),
    'USD/JPY': rates.JPY,
    'USD/CHF': rates.CHF,
    'AUD/USD': inverse(rates.AUD),
    'USD/CAD': rates.CAD,
    'NZD/USD': inverse(rates.NZD),
    'XAU/USD': inverse(rates.XAU),
  };
  const instruments = CORE_INSTRUMENTS
    .map(definition => instrument(definition, bySymbol[definition.symbol]))
    .filter(item => item.price != null);

  if (instruments.length < 4) throw new Error('GLOBAL_MARKETS_PARTIAL_DATA');

  return {
    schemaVersion: '2.0',
    status: 'reference',
    base: 'USD',
    provider: 'ExchangeRate.fun',
    providerCadence: 'hourly-reference',
    providerMode: 'fallback-reference',
    marketUse: 'information-only',
    capturedAt: payload?.date || new Date().toISOString(),
    instruments,
    attribution: null,
  };
}

export async function onRequestGet({ env }) {
  const requestId = crypto.randomUUID();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    let result = null;
    let professionalError = null;

    try {
      result = await fetchProfessionalMarketData(env, controller.signal);
    } catch (error) {
      professionalError = String(error?.message || 'PROFESSIONAL_PROVIDER_UNAVAILABLE');
      console.warn('Professional global market provider unavailable; using reference fallback', { requestId, error: professionalError });
    }

    if (!result) result = await fetchReferenceFallback(controller.signal);

    return json({
      ...result,
      professionalProviderConfigured: Boolean(String(env?.TWELVE_DATA_API_KEY || '').trim()),
      professionalProviderError: professionalError,
      disclosure: {
        executionPrice: false,
        investmentAdvice: false,
        derivativesExecution: false,
        note: 'Market information only. Quotes may be real-time or delayed according to provider entitlement and can differ from broker or venue execution prices.',
      },
      requestId,
    }, 200, {
      'X-KriptoAman-Global-Markets': result.providerMode === 'professional' ? 'professional-v2' : 'reference-v2',
    });
  } catch (error) {
    console.error('Global markets unavailable', { requestId, error });
    return json({
      status: 'unavailable',
      code: 'GLOBAL_MARKETS_FETCH_FAILED',
      message: 'Global market data is temporarily unavailable.',
      requestId,
    }, 503, { 'Retry-After': '60' });
  } finally {
    clearTimeout(timeout);
  }
}

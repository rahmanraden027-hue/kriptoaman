const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=900, stale-if-error=3600',
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

const inverse = value => {
  const n = safeNumber(value);
  return n ? 1 / n : null;
};

const instrument = (symbol, name, assetClass, price, precision = 5) => ({
  symbol,
  name,
  assetClass,
  price: safeNumber(price),
  precision,
  change24h: null,
  changeStatus: 'unavailable',
});

export async function onRequestGet() {
  const requestId = crypto.randomUUID();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.exchangerate.fun/latest?base=USD', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'KriptoAman-Global-Markets/1.0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return json({
        status: 'unavailable',
        code: 'GLOBAL_MARKETS_PROVIDER_ERROR',
        message: 'Global market reference data is temporarily unavailable.',
        requestId,
      }, 503, { 'Retry-After': '60' });
    }

    const payload = await response.json();
    const rates = payload?.rates || {};
    const xauUsd = inverse(rates.XAU);

    const instruments = [
      instrument('EUR/USD', 'Euro / US Dollar', 'forex', inverse(rates.EUR), 5),
      instrument('GBP/USD', 'British Pound / US Dollar', 'forex', inverse(rates.GBP), 5),
      instrument('USD/JPY', 'US Dollar / Japanese Yen', 'forex', rates.JPY, 3),
      instrument('USD/CHF', 'US Dollar / Swiss Franc', 'forex', rates.CHF, 5),
      instrument('AUD/USD', 'Australian Dollar / US Dollar', 'forex', inverse(rates.AUD), 5),
      instrument('USD/CAD', 'US Dollar / Canadian Dollar', 'forex', rates.CAD, 5),
      instrument('NZD/USD', 'New Zealand Dollar / US Dollar', 'forex', inverse(rates.NZD), 5),
      instrument('XAU/USD', 'Gold Spot / US Dollar', 'metal', xauUsd, 2),
    ].filter(item => item.price != null);

    if (instruments.length < 4) {
      return json({
        status: 'degraded',
        code: 'GLOBAL_MARKETS_PARTIAL_DATA',
        message: 'Global market reference data is incomplete.',
        instruments,
        requestId,
      }, 206);
    }

    return json({
      schemaVersion: '1.0',
      status: 'available',
      base: 'USD',
      provider: 'ExchangeRate.fun',
      providerCadence: 'hourly-reference',
      marketUse: 'information-only',
      capturedAt: payload?.date || new Date().toISOString(),
      instruments,
      disclosure: {
        executionPrice: false,
        investmentAdvice: false,
        derivativesExecution: false,
        note: 'Reference market information only. Prices may be delayed and can differ from broker or venue execution prices.',
      },
      requestId,
    }, 200, {
      'X-KriptoAman-Global-Markets': 'reference-v1',
    });
  } catch (error) {
    console.error('Global markets unavailable', { requestId, error });
    return json({
      status: 'unavailable',
      code: 'GLOBAL_MARKETS_FETCH_FAILED',
      message: 'Global market reference data is temporarily unavailable.',
      requestId,
    }, 503, { 'Retry-After': '60' });
  } finally {
    clearTimeout(timeout);
  }
}

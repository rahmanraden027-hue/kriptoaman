import { json } from '../../server/auth/http.js';

const PROVIDERS = [
  {
    id: 'coinlore',
    name: 'Data Pasar CoinLore',
    url: 'https://api.coinlore.net/api/tickers/?start=0&limit=1',
    critical: true,
    degradesOverall: true,
    role: 'market-primary',
  },
  {
    id: 'coinbase-market',
    name: 'Data Pasar Coinbase',
    url: 'https://api.coinbase.com/v2/exchange-rates?currency=USD',
    critical: false,
    degradesOverall: true,
    role: 'market-secondary-consensus',
  },
  {
    id: 'fear-greed',
    name: 'Fear & Greed Index',
    url: 'https://api.alternative.me/fng/?limit=1',
    critical: false,
    degradesOverall: true,
    role: 'market-sentiment',
  },
];

function coinGeckoConfig(env = {}) {
  if (env.COINGECKO_PRO_API_KEY) {
    return {
      tier: 'pro',
      authenticated: true,
      url: 'https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      requestHeaders: { 'x-cg-pro-api-key': env.COINGECKO_PRO_API_KEY },
    };
  }

  const demoKey = env.COINGECKO_DEMO_API_KEY || env.COINGECKO_API_KEY;
  if (demoKey) {
    return {
      tier: 'demo',
      authenticated: true,
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      requestHeaders: { 'x-cg-demo-api-key': demoKey },
    };
  }

  return {
    tier: 'public-keyless',
    authenticated: false,
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    requestHeaders: {},
  };
}

async function timedCheck(url, timeoutMs = 7000, requestHeaders = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'KriptoAman-Health/1.1',
        ...requestHeaders,
      },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    return {
      state: response.ok ? 'ok' : response.status === 429 ? 'rate_limited' : 'error',
      latency_ms: Date.now() - started,
      http_status: response.status,
    };
  } catch (error) {
    return {
      state: 'error',
      latency_ms: null,
      error: error?.name === 'AbortError' ? 'timeout' : 'unreachable',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function coinGeckoCheck(env) {
  const config = coinGeckoConfig(env);
  const result = await timedCheck(config.url, 7000, config.requestHeaders);
  return {
    id: 'coingecko',
    name: 'Data Pasar CoinGecko',
    critical: false,
    degradesOverall: false,
    advisory: true,
    role: 'market-additional-provider',
    tier: config.tier,
    authenticated: config.authenticated,
    ...result,
  };
}

async function databaseCheck(env) {
  if (!env.AUTH_DB) return { state: 'unconfigured' };
  const started = Date.now();
  try {
    await env.AUTH_DB.prepare('SELECT 1 AS ok').first();
    return { state: 'ok', latency_ms: Date.now() - started };
  } catch {
    return { state: 'error', latency_ms: null };
  }
}

export async function onRequestGet({ env }) {
  const [database, coingecko, ...providers] = await Promise.all([
    databaseCheck(env),
    coinGeckoCheck(env),
    ...PROVIDERS.map(async (provider) => ({
      ...provider,
      ...(await timedCheck(provider.url)),
    })),
  ]);

  const services = [
    { id: 'app', name: 'Aplikasi KriptoAman', critical: true, degradesOverall: true, state: 'ok', latency_ms: 0 },
    { id: 'database', name: 'Database & Sesi Akun', critical: true, degradesOverall: true, ...database },
    ...providers.map(({ url, ...service }) => service),
    coingecko,
  ];

  const isUnavailable = (service) => !['ok'].includes(service.state);
  const criticalFailure = services.some(
    (service) => service.critical && isUnavailable(service),
  );
  const supportingFailure = services.some(
    (service) => !service.critical && service.degradesOverall !== false && isUnavailable(service),
  );
  const overall = criticalFailure ? 'outage' : supportingFailure ? 'degraded' : 'ok';

  const marketOperationalProviders = services
    .filter((service) => ['market-primary', 'market-secondary-consensus'].includes(service.role))
    .filter((service) => service.state === 'ok')
    .map((service) => service.id);

  return json({
    ok: overall !== 'outage',
    overall,
    checked_at: new Date().toISOString(),
    market_redundancy: {
      healthy: marketOperationalProviders.length >= 2,
      operational_provider_count: marketOperationalProviders.length,
      operational_providers: marketOperationalProviders,
      required_operational_providers: 2,
      coinGeckoAdvisoryOnly: true,
    },
    services,
  });
}

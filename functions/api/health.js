import { json } from '../../server/auth/http.js';

const PROVIDERS = [
  { id: 'coinlore', name: 'Data Pasar CoinLore', url: 'https://api.coinlore.net/api/tickers/?start=0&limit=1', critical: true },
  { id: 'coingecko', name: 'Data Pasar CoinGecko', url: 'https://api.coingecko.com/api/v3/ping', critical: false },
  { id: 'fear-greed', name: 'Fear & Greed Index', url: 'https://api.alternative.me/fng/?limit=1', critical: false },
];

async function timedCheck(url, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'KriptoAman-Health/1.0' },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    return {
      state: response.ok ? 'ok' : 'error',
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
  const [database, ...providers] = await Promise.all([
    databaseCheck(env),
    ...PROVIDERS.map(async (provider) => ({
      ...provider,
      ...(await timedCheck(provider.url)),
    })),
  ]);

  const services = [
    { id: 'app', name: 'Aplikasi KriptoAman', critical: true, state: 'ok', latency_ms: 0 },
    { id: 'database', name: 'Database & Sesi Akun', critical: true, ...database },
    ...providers.map(({ url, ...service }) => service),
  ];

  const criticalError = services.some((service) => service.critical && service.state === 'error');
  const criticalUnconfigured = services.some((service) => service.critical && service.state === 'unconfigured');
  const supportingError = services.some((service) => !service.critical && service.state === 'error');
  const overall = criticalError || criticalUnconfigured ? 'outage' : supportingError ? 'degraded' : 'ok';

  return json({
    ok: overall !== 'outage',
    overall,
    checked_at: new Date().toISOString(),
    services,
  });
}

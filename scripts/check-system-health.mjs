const ENDPOINT = process.env.SYSTEM_HEALTH_URL || 'https://kriptoaman.com/api/health';
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

try {
  const response = await fetch(ENDPOINT, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KriptoAman-System-Health-Monitor/1.0',
    },
    signal: controller.signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Health endpoint returned an invalid payload');
  }

  if (payload.ok !== true || payload.overall === 'outage') {
    throw new Error(`Production health is ${payload?.overall || 'unknown'}: ${JSON.stringify(payload)}`);
  }

  if (!['ok', 'degraded'].includes(payload.overall)) {
    throw new Error(`Production health returned an unknown state: ${JSON.stringify(payload)}`);
  }

  const requiredServices = ['app', 'database', 'coinlore', 'coinbase-market'];
  const services = Array.isArray(payload.services) ? payload.services : [];

  for (const id of requiredServices) {
    const service = services.find((item) => item?.id === id);
    if (!service) throw new Error(`Required service missing from health response: ${id}`);
    if (service.state !== 'ok') {
      throw new Error(`Required service ${id} is ${service.state || 'unknown'}`);
    }
  }

  if (payload.market_redundancy?.healthy !== true
      || Number(payload.market_redundancy?.operational_provider_count || 0) < 2) {
    throw new Error(`Market redundancy is insufficient: ${JSON.stringify(payload.market_redundancy)}`);
  }

  console.log(JSON.stringify({
    status: payload.overall === 'degraded' ? 'healthy_with_fallback' : 'healthy',
    overall: payload.overall,
    checkedAt: payload.checked_at,
    marketRedundancy: payload.market_redundancy,
    services: services.map(({ id, state, latency_ms }) => ({ id, state, latency_ms })),
  }));
} finally {
  clearTimeout(timeout);
}

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

  const requiredServices = ['app', 'database', 'coinlore'];
  const services = Array.isArray(payload.services) ? payload.services : [];

  for (const id of requiredServices) {
    const service = services.find((item) => item?.id === id);
    if (!service) throw new Error(`Required service missing from health response: ${id}`);
    if (service.state !== 'ok') {
      throw new Error(`Required service ${id} is ${service.state || 'unknown'}`);
    }
  }

  console.log(JSON.stringify({
    status: payload.overall === 'degraded' ? 'healthy_with_fallback' : 'healthy',
    overall: payload.overall,
    checkedAt: payload.checked_at,
    services: services.map(({ id, state, latency_ms }) => ({ id, state, latency_ms })),
  }));
} finally {
  clearTimeout(timeout);
}

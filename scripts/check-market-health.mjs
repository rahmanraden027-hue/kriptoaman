const ENDPOINT = process.env.MARKET_HEALTH_URL || 'https://kriptoaman.com/api/market-snapshot?health=1';
const MIN_ASSETS = 4500;
const MAX_AGE_MS = 60 * 60 * 1000;
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);

try {
  const response = await fetch(ENDPOINT, {
    headers: { Accept: 'application/json', 'User-Agent': 'KriptoAman-Health-Monitor/1.0' },
    signal: controller.signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
  if (!payload || payload.assetCount < MIN_ASSETS) {
    throw new Error(`Asset count below safety floor: ${payload?.assetCount || 0}`);
  }
  if (!Number.isFinite(payload.ageMs) || payload.ageMs > MAX_AGE_MS) {
    throw new Error(`Snapshot too old: ${payload?.ageMs ?? 'unknown'}ms`);
  }
  if (payload.healthy !== true) throw new Error('Endpoint reported unhealthy state');
  console.log(JSON.stringify({
    status: 'healthy',
    assetCount: payload.assetCount,
    source: payload.source,
    ageMinutes: Math.round(payload.ageMs / 60000),
    capturedAt: new Date(payload.capturedAt).toISOString(),
  }));
} finally {
  clearTimeout(timeout);
}

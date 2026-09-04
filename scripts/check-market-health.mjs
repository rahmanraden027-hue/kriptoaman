const ENDPOINT = process.env.MARKET_HEALTH_URL || 'https://kriptoaman.com/api/market-snapshot?health=1';
const MIN_ASSETS = 4500;
const MAX_AGE_MS = 15 * 60 * 1000;
const PROACTIVE_REFRESH_AGE_MS = 8 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 120_000;

function forceRefreshUrl(endpoint) {
  const url = new URL(endpoint);
  url.searchParams.set('health', '1');
  url.searchParams.set('refresh', '1');
  return url.toString();
}

async function readMarket(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'KriptoAman-Health-Monitor/2.0' },
      cache: 'no-store',
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function validateCoverage(payload) {
  if (!payload || !Number.isFinite(Number(payload.assetCount)) || Number(payload.assetCount) < MIN_ASSETS) {
    throw new Error(`Asset count below safety floor: ${payload?.assetCount || 0}`);
  }
}

function validateOperationalFreshness(payload) {
  validateCoverage(payload);
  if (!Number.isFinite(Number(payload.ageMs)) || Number(payload.ageMs) > MAX_AGE_MS) {
    throw new Error(`Snapshot too old for operational status: ${payload?.ageMs ?? 'unknown'}ms`);
  }
  if (payload.stale === true) throw new Error('Snapshot is marked stale');
  if (payload.healthy !== true) throw new Error('Endpoint reported unhealthy state');
}

let payload = await readMarket(ENDPOINT);
validateCoverage(payload);

const ageMs = Number(payload.ageMs);
const refreshNeeded = payload.refreshDue === true
  || !Number.isFinite(ageMs)
  || ageMs >= PROACTIVE_REFRESH_AGE_MS;

if (refreshNeeded) {
  payload = await readMarket(forceRefreshUrl(ENDPOINT));
}

validateOperationalFreshness(payload);

console.log(JSON.stringify({
  status: 'healthy',
  assetCount: Number(payload.assetCount),
  source: payload.source,
  ageMinutes: Math.round(Number(payload.ageMs) / 60000),
  capturedAt: new Date(Number(payload.capturedAt)).toISOString(),
  proactiveRefreshThresholdMinutes: Math.round(PROACTIVE_REFRESH_AGE_MS / 60000),
  refreshRequested: refreshNeeded,
  refreshPerformed: payload.refreshPerformed === true,
  chunkReady: payload.chunkReady ?? null,
}));

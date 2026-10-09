// Isolated Cloudflare Cron, no HTTP routes and no blockchain writes.
export const MARKET_WARM_URL = 'https://kriptoaman.com/api/market-snapshot?health=1&refresh=1';
export const MIN_ASSETS = 4500;
export const MAX_CAPTURE_AGE_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 110_000;

export async function probeMarketFreshness(fetcher = fetch, clock = () => Date.now()) {
  const response = await fetcher(MARKET_WARM_URL, {
    method: 'GET',
    headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('MARKET_WARM_HTTP_' + response.status);
  const snapshot = await response.json();
  const now = clock();
  const count = Number(snapshot?.assetCount);
  const capturedAt = Number(snapshot?.capturedAt);
  const age = now - capturedAt;
  if (!Number.isSafeInteger(count) || count < MIN_ASSETS) throw new Error('MARKET_ASSET_FLOOR');
  if (!Number.isFinite(capturedAt) || capturedAt <= 0 || capturedAt > now) throw new Error('MARKET_CAPTURE_INVALID');
  if (age < 0 || age > MAX_CAPTURE_AGE_MS || snapshot?.stale !== false || snapshot?.healthy !== true) {
    throw new Error('MARKET_SNAPSHOT_STALE_OR_UNHEALTHY');
  }
  const chunks = Number(snapshot?.chunkCount), expected = Number(snapshot?.expectedChunks);
  if (snapshot?.chunkReady !== true || !Number.isSafeInteger(chunks) || !Number.isSafeInteger(expected)
      || expected < 45 || chunks < expected) throw new Error('MARKET_CHUNKS_NOT_READY');
  return { status: 'PASS', assetCount: count, source: snapshot.source ?? null,
    ageMs: age, chunkCount: chunks, expectedChunks: expected,
    refreshPerformed: snapshot.refreshPerformed === true };
}

export default {
  async scheduled() {
    const result = await probeMarketFreshness();
    console.log(JSON.stringify({ service: 'kriptoaman-market-heartbeat', ...result }));
  },
};

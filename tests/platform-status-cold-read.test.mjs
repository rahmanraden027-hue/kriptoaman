import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('platform status reads compact market metadata directly through D1 Sessions', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /import \{ primarySession, readSession \} from '\.\.\/_shared\/d1-session\.js'/);
  assert.match(source, /async function readMarketMetadata/);
  assert.match(source, /SELECT source, asset_count, captured_at FROM market_snapshots WHERE id = \?/);
  assert.doesNotMatch(source, /SELECT source, asset_count, captured_at, payload FROM market_snapshots/);
  assert.match(source, /readMode: 'd1-direct'/);
  assert.match(source, /readMode: 'http-fallback'/);
});

test('platform status preserves market operational freshness and asset gates', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /const MIN_PUBLIC_MARKET_ASSETS = 4500/);
  assert.match(source, /const MARKET_SNAPSHOT_FRESH_MS = 15 \* 60 \* 1000/);
  assert.match(source, /market\.payload\?\.healthy === true/);
  assert.match(source, /marketAssetCount >= MIN_PUBLIC_MARKET_ASSETS/);
  assert.match(source, /marketFresh/);
  assert.match(source, /marketOperationalRequiresFreshSnapshot: true/);
  assert.match(source, /valuesAreLiveVerifiedOnly: true/);
  assert.match(source, /fabricatedMetrics: false/);
});

test('platform status self-heals stale market metadata only through a bounded verified refresh', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /const MARKET_STALE_REFRESH_TIMEOUT_MS = 20_000/);
  assert.match(source, /if \(!stale\) return directResult/);
  assert.match(source, /\/api\/market-snapshot\?health=1&refresh=1/);
  assert.match(source, /MARKET_STALE_REFRESH_TIMEOUT_MS/);
  assert.match(source, /refreshed\.payload\?\.healthy === true/);
  assert.match(source, /refreshed\.payload\?\.stale === false/);
  assert.match(source, /refreshedAssetCount >= MIN_PUBLIC_MARKET_ASSETS/);
  assert.match(source, /readMode: 'http-refresh'/);
  assert.match(source, /refreshAttempted: true/);
  assert.match(source, /refreshRecovered: true/);
  assert.match(source, /refreshRecovered: false/);
  assert.match(source, /marketStaleSelfHeal: true/);
  assert.match(source, /marketStaleSelfHealTimeoutMs: MARKET_STALE_REFRESH_TIMEOUT_MS/);
});

test('platform status bounds component reads below the public aggregate SLO instead of waiting on slow cold subrequests', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /const COMPONENT_STATUS_TIMEOUT_MS = 850/);
  assert.match(source, /readJson\(`\$\{origin\}\/api\/network-health`\)/);
  assert.match(source, /readJson\(`\$\{origin\}\/api\/kam\/network-status`\)/);
  assert.match(source, /componentStatusTimeoutMs: COMPONENT_STATUS_TIMEOUT_MS/);
  assert.match(source, /componentTimeoutDegradesRatherThanFabricates: true/);
  assert.match(source, /readError: networks\.ok \? null : networks\.error/);
  assert.match(source, /readError: kam\.ok \? null : kam\.error/);
});

test('platform status uses only a short recent fully-verified durable aggregate', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /const DURABLE_STATUS_TTL_MS = 45_000/);
  assert.match(source, /CREATE TABLE IF NOT EXISTS platform_status_snapshots/);
  assert.match(source, /SELECT captured_at, payload FROM platform_status_snapshots WHERE id = \?/);
  assert.match(source, /snapshotAgeMs > DURABLE_STATUS_TTL_MS/);
  assert.match(source, /body\?\.overall === 'operational'/);
  assert.match(source, /market\?\.healthy === true/);
  assert.match(source, /Number\(market\?\.assetCount\) >= MIN_PUBLIC_MARKET_ASSETS/);
  assert.match(source, /marketAgeMs <= MARKET_SNAPSHOT_FRESH_MS/);
  assert.match(source, /networks\?\.healthy === true/);
  assert.match(source, /networkOnline >= networkMinimumTarget/);
  assert.match(source, /kam\?\.healthy === true/);
  assert.match(source, /Number\(kam\?\.chainId\) === 22028/);
});

test('platform status writes durable evidence only through the primary session and only after verification', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /async function persistDurableStatus/);
  assert.match(source, /!isVerifiedOperationalBody\(result\.body\)/);
  assert.match(source, /const db = primarySession\(env\.AUTH_DB\)/);
  assert.match(source, /INSERT INTO platform_status_snapshots/);
  assert.match(source, /ON CONFLICT\(id\) DO UPDATE SET/);
  assert.match(source, /durableAggregateCache: true/);
  assert.match(source, /durableVerifiedAggregateMaxAgeMs: DURABLE_STATUS_TTL_MS/);
});

test('durable aggregate is transparent and refreshes live verification in the background', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /'d1-last-verified'/);
  assert.match(source, /snapshotAgeMs/);
  assert.match(source, /backgroundRefresh/);
  assert.match(source, /startLiveRefresh\(request, env\)\.then\(\(fresh\) => persistDurableStatus\(env, fresh\)\)/);
  assert.match(source, /scheduleBackground/);
});

test('only freshly live-verified aggregate responses can enter the edge cache', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /result\.body\?\.delivery\?\.aggregateRead === 'live-verified'/);
  assert.match(source, /edgeCache\.put\(cacheKey, response\.clone\(\)\)/);
  assert.doesNotMatch(source, /aggregateRead === 'd1-last-verified'[\s\S]{0,160}edgeCache\.put/);
  assert.doesNotMatch(source, /aggregateRead === 'memory-last-verified'[\s\S]{0,160}edgeCache\.put/);
});

test('platform status keeps bounded HTTP fallback and cached aggregate delivery', async () => {
  const source = await read('functions/api/platform-status.js');
  assert.match(source, /\/api\/market-snapshot\?health=1/);
  assert.match(source, /globalThis\.caches\?\.default/);
  assert.match(source, /STATUS_TTL_MS = 30_000/);
  assert.match(source, /statusInFlight/);
});

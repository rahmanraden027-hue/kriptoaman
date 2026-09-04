import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('live API traffic nudges the persisted market self-heal path without recursion', async () => {
  const middleware = await read('functions/api/_middleware.js');
  assert.match(middleware, /MARKET_HEALTH_PATH = '\/api\/market-snapshot\?health=1'/);
  assert.match(middleware, /'\/api\/platform-status'/);
  assert.match(middleware, /'\/api\/market-snapshot-page'/);
  assert.match(middleware, /scheduleMarketNudge/);
  assert.match(middleware, /context\.waitUntil\(task\)/);
  assert.match(middleware, /MARKET_NUDGE_PATHS\.has\(new URL\(request\.url\)\.pathname\)/);
  assert.doesNotMatch(middleware, /MARKET_NUDGE_PATHS[\s\S]{0,200}'\/api\/market-snapshot'/);
});

test('scheduled health independently forces a refresh before the 15 minute operational freshness gate', async () => {
  const health = await read('scripts/check-market-health.mjs');
  assert.match(health, /const MAX_AGE_MS = 15 \* 60 \* 1000/);
  assert.match(health, /const PROACTIVE_REFRESH_AGE_MS = 8 \* 60 \* 1000/);
  assert.match(health, /url\.searchParams\.set\('refresh', '1'\)/);
  assert.match(health, /payload\.refreshDue === true/);
  assert.match(health, /ageMs >= PROACTIVE_REFRESH_AGE_MS/);
  assert.match(health, /validateOperationalFreshness/);
});

test('dedicated warm job is staggered every ten minutes and cannot cancel an active refresh', async () => {
  const workflow = await read('.github/workflows/market-snapshot-warm.yml');
  assert.match(workflow, /cron: '3,13,23,33,43,53 \* \* \* \*'/);
  assert.match(workflow, /group: market-snapshot-warm-production/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /health=1&refresh=1/);
  assert.match(workflow, /for attempt in 1 2 3 4/);
  assert.match(workflow, /payload\.assetCount\) < 4500/);
  assert.match(workflow, /payload\.chunkReady !== true/);
});

test('paged market has a bounded 24 hour rescue cache for transient D1 or origin failures', async () => {
  const page = await read('functions/api/market-snapshot-page.js');
  assert.match(page, /RESCUE_CACHE_TTL_SECONDS = 24 \* 60 \* 60/);
  assert.match(page, /stale-if-error=86400/);
  assert.match(page, /_ka_rescue/);
  assert.match(page, /X-KriptoAman-Market-Page-Cache', 'RESCUE'/);
  assert.match(page, /X-KriptoAman-Market-Stale', 'true'/);
  assert.match(page, /Warning', '110 - "Response is stale"'/);
  assert.match(page, /edgeCache\.put\(rescueCacheKey, buildRescueSeed\(response\)\)/);
  assert.match(page, /if \(rescue\) return rescue/);
});

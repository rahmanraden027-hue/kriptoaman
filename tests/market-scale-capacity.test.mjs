import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('backend and client support a 5000-asset market universe through paging', async () => {
  const [server, client, pageEndpoint] = await Promise.all([
    read('functions/api/market-snapshot.js'),
    read('src/components/home/useCoinMarkets.js'),
    read('functions/api/market-snapshot-page.js'),
  ]);

  assert.match(server, /const MARKET_ASSET_LIMIT = 5000;/);
  assert.match(server, /const MIN_ACCEPTED_ASSETS = 4500;/);
  assert.match(server, /collectionLimit: MARKET_ASSET_LIMIT/);
  assert.match(client, /const MARKET_ASSET_LIMIT = 5000;/);
  assert.match(client, /const SERVER_PAGE_SIZE = 500;/);
  assert.match(client, /market-snapshot-page\?page=/);
  assert.match(client, /hydrateServerPages/);
  assert.match(pageEndpoint, /const MAX_PAGE_SIZE = 500;/);
});

test('public fallback providers remain bounded at 2500 assets', async () => {
  const client = await read('src/components/home/useCoinMarkets.js');
  assert.match(client, /const FALLBACK_ASSET_LIMIT = 2500;/);
  assert.match(client, /data\.slice\(0, FALLBACK_ASSET_LIMIT\)/);
  assert.match(client, /rows\.slice\(0, FALLBACK_ASSET_LIMIT\)/);
});

test('server hydration is bounded, snapshot-consistent and non-synthetic', async () => {
  const client = await read('src/components/home/useCoinMarkets.js');
  assert.match(client, /const SERVER_PAGE_CONCURRENCY = 2;/);
  assert.match(client, /Promise\.allSettled/);
  assert.match(client, /pagePayload\.capturedAt/);
  assert.doesNotMatch(client, /Math\.random/);
  assert.doesNotMatch(client, /generateSynthetic/);
});

test('backend collection remains bounded and deduplicated', async () => {
  const server = await read('functions/api/market-snapshot.js');
  assert.match(server, /index \+= 5/);
  assert.match(server, /Promise\.allSettled/);
  assert.match(server, /const seen = new Set\(\)/);
  assert.match(server, /REQUEST_TIMEOUT_MS/);
});

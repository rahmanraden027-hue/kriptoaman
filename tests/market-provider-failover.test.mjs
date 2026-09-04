import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('server market snapshot has CoinLore to CoinGecko provider failover', async () => {
  const source = await read('functions/api/market-snapshot.js');

  assert.match(source, /async function fetchMarketData/);
  assert.match(source, /\['coinlore', \(\) => fetchCoinLore\(\)\]/);
  assert.match(source, /\['coingecko', \(\) => fetchCoinGecko\(env\)\]/);
  assert.match(source, /Market provider refresh failed; trying failover/);
  assert.match(source, /All market providers failed/);
  assert.match(source, /providerFailover: \['coinlore', 'coingecko'\]/);
});

test('CoinGecko failover can collect the same 5,000-asset server target', async () => {
  const source = await read('functions/api/market-snapshot.js');

  assert.match(source, /const MARKET_ASSET_LIMIT = 5000/);
  assert.match(source, /const MIN_ACCEPTED_ASSETS = 4500/);
  assert.match(source, /const COINGECKO_PAGE_SIZE = 250/);
  assert.match(source, /Math\.ceil\(MARKET_ASSET_LIMIT \/ COINGECKO_PAGE_SIZE\)/);
  assert.match(source, /\/coins\/markets\?/);
  assert.match(source, /CoinGecko .* returned only \$\{data\.length\} unique assets/);
});

test('CoinGecko supports keyed production tiers without committing a key', async () => {
  const source = await read('functions/api/market-snapshot.js');

  assert.match(source, /env\.COINGECKO_PRO_API_KEY/);
  assert.match(source, /env\.COINGECKO_DEMO_API_KEY \|\| env\.COINGECKO_API_KEY/);
  assert.match(source, /'x-cg-pro-api-key'/);
  assert.match(source, /'x-cg-demo-api-key'/);
  assert.match(source, /pro-api\.coingecko\.com/);
  assert.match(source, /api\.coingecko\.com/);
  assert.doesNotMatch(source, /x-cg-(?:pro|demo)-api-key':\s*['"][A-Za-z0-9_-]{20,}/);
});

test('keyless CoinGecko emergency mode is throttled and last-known-good truth gates remain intact', async () => {
  const source = await read('functions/api/market-snapshot.js');

  assert.match(source, /tier: 'public-keyless'/);
  assert.match(source, /COINGECKO_PUBLIC_PAGE_DELAY_MS/);
  assert.match(source, /if \(!config\.authenticated\) await sleep\(COINGECKO_PUBLIC_PAGE_DELAY_MS\)/);
  assert.match(source, /const SNAPSHOT_FRESH_MS = 15 \* 60 \* 1000/);
  assert.match(source, /healthy: snapshot\.asset_count >= MIN_ACCEPTED_ASSETS/);
  assert.match(source, /if \(data\.length < MIN_ACCEPTED_ASSETS\)/);
});

test('the persisted snapshot records the provider that actually succeeded', async () => {
  const source = await read('functions/api/market-snapshot.js');

  assert.match(source, /const \{ source, data \} = await fetchMarketData\(env\)/);
  assert.match(source, /\.bind\('global', source, data\.length, capturedAt, JSON\.stringify\(data\)\)\.run\(\)/);
  assert.match(source, /persistChunks\(db, data, capturedAt, source\)/);
  assert.match(source, /return \{ source, asset_count: data\.length, captured_at: capturedAt, data \}/);
});

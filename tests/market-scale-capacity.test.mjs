import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('backend can collect up to 5000 market assets while client remains capped at 2500', async () => {
  const [server, client] = await Promise.all([
    read('functions/api/market-snapshot.js'),
    read('src/components/home/useCoinMarkets.js'),
  ]);

  assert.match(server, /const MARKET_ASSET_LIMIT = 5000;/);
  assert.match(server, /collectionLimit: MARKET_ASSET_LIMIT/);
  assert.match(client, /const MARKET_ASSET_LIMIT = 2500;/);
  assert.match(client, /\.slice\(0, MARKET_ASSET_LIMIT\)/);
});

test('backend collection remains bounded and deduplicated', async () => {
  const server = await read('functions/api/market-snapshot.js');
  assert.match(server, /index \+= 5/);
  assert.match(server, /Promise\.allSettled/);
  assert.match(server, /const seen = new Set\(\)/);
  assert.match(server, /REQUEST_TIMEOUT_MS/);
});

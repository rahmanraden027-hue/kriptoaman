import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('market preserves the last known-good snapshot without a hard expiry', async () => {
  const source = await read('src/components/home/useCoinMarkets.js');
  assert.match(source, /Always render the last known-good snapshot first/);
  assert.doesNotMatch(source, /MARKET_CACHE_MAX_AGE/);
  assert.match(source, /compactSnapshot/);
  assert.match(source, /isStale/);
  assert.match(source, /cacheAgeMs/);
});

test('market providers use bounded requests and automatic recovery events', async () => {
  const source = await read('src/components/home/useCoinMarkets.js');
  assert.match(source, /AbortController/);
  assert.match(source, /REQUEST_TIMEOUT/);
  assert.match(source, /addEventListener\('online'/);
  assert.match(source, /visibilitychange/);
  for (const provider of ['coinlore', 'coingecko', 'cryptocompare']) {
    assert.match(source, new RegExp(provider));
  }
});

test('service worker caches every public market provider', async () => {
  const source = await read('public/sw.js');
  for (const domain of [
    'api.coinlore.net',
    'api.coingecko.com',
    'min-api.cryptocompare.com',
    'api.exchangerate-api.com',
  ]) {
    assert.match(source, new RegExp(domain.replaceAll('.', '\\.')));
  }
  assert.match(source, /fetchWithDeadline/);
  assert.match(source, /caches\.match\(event\.request\)/);
});

test('live prices and market UI expose persistent fallback state', async () => {
  const [live, market] = await Promise.all([
    read('src/components/market/useLivePrices.jsx'),
    read('src/pages/Market.jsx'),
  ]);
  assert.match(live, /ka_live_prices_v1/);
  assert.match(live, /loadLiveCache/);
  assert.match(market, /Showing the last successfully saved snapshot/);
  assert.match(market, /Menampilkan snapshot terakhir/);
  assert.match(market, /role="status"/);
});

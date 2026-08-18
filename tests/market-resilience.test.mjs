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


test('server snapshot survives total upstream provider failure', async () => {
  const [endpoint, client, migration] = await Promise.all([
    read('functions/api/market-snapshot.js'),
    read('src/components/home/useCoinMarkets.js'),
    read('migrations/0003_market_snapshot.sql'),
  ]);
  assert.match(endpoint, /CREATE TABLE IF NOT EXISTS market_snapshots/);
  assert.match(endpoint, /MIN_ACCEPTED_ASSETS = 2001/);
  assert.match(endpoint, /context\.waitUntil/);
  assert.match(endpoint, /env\.AUTH_DB/);
  assert.match(client, /\['server', fetchServerSnapshot\]/);
  assert.match(migration, /CHECK \(asset_count >= 2001\)/);
});

test('market disaster recovery monitoring and UI fallbacks are release-gated', async () => {
  const [workflow, health, market, install] = await Promise.all([
    read('.github/workflows/market-health.yml'),
    read('scripts/check-market-health.mjs'),
    read('src/pages/Market.jsx'),
    read('src/components/pwa/PWAInstallPrompt.jsx'),
  ]);
  assert.match(workflow, /cron: '\*\/15 \* \* \* \*'/);
  assert.match(health, /MIN_ASSETS = 2001/);
  assert.match(health, /MAX_AGE_MS/);
  assert.match(market, /fallbackSparkline/);
  assert.match(market, /max-w-7xl/);
  assert.match(market, /xl:grid-cols-2/);
  assert.match(install, /left-1\/2/);
});

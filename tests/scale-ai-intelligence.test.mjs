import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('hot market API is edge cached, bounded and last-known-good resilient', async () => {
  const source = await read('functions/api/market-hot.js');
  assert.match(source, /CORE_SYMBOLS = \['BTC', 'ETH', 'BNB', 'SOL', 'XRP'\]/);
  assert.match(source, /globalThis\.caches\?\.default/);
  assert.match(source, /stale-while-revalidate=45/);
  assert.match(source, /readPersistedFallback/);
  assert.match(source, /FROM market_snapshots WHERE id = \?/);
  assert.match(source, /RETRY_DELAYS_MS/);
  assert.match(source, /refreshInFlight/);
  assert.doesNotMatch(source, /Math\.random/);
});

test('full market snapshot refresh is retry bounded and single-flight', async () => {
  const source = await read('functions/api/market-snapshot.js');
  assert.match(source, /RETRY_DELAYS_MS = \[250, 750\]/);
  assert.match(source, /refreshSnapshotSingleFlight/);
  assert.match(source, /refreshMode: 'single-flight-background'/);
  assert.match(source, /context\.waitUntil/);
  assert.match(source, /MIN_ACCEPTED_ASSETS = 4500/);
});

test('paged market reads terminate at edge cache before repeated D1 work', async () => {
  const source = await read('functions/api/market-snapshot-page.js');
  assert.match(source, /globalThis\.caches\?\.default/);
  assert.match(source, /X-KriptoAman-Market-Page-Cache/);
  assert.match(source, /const MAX_PAGE_SIZE = 500/);
  assert.match(source, /stale-while-revalidate=840/);
});

test('live price fallback is centralized and does not expose CoinGecko keys in the client', async () => {
  const source = await read('src/components/market/useLivePrices.jsx');
  assert.match(source, /HOT_MARKET_ENDPOINT = '\/api\/market-hot'/);
  assert.match(source, /HOT_POLL_INTERVAL_MS = 15_000/);
  assert.match(source, /fetchHotSnapshot/);
  assert.match(source, /new WebSocket\(WS_URL\)/);
  assert.doesNotMatch(source, /COINGECKO_API_KEY/);
  assert.doesNotMatch(source, /x-cg-pro-api-key/);
});

test('AI intelligence remains grounded, cached and non-advisory', async () => {
  const source = await read('src/components/home/AIInsightCard.jsx');
  assert.match(source, /AI_CACHE_TTL_MS = 5 \* 60 \* 1000/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /buildMetrics/);
  assert.match(source, /VERIFIED_SNAPSHOT/);
  assert.match(source, /VERIFIED_METRICS/);
  assert.match(source, /Never give buy\/sell instructions/);
  assert.match(source, /Not investment advice/);
});

test('production load profile covers the high-read market path and remains opt-in', async () => {
  const source = await read('load/k6-production-readonly.js');
  assert.match(source, /ALLOW_PRODUCTION_LOAD_TEST === 'YES'/);
  assert.match(source, /market-hot/);
  assert.match(source, /market-snapshot-page\?page=0&limit=100/);
  assert.match(source, /p\(95\)<750/);
  assert.match(source, /p\(95\)<1000/);
  assert.doesNotMatch(source, /http\.(post|put|patch|del|delete)\(/);
});

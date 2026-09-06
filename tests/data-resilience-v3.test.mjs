import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { onRequestGet as hotMarket } from '../functions/api/market-hot.js';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const persistedMarket = [
  ['BTC', 110000, 1.2],
  ['ETH', 4300, 0.8],
  ['BNB', 880, -0.2],
  ['SOL', 250, 2.5],
  ['XRP', 3.1, -1.1],
].map(([symbol, price, change], index) => ({
  id: symbol.toLowerCase(),
  symbol,
  name: symbol,
  current_price: price,
  price_change_percentage_24h: change,
  high_24h: price * 1.02,
  low_24h: price * 0.98,
  total_volume: 1000000,
  market_cap: 100000000,
  market_cap_rank: index + 1,
}));

function fakeDb(capturedAt) {
  return {
    withSession() { return this; },
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return {
                source: 'long-outage-fixture',
                captured_at: capturedAt,
                asset_count: persistedMarket.length,
                payload: JSON.stringify(persistedMarket),
              };
            },
          };
        },
      };
    },
  };
}

test('90-day provider outage serves archived persisted market data without claiming it is healthy', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('simulated total provider outage'); };
  try {
    const capturedAt = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const response = await hotMarket({
      env: { AUTH_DB: fakeDb(capturedAt) },
      request: new Request('https://kriptoaman.test/api/market-hot'),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.available, true);
    assert.equal(body.healthy, false);
    assert.equal(body.stale, true);
    assert.equal(body.freshness, 'archived');
    assert.equal(body.source, 'snapshot:long-outage-fixture');
    assert.equal(body.data.some((item) => item.symbol === 'BTC'), true);
    assert.equal(response.headers.get('X-KriptoAman-Market-Stale'), 'true');
    assert.match(response.headers.get('Warning') || '', /Response is stale/);
    assert.equal(body.delivery.maxFallbackAgeMs, 365 * 24 * 60 * 60 * 1000);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('hot market exposes explicit live stale archived and expired freshness states', async () => {
  const source = await read('functions/api/market-hot.js');
  assert.match(source, /HOT_HEALTHY_AGE_MS = 60 \* 60 \* 1000/);
  assert.match(source, /MAX_FALLBACK_AGE_MS = 365 \* 24 \* 60 \* 60 \* 1000/);
  for (const state of ['live', 'stale', 'archived', 'expired']) {
    assert.ok(source.includes(`'${state}'`), `missing freshness state ${state}`);
  }
  assert.match(source, /const available = hasCoreSymbols\(snapshot\.data\)/);
  assert.match(source, /responseStatus = available \? 200 : 503/);
});

test('home market movers no longer depends directly on CoinGecko', async () => {
  const source = await read('src/components/home/HomeMarketMovers.jsx');
  assert.match(source, /\/api\/market-snapshot-page\?page=0&limit=100/);
  assert.match(source, /KriptoAman Market Database/);
  assert.match(source, /snapshotAt/);
  assert.doesNotMatch(source, /api\.coingecko\.com/);
});

test('long-outage hardening preserves the service-worker anti-stale security boundary', async () => {
  const source = await read('public/sw.js');
  assert.match(source, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(source, /navigation is always network-first/);
  assert.doesNotMatch(source, /MAX_FALLBACK_AGE_MS/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { onRequestGet as benchmarkHistory } from '../functions/api/market-benchmark-history.js';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

function benchmarkDb(capturedAt) {
  const prices = [
    [capturedAt - 86_400_000, 100000],
    [capturedAt, 105000],
  ];
  return {
    withSession() { return this; },
    prepare(sql) {
      return {
        async run() { return { success: true }; },
        bind() {
          return {
            async run() { return { success: true }; },
            async first() {
              if (!String(sql).includes('SELECT asset, days, captured_at, payload')) return null;
              return {
                asset: 'bitcoin',
                days: 7,
                captured_at: capturedAt,
                payload: JSON.stringify(prices),
              };
            },
          };
        },
      };
    },
  };
}

test('120-day benchmark provider outage serves archived D1 history without claiming it is live', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('simulated benchmark provider outage'); };
  try {
    const capturedAt = Date.now() - (120 * 24 * 60 * 60 * 1000);
    const response = await benchmarkHistory({
      env: { AUTH_DB: benchmarkDb(capturedAt) },
      request: new Request('https://kriptoaman.test/api/market-benchmark-history?days=7'),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.available, true);
    assert.equal(body.stale, true);
    assert.equal(body.freshness, 'archived');
    assert.equal(body.source, 'd1-archived');
    assert.equal(Array.isArray(body.prices), true);
    assert.equal(body.prices.length, 2);
    assert.equal(response.headers.get('X-KriptoAman-Market-Stale'), 'true');
    assert.equal(body.maxFallbackAgeMs, 365 * 24 * 60 * 60 * 1000);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('market overview and activity cards use the internal persisted market page', async () => {
  const [overview, activity] = await Promise.all([
    read('src/components/market/MarketOverviewWidget.jsx'),
    read('src/components/home/WhaleAlertCard.jsx'),
  ]);

  assert.ok(overview.includes('/api/market-snapshot-page?page=0&limit='));
  assert.ok(overview.includes('ka_market_overview_v2'));
  assert.ok(overview.includes('Menampilkan snapshot terakhir yang tersimpan'));
  assert.ok(activity.includes('/api/market-snapshot-page?page=0&limit=100'));
  assert.ok(activity.includes('ka_market_activity_v2'));
  assert.ok(activity.includes('Database Pasar KriptoAman'));
});

test('portfolio benchmark uses durable server history plus browser fallback', async () => {
  const portfolio = await read('src/components/home/HomePortfolioPerformance.jsx');
  assert.ok(portfolio.includes('/api/market-benchmark-history?days='));
  assert.ok(portfolio.includes('ka_btc_benchmark_history_v1_'));
  assert.ok(portfolio.includes('Benchmark tersimpan'));
  assert.ok(portfolio.includes('bukan catatan transaksi portfolio'));
});

test('wallet read-only display pricing uses KriptoAman hot market with persistent fallback', async () => {
  const [source, hook] = await Promise.all([
    read('src/lib/readOnlyMarketPrices.js'),
    read('src/components/wallet/useMarketData.jsx'),
  ]);

  assert.ok(source.includes("fetch('/api/market-hot'"));
  assert.ok(source.includes('ka_readonly_market_prices_v1'));
  assert.ok(source.includes('cached?.prices || {}'));
  assert.ok(hook.includes("from '@/lib/readOnlyMarketPrices'"));
  assert.ok(hook.includes('display pricing'));
  assert.ok(hook.includes('does not provide or alter execution quotes'));
});

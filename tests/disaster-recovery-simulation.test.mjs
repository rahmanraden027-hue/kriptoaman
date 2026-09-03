import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestGet as hotMarket } from '../functions/api/market-hot.js';
import { onRequestGet as networkHealth } from '../functions/api/network-health.js';
import {
  buildIntelligenceMetrics,
  deterministicIntelligence,
} from '../src/lib/aiIntelligence.js';

const persistedMarket = [
  ['BTC', 110000, 1.2],
  ['ETH', 4300, 0.8],
  ['BNB', 880, -0.2],
  ['SOL', 250, 2.5],
  ['XRP', 3.1, -1.1],
].map(([symbol, price, change]) => ({
  symbol,
  current_price: price,
  price_change_percentage_24h: change,
  high_24h: price * 1.02,
  low_24h: price * 0.98,
  total_volume: 1000000,
  market_cap: 100000000,
  market_cap_rank: 1,
}));

function fakeDb() {
  return {
    withSession() { return this; },
    prepare() {
      return {
        bind() {
          return {
            async first() {
              return {
                source: 'dr-fixture',
                captured_at: Date.now() - 5_000,
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

test('market provider outage falls back to recent persisted snapshot', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('simulated upstream outage'); };
  try {
    const response = await hotMarket({
      env: { AUTH_DB: fakeDb() },
      request: new Request('https://kriptoaman.test/api/market-hot'),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.healthy, true);
    assert.match(body.source, /^snapshot:/);
    assert.equal(body.data.some((item) => item.symbol === 'BTC'), true);
    assert.equal(body.delivery.d1SessionRead, true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('complete RPC outage never fabricates a network as online', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('simulated RPC outage'); };
  try {
    const response = await networkHealth({
      request: new Request('https://kriptoaman.test/api/network-health?refresh=1'),
    });
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.summary.online, 0);
    assert.equal(body.summary.meets_minimum_active_target, false);
    assert.equal(body.policy.lastKnownGoodNeverCountsAsOnline, true);
    assert.equal(body.delivery.freshProbe, true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('AI model outage has deterministic risk and anomaly intelligence', () => {
  const snapshot = persistedMarket.map((item) => ({
    symbol: item.symbol,
    price: item.current_price,
    change24h: item.price_change_percentage_24h,
    high24h: item.high_24h,
    low24h: item.low_24h,
    volume24h: item.total_volume,
  }));
  const metrics = buildIntelligenceMetrics(snapshot);
  const fallback = deterministicIntelligence(snapshot, 'en', {
    verified: true,
    online: 21,
    total: 21,
    kamOperational: true,
  });
  assert.equal(['contained', 'moderate', 'elevated'].includes(metrics.riskBand), true);
  assert.equal(metrics.correlationStatus, 'history-required');
  assert.equal(fallback.confidence, 'rules-based');
  assert.match(fallback.body, /21\/21/);
  assert.doesNotMatch(fallback.body, /buy|sell|guaranteed return/i);
});

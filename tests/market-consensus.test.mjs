import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildConsensus,
  calculateDispersionBps,
  classifyConsensus,
  classifyStablecoinPeg,
  normalizeCoinbaseExchangeRates,
} from '../functions/api/market-consensus.js';

const NOW = 1_800_000_000_000;

function provider(name, prices) {
  return {
    provider: name,
    observations: new Map(Object.entries(prices).map(([symbol, price]) => [symbol, {
      provider: name,
      providerAssetId: `${name}-${symbol.toLowerCase()}`,
      symbol,
      price,
      observedAt: NOW - 5_000,
      timestampType: 'provider',
    }])),
  };
}

test('dispersion is measured against the midpoint and classified without hiding disagreement', () => {
  assert.equal(calculateDispersionBps(100, 100), 0);
  assert.equal(classifyConsensus(calculateDispersionBps(100, 100.2)), 'aligned');
  assert.equal(classifyConsensus(calculateDispersionBps(100, 101)), 'watch');
  assert.equal(classifyConsensus(calculateDispersionBps(100, 103)), 'divergent');
});

test('consensus preserves raw provider observations and exposes midpoint only as comparison reference', () => {
  const result = buildConsensus({
    now: NOW,
    providerResults: [
      provider('coinlore', { BTC: 100000, ETH: 4000, BNB: 900, SOL: 200, XRP: 3, USDT: 0.9998, USDC: 1.0001 }),
      provider('coingecko', { BTC: 100100, ETH: 4002, BNB: 900.5, SOL: 200.2, XRP: 3.001, USDT: 1.0000, USDC: 0.9999 }),
    ],
  });

  assert.equal(result.schemaVersion, '1.1');
  assert.equal(result.healthy, true);
  assert.equal(result.status, 'aligned');
  assert.equal(result.providerCount, 2);
  assert.equal(result.policy.replacesCustomerMarketPrice, false);

  const btc = result.assets.find((asset) => asset.symbol === 'BTC');
  assert.equal(btc.providerCount, 2);
  assert.equal(btc.observations.length, 2);
  assert.deepEqual(btc.referenceProviderPair, ['coinlore', 'coingecko']);
  assert.equal(btc.referencePrice, 100050);
  assert.match(btc.referenceSemantics, /comparison-only-not-an-execution-price/);
  assert.equal(btc.consensusStatus, 'aligned');
});

test('one provider is insufficient and never manufactures cross-provider agreement', () => {
  const result = buildConsensus({
    now: NOW,
    providerResults: [provider('coinlore', { BTC: 100000, ETH: 4000, BNB: 900, SOL: 200, XRP: 3 })],
  });

  assert.equal(result.healthy, false);
  assert.equal(result.status, 'degraded');
  const btc = result.assets.find((asset) => asset.symbol === 'BTC');
  assert.equal(btc.providerCount, 1);
  assert.equal(btc.referencePrice, null);
  assert.equal(btc.consensusStatus, 'insufficient');
});

test('stale observations are excluded from the comparison reference', () => {
  const staleProvider = provider('coinlore', { BTC: 100000, ETH: 4000, BNB: 900, SOL: 200, XRP: 3 });
  for (const observation of staleProvider.observations.values()) observation.observedAt = NOW - 10 * 60 * 1000;

  const result = buildConsensus({
    now: NOW,
    providerResults: [
      staleProvider,
      provider('coingecko', { BTC: 100050, ETH: 4001, BNB: 901, SOL: 200.1, XRP: 3.001 }),
    ],
  });

  const btc = result.assets.find((asset) => asset.symbol === 'BTC');
  assert.equal(btc.observations.length, 2);
  assert.equal(btc.providerCount, 1);
  assert.equal(btc.referencePrice, null);
  assert.equal(result.healthy, false);
});

test('stablecoin peg status uses observed prices and never forces a synthetic USD 1.00 value', () => {
  assert.equal(classifyStablecoinPeg(1.0002, 'aligned'), 'observed-near-peg');
  assert.equal(classifyStablecoinPeg(0.994, 'aligned'), 'depeg-watch');
  assert.equal(classifyStablecoinPeg(0.985, 'aligned'), 'depeg-observed');
  assert.equal(classifyStablecoinPeg(0.985, 'divergent'), 'unreliable');

  const result = buildConsensus({
    now: NOW,
    providerResults: [
      provider('coinlore', { BTC: 100000, ETH: 4000, BNB: 900, SOL: 200, XRP: 3, USDC: 0.985 }),
      provider('coingecko', { BTC: 100050, ETH: 4001, BNB: 900.5, SOL: 200.1, XRP: 3.001, USDC: 0.9852 }),
    ],
  });

  const usdc = result.assets.find((asset) => asset.symbol === 'USDC');
  assert.notEqual(usdc.referencePrice, 1);
  assert.equal(usdc.stablecoinPeg, 'depeg-observed');
  assert.ok(usdc.pegDeviationBps > 100);
});

test('large disagreement remains visible as divergent and degrades core consensus', () => {
  const result = buildConsensus({
    now: NOW,
    providerResults: [
      provider('coinlore', { BTC: 100000, ETH: 4000, BNB: 900, SOL: 200, XRP: 3 }),
      provider('coingecko', { BTC: 104000, ETH: 4001, BNB: 900.5, SOL: 200.1, XRP: 3.001 }),
    ],
  });

  assert.equal(result.healthy, false);
  assert.equal(result.status, 'degraded');
  assert.deepEqual(result.coreCoverage.divergentSymbols, ['BTC']);
  const btc = result.assets.find((asset) => asset.symbol === 'BTC');
  assert.equal(btc.consensusStatus, 'divergent');
});

test('Coinbase USD exchange rates normalize into observed USD-per-asset prices without synthetic values', () => {
  const observations = normalizeCoinbaseExchangeRates({
    data: {
      currency: 'USD',
      rates: {
        BTC: '0.00001',
        ETH: '0.00025',
        BNB: '0.001111111111111111',
        SOL: '0.005',
        XRP: '0.3333333333333333',
        USDT: '1.0002',
        USDC: '0.9999',
      },
    },
  }, NOW);

  assert.equal(observations.size, 7);
  assert.equal(observations.get('BTC').provider, 'coinbase');
  assert.equal(observations.get('BTC').price, 100000);
  assert.ok(Math.abs(observations.get('USDC').price - (1 / 0.9999)) < 1e-12);
  assert.notEqual(observations.get('USDC').price, 1);
  assert.equal(observations.get('USDC').timestampType, 'retrieved');
});

test('Coinbase can serve as an independent fallback pair when CoinGecko is unavailable', () => {
  const coinbase = normalizeCoinbaseExchangeRates({
    data: {
      currency: 'USD',
      rates: {
        BTC: String(1 / 100050),
        ETH: String(1 / 4001),
        BNB: String(1 / 900.5),
        SOL: String(1 / 200.1),
        XRP: String(1 / 3.001),
        USDT: String(1 / 0.9999),
        USDC: String(1 / 1.0001),
      },
    },
  }, NOW - 5_000);

  const result = buildConsensus({
    now: NOW,
    providerResults: [
      provider('coinlore', { BTC: 100000, ETH: 4000, BNB: 900, SOL: 200, XRP: 3, USDT: 1, USDC: 1 }),
      { provider: 'coingecko', error: 'CoinGecko public-keyless HTTP 429' },
      { provider: 'coinbase', observations: coinbase },
    ],
  });

  assert.equal(result.healthy, true);
  assert.equal(result.providerCount, 2);
  assert.deepEqual(result.providerFailures, [{ provider: 'coingecko', error: 'CoinGecko public-keyless HTTP 429' }]);
  const btc = result.assets.find((asset) => asset.symbol === 'BTC');
  assert.deepEqual(btc.referenceProviderPair, ['coinlore', 'coinbase']);
  assert.equal(btc.consensusStatus, 'aligned');
});

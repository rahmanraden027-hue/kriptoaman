import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { scoreMarketQuality } from '../functions/api/market-quality.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const sampleRows = count => Array.from({ length: count }, (_, index) => ({
  id: `asset-${index}`,
  symbol: `A${index}`,
  name: `Asset ${index}`,
  image: `https://example.invalid/${index}.png`,
  current_price: index + 1,
  market_cap: (index + 1) * 1000,
  total_volume: (index + 1) * 100,
  price_change_percentage_24h: 0.5,
}));

test('market quality gives a strong score to fresh complete broad snapshots', () => {
  const now = 1_800_000_000_000;
  const quality = scoreMarketQuality({
    rows: sampleRows(4500),
    capturedAt: now - (5 * 60 * 1000),
    source: 'test-provider',
    now,
  });

  assert.equal(quality.status, 'excellent');
  assert.equal(quality.score, 100);
  assert.equal(quality.assetCount, 4500);
  assert.equal(quality.components.priceCompletenessPct, 100);
  assert.equal(quality.components.identityCompletenessPct, 100);
  assert.equal(quality.anomalies.nonPositivePrices, 0);
});

test('market quality visibly degrades stale or incomplete data', () => {
  const now = 1_800_000_000_000;
  const rows = sampleRows(1000);
  rows[0].current_price = 0;
  rows[1].total_volume = -1;
  rows[2].id = '';

  const quality = scoreMarketQuality({
    rows,
    capturedAt: now - (7 * 60 * 60 * 1000),
    source: 'test-provider',
    now,
  });

  assert.equal(quality.status, 'stale');
  assert.ok(quality.score < 70);
  assert.equal(quality.anomalies.nonPositivePrices, 1);
  assert.equal(quality.anomalies.negativeVolumes, 1);
  assert.ok(quality.components.identityCompletenessPct < 100);
});

test('live-price hook does not synthesize USDT or USDC at a fixed one-dollar peg', async () => {
  const source = await read('src/components/market/useLivePrices.jsx');

  assert.doesNotMatch(source, /if\s*\(!prices\.USDT\)/);
  assert.doesNotMatch(source, /if\s*\(!prices\.USDC\)/);
  assert.doesNotMatch(source, /price:\s*1,\s*\n\s*change24h:\s*0/);
  assert.match(source, /never synthesize a market price/i);
});

test('market quality endpoint declares operational interpretation, not investment signal', async () => {
  const source = await read('functions/api/market-quality.js');
  assert.match(source, /not an investment signal/i);
  assert.match(source, /priceCompletenessPct/);
  assert.match(source, /duplicateSymbols/);
  assert.match(source, /freshnessScore/);
});

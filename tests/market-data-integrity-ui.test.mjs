import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('market UI never fabricates sparkline history', async () => {
  const source = await read('src/pages/Market.jsx');
  assert.doesNotMatch(source, /fallbackSparkline/);
  assert.doesNotMatch(source, /Math\.random/);
  assert.match(source, /const chartData = Array\.isArray\(spark\) && spark\.length > 1 \? spark : \[\]/);
  assert.match(source, /Grafik belum tersedia/);
  assert.match(source, /Chart unavailable/);
});

test('market UI exposes source and freshness metadata', async () => {
  const source = await read('src/pages/Market.jsx');
  assert.match(source, /freshnessFresh/);
  assert.match(source, /freshnessStale/);
  assert.match(source, /sourceUnavailable/);
  assert.match(source, /cacheAgeMs/);
  assert.match(source, /sourceLabel/);
  assert.match(source, /Snapshot server KriptoAman/);
});

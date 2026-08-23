import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Market is wrapped with the dedicated KAM reference surface', async () => {
  const config = await read('src/pages.config.js');
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(config, /Market: 'MarketWithKAM'/);
  assert.match(page, /US\$29\.37/);
  assert.match(page, /Indicative Scenario Reference/);
  assert.match(page, /Belum Diperdagangkan/);
  assert.match(page, /Not Yet Trading/);
  assert.match(page, /\/KAMGlobalRoadmap/);
});

test('KAM scenario value remains outside live market accounting', async () => {
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(page, /displayed separately from live market pricing/);
  assert.match(page, /excluded from market cap, P\/L, portfolio valuation, and live tickers/);
  assert.doesNotMatch(page, /change24h/);
  assert.doesNotMatch(page, /marketCap/);
});

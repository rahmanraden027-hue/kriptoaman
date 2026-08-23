import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('KAM server keeps indicative scenario reference separate from market price', async () => {
  const api = await read('functions/api/kam/network-status.js');
  assert.match(api, /marketPrice: null/);
  assert.match(api, /marketPriceStatus: 'not-yet-trading'/);
  assert.match(api, /value: 29\.37/);
  assert.match(api, /type: 'internal-scenario-estimate'/);
  assert.match(api, /isLiveMarketPrice: false/);
  assert.match(api, /Not a live market price/);
  assert.match(api, /official listing price/);
  assert.match(api, /guaranteed value/);
});

test('KAM UI labels US$29.37 as a scenario estimate and excludes it from live valuation', async () => {
  const page = await read('src/pages/KAM.jsx');
  assert.match(page, /Indicative Scenario Reference/);
  assert.match(page, /Referensi Skenario Indikatif/);
  assert.match(page, /Not a live market price/);
  assert.match(page, /Bukan harga pasar live/);
  assert.match(page, /market cap, P\/L, portfolio valuation, and live tickers/);
  assert.match(page, /market cap, P\/L, nilai portofolio, atau ticker live/);
});

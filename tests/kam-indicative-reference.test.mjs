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

test('KAM scenario drivers roadmap uses evidence-based milestones without price promises', async () => {
  const page = await read('src/pages/KAM.jsx');
  assert.match(page, /KAM SCENARIO DRIVERS/);
  assert.match(page, /Public mainnet with distributed validators/);
  assert.match(page, /Transparent liquidity infrastructure/);
  assert.match(page, /Market-based price discovery/);
  assert.match(page, /tidak secara otomatis menghasilkan harga tertentu/);
  assert.match(page, /do not automatically produce any specific price/);
  assert.match(page, /Harga pasar hanya terbentuk melalui perdagangan nyata/);
  assert.match(page, /Market price is formed only by real trading/);
});

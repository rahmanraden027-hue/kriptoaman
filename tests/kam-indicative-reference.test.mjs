import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('KAM server exposes unavailable market data without a scenario price', async () => {
  const api = await read('functions/api/kam/network-status.js');
  assert.match(api, /marketPrice: null/);
  assert.match(api, /marketPriceStatus: 'not-yet-trading'/);
  assert.doesNotMatch(api, /29\.37/);
  assert.doesNotMatch(api, /indicativeListingReference/);
});

test('KAM UI keeps price and valuation unavailable without a verified source', async () => {
  const page = await read('src/pages/KAM.jsx');
  assert.match(page, /No verified market-price source/);
  assert.match(page, /Tidak ada sumber harga pasar terverifikasi/);
  assert.match(page, /does not display KAM price, volume, market cap, P\/L, or valuation/);
  assert.doesNotMatch(page, /29\.37/);
});

test('KAM scenario drivers roadmap uses evidence-based milestones without price promises', async () => {
  const page = await read('src/pages/KAM.jsx');
  assert.match(page, /KAM READINESS DRIVERS/);
  assert.match(page, /Public mainnet with distributed validators/);
  assert.match(page, /Transparent liquidity infrastructure/);
  assert.match(page, /Market-based price discovery/);
  assert.match(page, /tidak secara otomatis menghasilkan harga tertentu/);
  assert.match(page, /do not automatically produce any specific price/);
  assert.match(page, /Harga pasar hanya terbentuk melalui perdagangan nyata/);
  assert.match(page, /Market price is formed only by real trading/);
});

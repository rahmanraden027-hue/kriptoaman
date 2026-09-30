import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('PriceTracker is crypto-only and never fabricates prices or chart history', async () => {
  const page = await read('src/pages/PriceTracker.jsx');
  assert.match(page, /\/api\/market-snapshot-page\?page=0&limit=500/);
  assert.match(page, /Tidak ada harga, perubahan, atau grafik sintetis/);
  assert.doesNotMatch(page, /ForexCommodityWidget|global-markets|XAU\/USD|EUR\/USD/);
  assert.doesNotMatch(page, /Math\.random|BASE_PRICES|stream\.binance\.com/);
});

test('core production smoke no longer requires forex or gold', async () => {
  const smoke = await read('.github/workflows/live-site-smoke.yml');
  assert.doesNotMatch(smoke, /Global Markets Forex and XAUUSD|api\/global-markets|EUR\/USD|XAU\/USD/);
  assert.match(smoke, /Check QoryVEx first-party token intelligence/);
  assert.match(smoke, /Check public platform market status consistency/);
});

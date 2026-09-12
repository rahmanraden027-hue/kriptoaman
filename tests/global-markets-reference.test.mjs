import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Market route points to the multi-asset market composition', async () => {
  const config = await read('src/pages.config.js');
  const page = await read('src/pages/MarketGlobal.jsx');
  assert.match(config, /Market: 'MarketGlobal'/);
  assert.match(page, /GlobalMarketsHub/);
  assert.match(page, /MarketWithKAM/);
});

test('Global market surface exposes Forex and XAU\/USD without execution claims', async () => {
  const component = await read('src/components/market/GlobalMarketsHub.jsx');
  const endpoint = await read('functions/api/global-markets.js');
  assert.match(component, /Crypto · Forex · Metals/);
  assert.match(component, /XAU\/USD · Gold Intelligence/);
  assert.match(endpoint, /EUR\/USD/);
  assert.match(endpoint, /GBP\/USD/);
  assert.match(endpoint, /XAU\/USD/);
  assert.match(endpoint, /executionPrice: false/);
  assert.match(endpoint, /investmentAdvice: false/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Market is wrapped with the dedicated static KAM reference surface', async () => {
  const config = await read('src/pages.config.js');
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(config, /Market: 'MarketWithKAM'/);
  assert.match(page, /INDICATIVE_REFERENCE = 29\.37/);
  assert.match(page, /formatIndicativeReference/);
  assert.match(page, /US\$29\.37/);
  assert.match(page, /BELUM DIPERDAGANGKAN/);
  assert.match(page, /NOT YET TRADING/);
  assert.match(page, /\/KAMGlobalRoadmap/);
  assert.match(page, /\/IntelligenceHub/);
});

test('KAM indicative reference is static and explicitly not live trading data', async () => {
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(page, /Skenario indikatif · bukan harga live/);
  assert.match(page, /Indicative scenario · not a live price/);
  assert.doesNotMatch(page, /INDICATIVE_MOTION/);
  assert.doesNotMatch(page, /setInterval/);
  assert.doesNotMatch(page, /animate-ping/);
});

test('KAM scenario value remains outside live market accounting while market intelligence may use verified live data', async () => {
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(page, /terpisah dari harga pasar live/);
  assert.match(page, /separate from live market pricing/);
  assert.match(page, /excluded from market cap, P\/L, portfolio valuation, and market tickers/);
  assert.match(page, /useLivePrices/);
  assert.match(page, /change24h:\s*Number\(data\?\.change24h\)/);
  assert.doesNotMatch(page, /market_cap:\s*INDICATIVE_REFERENCE/i);
  assert.doesNotMatch(page, /current_price:\s*INDICATIVE_REFERENCE/i);
  assert.doesNotMatch(page, /price:\s*INDICATIVE_REFERENCE/i);
  assert.doesNotMatch(page, /change24h:\s*INDICATIVE_REFERENCE/i);
  assert.doesNotMatch(page, /marketCap:\s*INDICATIVE_REFERENCE/i);
});

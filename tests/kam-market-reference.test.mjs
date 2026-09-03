import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Market is wrapped with the dedicated KAM audit-status surface', async () => {
  const config = await read('src/pages.config.js');
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(config, /Market: 'MarketWithKAM'/);
  assert.match(page, /AUDIT BERLANGSUNG/);
  assert.match(page, /AUDIT IN PROGRESS/);
  assert.match(page, /Review independen · production hold/);
  assert.match(page, /Independent review · production hold/);
  assert.match(page, /Belum ada laporan audit eksternal yang diterima/);
  assert.match(page, /No attributable external audit report has been received yet/);
  assert.match(page, /1–3 minggu setelah kickoff auditor/);
  assert.match(page, /1–3 weeks after auditor kickoff/);
  assert.match(page, /BELUM DIPERDAGANGKAN/);
  assert.match(page, /NOT YET TRADING/);
  assert.match(page, /\/KAMGlobalRoadmap/);
  assert.match(page, /\/IntelligenceHub/);
  assert.doesNotMatch(page, /INDICATIVE_REFERENCE/);
  assert.doesNotMatch(page, /US\$29\.37/);
});

test('KAM audit status is explicitly separate from live market pricing', async () => {
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(page, /production hold/);
  assert.match(page, /Belum ada laporan audit eksternal yang diterima/);
  assert.match(page, /subject to findings/);
  assert.doesNotMatch(page, /setInterval/);
  assert.doesNotMatch(page, /animate-ping/);
});

test('KAM audit status remains outside live market accounting while market intelligence may use verified live data', async () => {
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(page, /useLivePrices/);
  assert.match(page, /change24h:\s*Number\(data\?\.change24h\)/);
  assert.doesNotMatch(page, /market_cap:\s*AUDIT/i);
  assert.doesNotMatch(page, /current_price:\s*AUDIT/i);
  assert.doesNotMatch(page, /price:\s*AUDIT/i);
  assert.doesNotMatch(page, /change24h:\s*AUDIT/i);
  assert.doesNotMatch(page, /marketCap:\s*AUDIT/i);
});

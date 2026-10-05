import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 9F removes development-style KAM audit narrative from the primary Market surface', async () => {
  const config = await read('src/pages.config.js');
  const globalPage = await read('src/pages/MarketGlobal.jsx');
  const page = await read('src/pages/MarketWithKAM.jsx');

  assert.match(config, /Market: 'MarketGlobal'/);
  assert.match(globalPage, /MarketWithKAM/);
  assert.doesNotMatch(page, /AUDIT BERLANGSUNG|AUDIT IN PROGRESS/);
  assert.doesNotMatch(page, /1–3 minggu setelah kickoff auditor|1–3 weeks after auditor kickoff/);
  assert.doesNotMatch(page, /production hold/i);
  assert.doesNotMatch(page, /US\$29\.37|INDICATIVE_REFERENCE/);
});

test('Market remains live-data based while historical audit status stays outside pricing', async () => {
  const page = await read('src/pages/MarketWithKAM.jsx');
  assert.match(page, /useLivePrices/);
  assert.match(page, /change24h:\s*Number\(data\?\.change24h\)/);
  assert.match(page, /<Market compact \/>/);
  assert.doesNotMatch(page, /market_cap:\s*AUDIT/i);
  assert.doesNotMatch(page, /current_price:\s*AUDIT/i);
  assert.doesNotMatch(page, /price:\s*AUDIT/i);
  assert.doesNotMatch(page, /change24h:\s*AUDIT/i);
});

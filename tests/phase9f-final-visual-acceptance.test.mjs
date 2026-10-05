import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 9F keeps Home market availability consistent with rendered core metrics', async () => {
  const home = await read('src/pages/HomeV3.jsx');
  assert.match(home, /marketCoreMetricCount/);
  assert.match(home, /marketCoreMetricCount === 3/);
  assert.match(home, /marketState/);
  assert.match(home, /PARTIAL/);
});

test('Phase 9F makes primary Market database-first and removes development narrative', async () => {
  const [globalPage, wrapper, market] = await Promise.all([
    read('src/pages/MarketGlobal.jsx'),
    read('src/pages/MarketWithKAM.jsx'),
    read('src/pages/Market.jsx'),
  ]);

  assert.match(globalPage, /MarketWithKAM/);
  assert.doesNotMatch(globalPage, /FirstPartyCryptoIntelligenceStrip|NewTokenRadar/);
  assert.match(wrapper, /<Market compact \/>/);
  assert.doesNotMatch(wrapper, /AUDIT BERLANGSUNG|AUDIT IN PROGRESS|production hold/i);
  assert.match(market, /Market\(\{ compact = false \}\)/);
  assert.match(market, /KRIPTOAMAN MARKET DATABASE/);
  assert.match(market, /!compact &&/);
});

test('Phase 9F compresses Intelligence navigation while preserving production metrics', async () => {
  const hub = await read('src/pages/IntelligenceHub.jsx');
  assert.match(hub, /CHECKED AT/);
  assert.match(hub, /grid grid-cols-2 gap-2 xl:grid-cols-5/);
  assert.match(hub, /min-h-\[104px\]/);
  assert.match(hub, /snapshot\.assets/);
  assert.match(hub, /snapshot\.block/);
  assert.match(hub, /snapshot\.networks/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11C.2 defines one stable production data-state vocabulary', async () => {
  const state = await read('src/lib/dataState.js');
  for (const label of ['LIVE', 'VERIFIED', 'SYNCED', 'PARTIAL', 'SNAPSHOT', 'UNAVAILABLE']) {
    assert.match(state, new RegExp(`\\b${label}: '${label}'`));
  }
  assert.match(state, /CHECKING: 'CHECKING'/);
  assert.match(state, /available: DATA_STATE\.SNAPSHOT/);
  assert.match(state, /stale: DATA_STATE\.SNAPSHOT/);
  assert.match(state, /degraded: DATA_STATE\.PARTIAL/);
  assert.match(state, /operational: DATA_STATE\.LIVE/);
});

test('Phase 11C.2 primary KriptoAman surfaces consume the canonical state adapter', async () => {
  const files = await Promise.all([
    read('src/hooks/useMarketSurface.js'),
    read('src/pages/HomeV3.jsx'),
    read('src/pages/Market.jsx'),
    read('src/pages/MarketWithKAM.jsx'),
    read('src/pages/IntelligenceHub.jsx'),
    read('src/pages/ZEVARYQ.jsx'),
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
  ]);
  for (const source of files) {
    assert.match(source, /dataState|DATA_STATE/);
  }
});

test('Phase 11C.2 removes legacy terminal presentation states from primary surfaces', async () => {
  const surface = (await Promise.all([
    read('src/hooks/useMarketSurface.js'),
    read('src/pages/HomeV3.jsx'),
    read('src/pages/Market.jsx'),
    read('src/pages/MarketWithKAM.jsx'),
    read('src/pages/IntelligenceHub.jsx'),
    read('src/pages/ZEVARYQ.jsx'),
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
  ])).join('\n');

  assert.doesNotMatch(surface, /state\s*=\s*['"]STALE['"]/);
  assert.doesNotMatch(surface, />\s*AVAILABLE\s*</);
  assert.doesNotMatch(surface, />\s*SYNC\s*</);
  assert.doesNotMatch(surface, />\s*WAIT\s*</);
});

test('Phase 11C.2 preserves fail-closed semantics and read-only boundaries', async () => {
  const surface = (await Promise.all([
    read('src/lib/dataState.js'),
    read('src/pages/HomeV3.jsx'),
    read('src/pages/Market.jsx'),
    read('src/pages/IntelligenceHub.jsx'),
    read('src/pages/ZEVARYQ.jsx'),
  ])).join('\n');

  assert.match(surface, /UNAVAILABLE/);
  assert.match(surface, /payload\?\.live === true && payload\?\.verified === true/);
  assert.doesNotMatch(surface, /eth_sendRawTransaction|eth_sendTransaction|private.?key|custody|validator.?key/i);
});

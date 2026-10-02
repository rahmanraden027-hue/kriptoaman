import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('asset registry v3 is fail-closed and does not invent deployment evidence', async () => {
  const registry = await read('src/data/zevaryqAssetRegistry.js');

  assert.match(registry, /ZEVARYQ_ASSET_REGISTRY_VERSION = 3/);
  assert.match(registry, /symbol: 'ZVQ'[\s\S]*status: ZEVARYQ_ASSET_STATUS\.ACTIVE[\s\S]*assetType: 'native'/);
  assert.match(registry, /symbol: 'zBTC'[\s\S]*status: ZEVARYQ_ASSET_STATUS\.PLANNED[\s\S]*contractAddress: null/);
  assert.match(registry, /symbol: 'zETH'[\s\S]*status: ZEVARYQ_ASSET_STATUS\.PLANNED[\s\S]*contractAddress: null/);
  assert.doesNotMatch(registry, /symbol: 'ZUSD'/);
  assert.doesNotMatch(registry, /symbol: 'zUSDT'/);
  assert.doesNotMatch(registry, /symbol: 'zUSDC'/);
});

test('planned identities remain non-executable until independently verified', async () => {
  const registry = await read('src/data/zevaryqAssetRegistry.js');

  assert.match(registry, /symbol: 'zBTC'[\s\S]*executable: false/);
  assert.match(registry, /symbol: 'zETH'[\s\S]*executable: false/);
  assert.match(registry, /ZEVARYQ_EXECUTABLE_ASSETS/);
});

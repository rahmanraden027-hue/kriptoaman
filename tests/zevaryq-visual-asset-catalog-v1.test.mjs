import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('visual catalog is branding-only and does not synthesize the 12-logo target', async () => {
  const source = await read('src/data/zevaryqVisualAssetCatalog.js');
  assert.match(source, /ZEVARYQ_VISUAL_ASSET_CATALOG_VERSION = 1/);
  assert.match(source, /ZEVARYQ_VISUAL_TARGET_COUNT = 12/);
  assert.match(source, /symbol: 'ZVQ'/);
  assert.match(source, /symbol: 'zBTC'/);
  assert.match(source, /symbol: 'zETH'/);
  for (const symbol of ['ZUSD','zUSDT','zUSDC','zBNB','zSOL','zTRX','zXRP','zADA','zDOGE']) {
    assert.doesNotMatch(source, new RegExp("symbol: ['\"]" + symbol + "['\"]"));
  }
  assert.match(source, /MUST NOT be used as evidence of token deployment/);
  assert.match(source, /MUST NOT activate an asset in Wallet or Swap/);
});

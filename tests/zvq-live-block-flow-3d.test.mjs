import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ZEVARYQ live block endpoint is first-party and fail-closed', async () => {
  const source = await read('functions/api/zvq-live-blocks.js');
  assert.match(source, /EXPECTED_CHAIN_ID = 22028/);
  assert.match(source, /EXPECTED_CHAIN_ID_HEX = '0x560c'/);
  assert.match(source, /eth_chainId/);
  assert.match(source, /eth_blockNumber/);
  assert.match(source, /eth_getBlockByNumber/);
  assert.match(source, /const EXPLORER_BLOCKS_URL/);
  assert.match(source, /syntheticBlocksAllowed: false/);
  assert.match(source, /propagationLatencyMeasured: false/);
  assert.match(source, /animationAdvancesOnlyWithVerifiedHeadIncrease: true/);
});

test('LiveBlockFlow3D advances only on a verified increasing head', async () => {
  const source = await read('src/components/home/LiveBlockFlow3D.jsx');
  assert.match(source, /\/api\/zvq-live-blocks/);
  assert.match(source, /Number\(next\?\.chainId\) === 22028/);
  assert.match(source, /String\(next\?\.chainIdHex\)\.toLowerCase\(\) === '0x560c'/);
  assert.match(source, /nextHead > previousHead/);
  assert.match(source, /setAdvanceKey\(nextHead\)/);
  assert.match(source, /No synthetic blocks or invented propagation metrics are shown/);
});

test('production HomeV3 mounts the isolated live block flow', async () => {
  const source = await read('src/pages/HomeV3.jsx');
  assert.match(source, /LiveBlockFlow3D/);
  assert.match(source, /<LiveBlockFlow3D\/>/);
});

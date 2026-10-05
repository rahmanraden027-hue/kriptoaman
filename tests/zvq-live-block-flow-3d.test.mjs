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

test('public landing owns the isolated live block flow while authenticated Home stays de-duplicated', async () => {
  const [landing, home] = await Promise.all([
    read('src/components/landing/GLandingDeferredContent.jsx'),
    read('src/pages/HomeV3.jsx'),
  ]);
  assert.match(landing, /LiveBlockFlow3D/);
  assert.match(landing, /<LiveBlockFlow3D/);
  assert.doesNotMatch(home, /LiveBlockFlow3D/);
});


test('NodePropagation3D preserves the evidence boundary', async () => {
  const source = await read('src/components/home/NodePropagation3D.jsx');
  assert.match(source, /Node positions and propagation paths are illustrative/);
  assert.match(source, /peer-to-peer hop timing and physical node location are not claimed or measured/);
  assert.match(source, /Explorer height has caught up to the observed head/);
  assert.match(source, /No claim of measured peer propagation/);
});

test('LiveBlockFlow3D wires verified head data into NodePropagation3D', async () => {
  const source = await read('src/components/home/LiveBlockFlow3D.jsx');
  assert.match(source, /import NodePropagation3D from '\.\/NodePropagation3D'/);
  assert.match(source, /head=\{head\}/);
  assert.match(source, /advanceKey=\{advanceKey\}/);
  assert.match(source, /indexerLag=\{indexerLag\}/);
  assert.match(source, /indexedHead=\{indexedHead\}/);
});


test('ZEVARYQ live block feed exposes optional network operations evidence fail-closed', async () => {
  const source = await read('functions/api/zvq-live-blocks.js');
  assert.match(source, /optionalRpc\('eth_syncing'\)/);
  assert.match(source, /optionalRpc\('net_peerCount'\)/);
  assert.match(source, /optionalRpc\('qbft_getValidatorsByBlockNumber'/);
  assert.match(source, /optionalPeerCountIsNeverInferred: true/);
  assert.match(source, /validatorSetIsShownOnlyWhenPublicQbftRpcReturnsIt: true/);
  assert.match(source, /proposerEvidenceIsNotValidatorSetEvidence: true/);
});

test('NetworkOperationsPanel uses verified samples and never invents unsupported operations data', async () => {
  const source = await read('src/components/home/NetworkOperationsPanel.jsx');
  assert.match(source, /Rolling history is built only from successful first-party ZEVARYQ observations/);
  assert.match(source, /Public net_peerCount is unavailable or intentionally not exposed/);
  assert.match(source, /Authoritative validator set unavailable/);
  assert.match(source, /not equivalent to the authoritative validator set/);
  assert.match(source, /FAIL-CLOSED/);
});

test('LiveBlockFlow3D stores a bounded verified operations history and mounts NetworkOperationsPanel', async () => {
  const source = await read('src/components/home/LiveBlockFlow3D.jsx');
  assert.match(source, /import NetworkOperationsPanel from '\.\/NetworkOperationsPanel'/);
  assert.match(source, /setHistory\(\(current\)/);
  assert.match(source, /slice\(-24\)/);
  assert.match(source, /evidence=\{payload\?\.networkEvidence\}/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('pre-login reuses the same canonical ZEVARYQ truth surfaces as production home', async () => {
  const [login, surface, inspection] = await Promise.all([
    read('src/components/auth/LoginNetworkEntrance.jsx'),
    read('src/hooks/useZevaryqSurface.js'),
    read('src/hooks/useZevaryqNetworkInspection.js'),
  ]);

  assert.match(login, /useZevaryqSurface/);
  assert.match(login, /useZevaryqNetworkInspection/);
  assert.match(login, /data-cross-surface-truth="zevaryq-surface-v1"/);
  assert.match(login, /data-network-source=\{surface\?\.networkSourceMode/);
  assert.match(login, /data-network-state=\{networkState\}/);
  assert.match(login, /data-explorer-state=\{explorerState\}/);
  assert.match(surface, /FIRST_PARTY_CORROBORATED/);
  assert.match(inspection, /\/api\/zvq-live-blocks/);
  assert.equal(login.includes('explorer.kriptoaman.com/api/v2/blocks'), false);
  assert.doesNotMatch(login, /fetch\(/);
});

test('token intelligence explicitly proves what a zero count means', async () => {
  const api = await read('functions/api/zvq-token-intelligence.js');

  assert.match(api, /observationWindowBlocks: blocks\.length/);
  assert.match(api, /contractCreationCountIsObservedWindowFact: true/);
  assert.match(api, /tokenMetadataProvenCountIsObservedWindowFact: true/);
  assert.match(api, /zeroMeansNoObservationInVerifiedWindow: true/);
  assert.match(api, /contractCreationsObserved: creations\.length/);
  assert.match(api, /tokenMetadataProven: tokens\.length/);
});

test('all command surfaces fail closed if zero-count semantics are not proven', async () => {
  const [hero, onchain, pulse, grid] = await Promise.all([
    read('src/components/home-v10/CommandCenterHero.jsx'),
    read('src/components/home-v10/OnChainNow.jsx'),
    read('src/components/home-v10/NetworkPulse.jsx'),
    read('src/components/home-v10/MarketCommandGrid.jsx'),
  ]);

  for (const source of [hero, onchain, pulse, grid]) {
    assert.match(source, /contractCreationCountIsObservedWindowFact/);
    assert.match(source, /tokenMetadataProvenCountIsObservedWindowFact/);
    assert.match(source, /NOT EXPOSED/);
  }

  assert.match(hero, /data-zero-evidence-semantics="observed-window-fact"/);
  assert.match(onchain, /data-zero-evidence-semantics="observed-window-fact"/);
  assert.match(pulse, /data-zero-evidence-semantics="observed-window-fact"/);
  assert.match(onchain, /zero means none observed in that window/);
  assert.match(hero, /Contracts observed/);
  assert.match(hero, /Metadata proven/);
});

test('truth-state final pass does not alter the globe signature or write paths', async () => {
  const source = [
    await read('src/components/home-v10/CommandCenterHero.jsx'),
    await read('src/components/auth/LoginNetworkEntrance.jsx'),
    await read('src/components/home-v10/OnChainNow.jsx'),
    await read('src/components/home-v10/NetworkPulse.jsx'),
  ].join('\n');

  assert.match(source, /data-visual-master-globe="signature-v1"/);
  assert.doesNotMatch(source, /eth_sendRawTransaction|eth_sendTransaction|personal_|private.?key|validator.?key|genesis/i);
});

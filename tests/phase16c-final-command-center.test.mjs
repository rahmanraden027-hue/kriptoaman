import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 16C installs the final command-center visual integration on HomeV10', async () => {
  const [home, hero] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/components/home-v10/CommandCenterHero.jsx'),
  ]);

  assert.match(home, /CommandCenterHero/);
  assert.match(home, /<CommandCenterHero market={market} zevaryq={zevaryq} \/>/);
  assert.match(home, /data-visual-integration="phase16c-final-command-center-v1"/);
  assert.match(hero, /Global Crypto Intelligence/);
  assert.match(hero, /data-phase16c-command-center="true"/);
  assert.match(hero, /Visual topology · verified core data only/);
  assert.match(hero, /\/brand\/zevaryq-mark\.svg/);
  assert.doesNotMatch(hero, /fetch\(/);
});

test('Phase 16C derives visible metrics only from Phase 16B data surfaces', async () => {
  const hero = await read('src/components/home-v10/CommandCenterHero.jsx');

  assert.match(hero, /safeSum\(assets, 'marketCap'\)/);
  assert.match(hero, /safeSum\(assets, 'volume'\)/);
  assert.match(hero, /market\?\.breadth/);
  assert.match(hero, /zevaryq\?\.network\?\.blockNumber/);
  assert.match(hero, /onChain\?\.radar\?\.contractCreationsObserved/);
  assert.match(hero, /onChain\?\.radar\?\.tokenMetadataProven/);
  assert.doesNotMatch(hero, /TPS|validator count|uptime percentage|ZVQ price/i);
  assert.doesNotMatch(hero, /Math\.random/);
});

test('Phase 16C expands ZEVARYQ panels with attributable evidence only', async () => {
  const [network, onchain] = await Promise.all([
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
    read('src/components/home-v10/OnChainNow.jsx'),
  ]);

  assert.match(network, /probeDurationMs/);
  assert.match(network, /Chain ID/);
  assert.match(network, /Latest Block/);
  assert.match(network, /NETWORK PROOF/);
  assert.match(onchain, /radar\?\.scannedBlocks/);
  assert.match(onchain, /radar\?\.confirmationDepth/);
  assert.match(onchain, /latencyMs/);
  assert.match(onchain, /ON-CHAIN EVIDENCE/);
  assert.doesNotMatch(network + onchain, /eth_sendTransaction|eth_sendRawTransaction|private.?key/i);
});

test('Phase 16C architecture exposes the complete truth-state vocabulary', async () => {
  const architecture = await read('src/lib/productArchitecture.js');
  assert.match(architecture, /CROSS_SURFACE_RELEASE = 'phase15f'/);
  assert.match(architecture, /VISUAL_INTEGRATION_RELEASE = 'phase16c'/);
  for (const state of ['LIVE', 'VERIFIED', 'SYNCED', 'INDEXED', 'CALCULATED', 'DELAYED', 'PARTIAL', 'SNAPSHOT', 'UNAVAILABLE', 'CHECKING']) {
    assert.match(architecture, new RegExp('DATA_STATE\\.' + state));
  }
});

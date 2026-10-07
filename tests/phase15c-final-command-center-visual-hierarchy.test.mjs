import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 15C locks command center order to market intelligence network evidence', async () => {
  const home = await read('src/pages/HomeV10.jsx');
  const market = home.indexOf('data-command-layer="market"');
  const intelligence = home.indexOf('data-command-layer="intelligence"');
  const network = home.indexOf('data-command-layer="network"');
  const evidence = home.indexOf('data-command-layer="evidence"');
  const flow = home.indexOf('<ProductFlowRail />');

  assert.ok(market >= 0, 'market command layer missing');
  assert.ok(intelligence > market, 'intelligence must follow market');
  assert.ok(network > intelligence, 'network must follow intelligence');
  assert.ok(evidence > network, 'evidence must follow network');
  assert.ok(flow > evidence, 'decision flow must remain secondary to live data');
});

test('Phase 15C renders market provenance once instead of repeating identical source bars', async () => {
  const [home, featured, pulse, movers, intelligence] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/components/home-v10/FeaturedMarketAsset.jsx'),
    read('src/components/home-v10/MarketPulse.jsx'),
    read('src/components/home-v10/TopMovers.jsx'),
    read('src/components/home-v10/IntelligenceStream.jsx'),
  ]);

  assert.match(home, /label="MARKET FEED"/);
  for (const content of [featured, pulse, movers, intelligence]) {
    assert.doesNotMatch(content, /DataProvenanceBar/);
  }
});

test('Phase 15C keeps independent ZEVARYQ sources independently attributable', async () => {
  const [network, onchain] = await Promise.all([
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
    read('src/components/home-v10/OnChainNow.jsx'),
  ]);
  assert.match(network, /DataProvenanceBar/);
  assert.match(network, /NETWORK PROOF/);
  assert.match(onchain, /DataProvenanceBar/);
  assert.match(onchain, /ON-CHAIN EVIDENCE/);
});

test('Phase 15C compacts provenance and decision flow without hiding their contracts', async () => {
  const [provenance, flow] = await Promise.all([
    read('src/components/home-v10/DataProvenanceBar.jsx'),
    read('src/components/home-v10/ProductFlowRail.jsx'),
  ]);
  assert.match(provenance, /min-h-10/);
  assert.match(provenance, /data-trust-signal="readable-v1"/);
  assert.match(provenance, /data-data-state=/);
  assert.match(provenance, /data-data-source=/);
  assert.match(flow, /Intelligence Flow/);
  assert.match(flow, /min-h-9/);
  assert.match(flow, /Observe/);
  assert.match(flow, /Verify/);
});

test('Phase 15C remains inside the presentation-only safety boundary', async () => {
  const doc = await read('docs/PHASE15C_FINAL_COMMAND_CENTER_VISUAL_HIERARCHY.md');
  assert.match(doc, /does not modify network APIs/i);
  assert.match(doc, /genesis/);
  assert.match(doc, /private keys/);
  assert.match(doc, /wallet signing\/broadcasting/);
  assert.match(doc, /token state/);
});

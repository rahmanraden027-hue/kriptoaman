import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('phase 16B centralizes verified ZEVARYQ live-state mapping', () => {
  const hook = read('src/hooks/useZevaryqSurface.js');
  const home = read('src/pages/HomeV10.jsx');
  const strip = read('src/components/home-v10/ZevaryqLiveStrip.jsx');
  const onChain = read('src/components/home-v10/OnChainNow.jsx');

  assert.match(hook, /EXPECTED_CHAIN_ID = 22028/);
  assert.match(hook, /EXPECTED_CHAIN_ID_HEX = '0x560c'/);
  assert.match(hook, /networkMs: 30_000/);
  assert.match(hook, /onChainMs: 15_000/);
  assert.match(hook, /networkMs: 90_000/);
  assert.match(hook, /onChainMs: 45_000/);
  assert.match(hook, /networkPayload\?\.live === true/);
  assert.match(hook, /networkPayload\?\.verified === true/);
  assert.match(hook, /onChainPayload\?\.provenance\?\.ownership === 'first-party'/);
  assert.match(hook, /const networkStatusUsable = networkIdentityVerified && networkFresh/);
  assert.match(hook, /FIRST_PARTY_CORROBORATED/);
  assert.match(hook, /networkCorroboratedByOnChain/);
  assert.match(hook, /sync remains CHECKING/);
  assert.match(hook, /DATA_STATE\.DELAYED/);

  assert.match(home, /useZevaryqSurface/);
  assert.match(home, /data-command-release="phase15d"/);
  assert.match(home, /data-production-data-binding="phase16b-verified-live-state-v1"/);
  assert.match(home, /data-runtime-state-unification="first-party-corroborated-v1"/);
  assert.match(home, /<ZevaryqLiveStrip surface={zevaryq} \/>/);
  assert.match(home, /<OnChainNow surface={zevaryq} \/>/);

  assert.match(strip, /data-zvq-network-source=/);
  assert.match(strip, /corroborated evidence/);
  assert.doesNotMatch(strip, /fetch\(/);
  assert.doesNotMatch(onChain, /fetch\(/);
});

test('phase 16B data states and provenance remain machine-readable and fail-closed', () => {
  const states = read('src/lib/dataState.js');
  const provenance = read('src/components/home-v10/DataProvenanceBar.jsx');
  const market = read('src/hooks/useMarketSurface.js');

  for (const state of ['INDEXED', 'CALCULATED', 'DELAYED', 'UNAVAILABLE', 'CHECKING']) {
    assert.match(states, new RegExp(state));
  }

  assert.match(provenance, /data-data-state=/);
  assert.match(provenance, /data-data-source=/);
  assert.match(provenance, /data-data-timestamp=/);
  assert.match(provenance, /data-data-age-ms=/);
  assert.match(market, /marketSnapshotState/);
  assert.match(market, /isStale: Boolean/);
  assert.match(market, /truthMode: 'snapshot'/);
  assert.doesNotMatch(market, /Math\.random/);
});

test('phase 16B raises known low-contrast command-center supporting text', () => {
  const flow = read('src/components/home-v10/ProductFlowRail.jsx');
  const provenance = read('src/components/home-v10/DataProvenanceBar.jsx');

  assert.doesNotMatch(flow, /text-slate-700/);
  assert.doesNotMatch(flow, /text-slate-600/);
  assert.doesNotMatch(provenance, /text-slate-600/);
});

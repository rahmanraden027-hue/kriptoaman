import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 15B locks the four visible data contract fields', async () => {
  const architecture = await read('src/lib/productArchitecture.js');
  assert.match(architecture, /DATA_CONTRACT_FIELDS/);
  assert.match(architecture, /'state'/);
  assert.match(architecture, /'source'/);
  assert.match(architecture, /'timestamp'/);
  assert.match(architecture, /'freshness'/);
  assert.match(architecture, /failClosed: true/);
  assert.match(architecture, /simulatedProductionValuesAllowed: false/);
});

test('Phase 15B market surface exposes canonical provenance from the existing market boundary', async () => {
  const hook = await read('src/hooks/useMarketSurface.js');
  assert.match(hook, /const provenance = Object\.freeze/);
  assert.match(hook, /sourceId: raw\.source/);
  assert.match(hook, /KriptoAman Market DB/);
  assert.match(hook, /capturedAt: raw\.lastUpdated/);
  assert.match(hook, /ageMs/);
  assert.match(hook, /state,/);
});

test('Phase 15B keeps market provenance visibly bound to the shared command layer', async () => {
  const home = await read('src/pages/HomeV10.jsx');
  assert.match(home, /DataProvenanceBar/);
  assert.match(home, /MARKET FEED/);
  assert.match(home, /market\.provenance\?\.state/);
  assert.match(home, /market\.provenance\?\.sourceLabel/);
  assert.match(home, /market\.provenance\?\.capturedAt/);
  assert.match(home, /market\.provenance\?\.ageMs/);
});

test('Phase 15B network and on-chain panels expose first-party source timestamps and fail closed', async () => {
  const [network, onchain, surface] = await Promise.all([
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
    read('src/components/home-v10/OnChainNow.jsx'),
    read('src/hooks/useZevaryqSurface.js'),
  ]);
  assert.match(network, /DATA_STATE\.CHECKING/);
  assert.match(network, /NETWORK PROOF/);
  assert.match(onchain, /DATA_STATE\.CHECKING/);
  assert.match(onchain, /DATA_STATE\.LIVE/);
  assert.match(onchain, /ON-CHAIN EVIDENCE/);
  assert.match(surface, /DATA_STATE\.UNAVAILABLE/);
  assert.match(surface, /networkPayload\?\.checkedAt/);
  assert.match(surface, /onChainPayload\?\.observedAt/);
  assert.match(surface, /NETWORK_ENDPOINT = '\/api\/kam\/network-status'/);
  assert.match(surface, /ONCHAIN_ENDPOINT = '\/api\/zvq-token-intelligence'/);
});

test('Phase 15B provenance component makes state source and time machine-readable', async () => {
  const component = await read('src/components/home-v10/DataProvenanceBar.jsx');
  assert.match(component, /data-data-state=/);
  assert.match(component, /data-data-source=/);
  assert.match(component, /time unavailable/);
  assert.match(component, /<1m/);
  assert.match(component, /UNAVAILABLE/);
});

test('Phase 15B keeps the protected runtime boundary intact by design', async () => {
  const doc = await read('docs/PHASE15B_COMMAND_CENTER_DATA_CONTRACT.md');
  assert.match(doc, /does not change genesis/i);
  assert.match(doc, /validator\/private keys/);
  assert.match(doc, /wallet signing\/broadcasting/);
  assert.match(doc, /token state/);
});

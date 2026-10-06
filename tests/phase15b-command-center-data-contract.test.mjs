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

test('Phase 15B renders provenance on every primary market intelligence panel', async () => {
  const files = await Promise.all([
    read('src/components/home-v10/FeaturedMarketAsset.jsx'),
    read('src/components/home-v10/MarketPulse.jsx'),
    read('src/components/home-v10/TopMovers.jsx'),
    read('src/components/home-v10/IntelligenceStream.jsx'),
  ]);
  for (const content of files) assert.match(content, /DataProvenanceBar/);
  assert.match(files[0], /MARKET SOURCE/);
  assert.match(files[1], /MARKET PULSE/);
  assert.match(files[2], /MOVERS SOURCE/);
  assert.match(files[3], /INTELLIGENCE INPUT/);
});

test('Phase 15B network and on-chain panels expose first-party source timestamps and fail closed', async () => {
  const [network, onchain] = await Promise.all([
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
    read('src/components/home-v10/OnChainNow.jsx'),
  ]);
  assert.match(network, /DATA_STATE\.CHECKING/);
  assert.match(network, /DATA_STATE\.VERIFIED/);
  assert.match(network, /DATA_STATE\.UNAVAILABLE/);
  assert.match(network, /checkedAt/);
  assert.match(network, /NETWORK PROOF/);
  assert.match(onchain, /DATA_STATE\.CHECKING/);
  assert.match(onchain, /DATA_STATE\.LIVE/);
  assert.match(onchain, /DATA_STATE\.UNAVAILABLE/);
  assert.match(onchain, /observedAt/);
  assert.match(onchain, /ON-CHAIN EVIDENCE/);
});

test('Phase 15B provenance component makes state source and time machine-readable', async () => {
  const component = await read('src/components/home-v10/DataProvenanceBar.jsx');
  assert.match(component, /data-data-state=/);
  assert.match(component, /data-data-source=/);
  assert.match(component, /timestamp unavailable/);
  assert.match(component, /<1m old/);
  assert.match(component, /UNAVAILABLE/);
});

test('Phase 15B keeps the protected runtime boundary intact by design', async () => {
  const doc = await read('docs/PHASE15B_COMMAND_CENTER_DATA_CONTRACT.md');
  assert.match(doc, /does not change genesis/i);
  assert.match(doc, /validator\/private keys/);
  assert.match(doc, /wallet signing\/broadcasting/);
  assert.match(doc, /token state/);
});

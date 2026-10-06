import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 15 locks the final product architecture roles and decision loop', async () => {
  const architecture = await read('src/lib/productArchitecture.js');
  assert.match(architecture, /PRODUCT_ARCHITECTURE_VERSION = '2026\.1'/);
  assert.match(architecture, /INTELLIGENCE_AND_CONTROL/);
  assert.match(architecture, /USER_EXECUTION_INTERFACE/);
  assert.match(architecture, /BLOCKCHAIN_AND_SETTLEMENT/);
  assert.match(architecture, /EVIDENCE_AND_VERIFICATION/);
  assert.match(architecture, /NATIVE_NETWORK_ASSET/);
  assert.match(architecture, /'OBSERVE'/);
  assert.match(architecture, /'UNDERSTAND'/);
  assert.match(architecture, /'DECIDE'/);
  assert.match(architecture, /'EXECUTE'/);
  assert.match(architecture, /'VERIFY'/);
});

test('Phase 15 defines data contracts for the final production screens', async () => {
  const architecture = await read('src/lib/productArchitecture.js');
  for (const id of ['command-center', 'markets', 'intelligence', 'network', 'portfolio', 'security', 'wallet', 'explorer']) {
    assert.match(architecture, new RegExp("id: '" + id + "'"));
  }
  assert.match(architecture, /\/api\/kam\/network-status/);
  assert.match(architecture, /\/api\/market-snapshot-page/);
  assert.match(architecture, /\/api\/zvq-token-intelligence/);
  assert.match(architecture, /signing and broadcasting remain release-policy gated/i);
});

test('Phase 15 applies the architecture contract to the public HomeV10 surface', async () => {
  const [home, rail, nav] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/components/home-v10/ProductFlowRail.jsx'),
    read('src/lib/primaryNavigation.js'),
  ]);

  assert.match(home, /ProductFlowRail/);
  assert.match(home, /PRODUCT_ARCHITECTURE_VERSION/);
  assert.match(home, /INTELLIGENCE/);
  assert.match(rail, /Observe/);
  assert.match(rail, /Understand/);
  assert.match(rail, /Decide/);
  assert.match(rail, /Execute/);
  assert.match(rail, /Verify/);
  assert.match(rail, /\/wallet-app/);
  assert.match(rail, /explorer\.kriptoaman\.com/);
  assert.match(nav, /onchain: 'Jaringan'/);
  assert.match(nav, /onchain: 'Network'/);
});

test('Phase 15 remains inside the read-only product architecture boundary', async () => {
  const doc = await read('docs/KRIPTOAMAN_FINAL_PRODUCT_ARCHITECTURE_2026.md');
  assert.match(doc, /does \*\*not\*\* change/i);
  assert.match(doc, /genesis/);
  assert.match(doc, /validator keys/);
  assert.match(doc, /private keys/);
  assert.match(doc, /balances or token state/);
  assert.match(doc, /wallet signing or broadcasting/);
  assert.match(doc, /Chain ID 22028 \(0x560c\)/);
});

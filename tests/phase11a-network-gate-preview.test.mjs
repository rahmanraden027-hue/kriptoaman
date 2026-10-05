import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11A exposes an isolated preview route without replacing production root', async () => {
  const app = await read('src/App.jsx');
  assert.match(app, /\/preview\/network-gate/);
  assert.match(app, /<HomeV10 \/>/);
  assert.match(app, /pathname === '\/'/);
  assert.doesNotMatch(app, /pathname === '\/'[^]*<NetworkGatePreview \/>/);
});

test('Phase 11A gate uses verified read-only ZEVARYQ sources and fails closed', async () => {
  const gate = await read('src/pages/NetworkGatePreview.jsx');
  assert.match(gate, /\/api\/kam\/network-status/);
  assert.match(gate, /https:\/\/explorer\.kriptoaman\.com\/api\/v2\/blocks/);
  assert.match(gate, /EXPECTED_CHAIN_ID = 22028/);
  assert.match(gate, /EXPECTED_CHAIN_HEX = '0x560c'/);
  assert.match(gate, /payload\?\.live !== true/);
  assert.match(gate, /payload\?\.verified !== true/);
  assert.match(gate, /Fail-closed/);
  assert.doesNotMatch(gate, /eth_sendRawTransaction|eth_sendTransaction|personal_|admin_|debug_|txpool_|private.?key/i);
});

test('Phase 11A renders only validated Explorer block records in the animated flow', async () => {
  const gate = await read('src/pages/NetworkGatePreview.jsx');
  assert.match(gate, /Number\.isSafeInteger\(height\)/);
  assert.match(gate, /\^0x\[0-9a-fA-F\]\{64\}\$/);
  assert.match(gate, /payload\.items\.map\(readBlock\)\.filter\(Boolean\)/);
  assert.match(gate, /key=\{block\.hash\}/);
  assert.doesNotMatch(gate, /Math\.random/);
});

test('Phase 11A preview is noindex and provides login, Explorer, and HomeV10 exits', async () => {
  const gate = await read('src/pages/NetworkGatePreview.jsx');
  assert.match(gate, /noindex,nofollow,noarchive/);
  assert.match(gate, /to="\/login"/);
  assert.match(gate, /https:\/\/explorer\.kriptoaman\.com/);
  assert.match(gate, /to="\/"/);
  assert.match(gate, /prefers-reduced-motion/);
});

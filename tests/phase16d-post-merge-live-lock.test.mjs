import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 16D production provenance tracks the current command center while preserving Phase 16C proof markers', async () => {
  const workflow = await read('.github/workflows/production-presentation-provenance.yml');
  assert.match(workflow, /Phase 16D production contract/);
  for (const marker of [
    'home-live-intelligence-command-center-v1',
    'Blockchain bergerak setiap detik.',
    'Lihat. Pahami. Verifikasi.',
    'Aset dipantau',
    'Market Overview',
    'Market Heatmap',
    'LIVE NETWORK PULSE',
    'Mempool source',
    'Global Crypto Intelligence',
    'Visual topology · verified core data only',
    'ZEVARYQ NETWORK · LIVE EVIDENCE',
    'ZEVARYQ evidence radar',
  ]) assert.ok(workflow.includes(marker), marker);

  for (const superseded of ['Top Gainer', 'Most Active', 'Market Direction', 'Top Movers', 'Live Intelligence']) {
    assert.ok(!workflow.includes("'" + superseded + "'"), superseded + ' must not remain required');
  }
  assert.doesNotMatch(workflow, /'ZEVARYQ discovery'/);
});

test('Phase 16D live browser gate tolerates rollout propagation without weakening truth checks', async () => {
  const script = await read('scripts/verify-home-v10-production.mjs');
  assert.match(script, /phase15d_production_lock/);
  assert.match(script, /phase16d_live_lock/);
  assert.match(script, /PHASE16C_VISUAL_MARKER = 'phase16c-final-command-center-v1'/);
  assert.match(script, /attempt <= 3/);
  assert.match(script, /data-phase16c-command-center="true"/);
  assert.match(script, /snapshot\.visualIntegration/);
  assert.match(script, /requiredApis/);
  assert.match(script, /\/api\/market-snapshot-page/);
  assert.match(script, /\/api\/kam\/network-status/);
  assert.match(script, /\/api\/zvq-token-intelligence/);
  assert.match(script, /requestFailures/);
  assert.match(script, /pageErrors/);
  assert.match(script, /Math\.abs\(onChainBlock - networkBlock\) <= 25/);
  assert.doesNotMatch(script, /eth_sendTransaction|eth_sendRawTransaction|wallet_requestPermissions|private.?key/i);
});

test('Phase 16D evidence artifact is named for the post-merge live lock', async () => {
  const workflow = await read('.github/workflows/home-v10-production-lock.yml');
  assert.match(workflow, /Preserve Phase 16D post-merge production evidence/);
  assert.match(workflow, /home-v10-production-lock-evidence/);
  assert.match(workflow, /kriptoaman\/home-v10-production-visual-proof/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 15D marks the exact command-center release that must appear in production', async () => {
  const home = await read('src/pages/HomeV10.jsx');
  assert.match(home, /data-command-release="phase15d"/);
  for (const layer of ['market', 'intelligence', 'network', 'evidence']) {
    assert.match(home, new RegExp('data-command-layer="' + layer + '"'));
  }
});

test('Phase 15D production browser proof matches the current canonical network truth states', async () => {
  const script = await read('scripts/verify-home-v10-production.mjs');
  assert.match(script, /phase15d_production_lock/);
  assert.match(script, /main\[data-command-release="phase15d"\]/);
  assert.match(script, /●\\s\*VERIFIED/);
  assert.match(script, /SYNCED/);
  assert.match(script, /\['market', 'intelligence', 'network', 'evidence'\]/);
  assert.match(script, /mobile-390/);
  assert.match(script, /desktop-1440/);
  assert.match(script, /page\.screenshot/);
  assert.match(script, /scrollWidth <= config\.width \+ 1/);
  assert.match(script, /:scope > section/);
  assert.match(script, /ON-CHAIN EVIDENCE/);
  assert.match(script, /waitForTimeout\(250\)/);
  assert.match(script, /pageErrors/);
});

test('Phase 15D workflow publishes an exact-commit production visual proof status and evidence artifact', async () => {
  const workflow = await read('.github/workflows/home-v10-production-lock.yml');
  assert.match(workflow, /push:/);
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /Allow production deployment to settle/);
  assert.match(workflow, /sleep 60/);
  assert.match(workflow, /statuses: write/);
  assert.match(workflow, /kriptoaman\/home-v10-production-visual-proof/);
  assert.match(workflow, /home-v10-production-lock-evidence/);
  assert.match(workflow, /retention-days: 30/);
  assert.match(workflow, /jq -nc/);
});

test('Phase 15D remains a read-only deployment verification boundary', async () => {
  const [script, doc] = await Promise.all([
    read('scripts/verify-home-v10-production.mjs'),
    read('docs/PHASE15D_CONTROLLED_PRODUCTION_DEVICE_PROOF.md'),
  ]);
  assert.doesNotMatch(script, /eth_sendTransaction|eth_sendRawTransaction|wallet_requestPermissions|private[_ -]?key/i);
  assert.match(doc, /does not create a parallel Vercel deployment/i);
  assert.match(doc, /does not change DNS/i);
  assert.match(doc, /genesis/);
  assert.match(doc, /wallet signing\/broadcasting/);
  assert.match(doc, /token state/);
});

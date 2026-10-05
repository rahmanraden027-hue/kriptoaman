import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11B locks three device classes and live ZEVARYQ evidence', async () => {
  const script = await read('.github/scripts/phase11b-network-gate-device.mjs');
  for (const marker of ['mobile-390', 'tablet-768', 'desktop-1440']) {
    assert.equal(script.includes(marker), true);
  }
  assert.match(script, /Live evidence/);
  assert.match(script, /chainId !== '22028'/);
  assert.match(script, /0x560c/);
  assert.match(script, /cubeCount < 1/);
  assert.match(script, /latest block is missing or invalid/);
  assert.match(script, /reduced-motion contract/);
  assert.match(script, /normal-motion probe/);
  assert.doesNotMatch(script, /eth_sendRawTransaction|eth_sendTransaction|personal_|admin_|debug_|txpool_|private.?key/i);
});

test('Phase 11B workflow targets the isolated production preview and uploads evidence', async () => {
  const workflow = await read('.github/workflows/phase11b-network-gate-device.yml');
  assert.equal(workflow.includes('https://kriptoaman.com/preview/network-gate'), true);
  assert.match(workflow, /Phase 11B Network Gate Device Acceptance/);
  assert.match(workflow, /phase11b-network-gate-device\.mjs/);
  assert.match(workflow, /phase11b-network-gate-device-evidence/);
  assert.match(workflow, /workflow_dispatch/);
});

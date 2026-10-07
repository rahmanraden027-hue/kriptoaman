import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11G targets the production login across mobile tablet and desktop', async () => {
  const script = await read('.github/scripts/phase11g-login-network-device.mjs');
  assert.match(script, /PHASE11G_TARGET/);
  assert.match(script, /\/login/);
  for (const marker of ['mobile-390', 'tablet-768', 'desktop-1440']) {
    assert.equal(script.includes(marker), true);
  }
  assert.match(script, /Live network evidence/);
  assert.match(script, /horizontal overflow/);
  assert.match(script, /Chain ID\\s\*22028/);
});

test('Phase 11G proves authentication survives telemetry failure', async () => {
  const script = await read('.github/scripts/phase11g-login-network-device.mjs');
  assert.match(script, /forced fail-closed probe/);
  assert.match(script, /stateUnavailable/);
  assert.match(script, /stateLive/);
  assert.match(script, /\/api\/zvq-token-intelligence/);
  assert.match(script, /\/api\/zvq-live-blocks/);
  assert.match(script, /login controls became unavailable/);
  assert.match(script, /UNAVAILABLE state missing/);
  assert.doesNotMatch(script, /eth_sendRawTransaction|eth_sendTransaction|personal_|admin_|debug_|txpool_|private.?key|mnemonic|seed phrase/i);
});

test('Phase 11G workflow preserves recurring evidence and read-only scope', async () => {
  const workflow = await read('.github/workflows/phase11g-login-network-device.yml');
  assert.match(workflow, /Phase 11G Login Network Device Acceptance/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /phase11g-login-network-device\.mjs/);
  assert.match(workflow, /phase11g-login-network-device-evidence/);
  assert.match(workflow, /PHASE11G_TARGET/);
  assert.match(workflow, /\/login/);
});

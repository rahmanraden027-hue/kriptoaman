import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11E separates live production proof from candidate fixture proof', async () => {
  const script = await read('.github/scripts/phase11e-final-cross-surface.mjs');
  assert.match(script, /https:\/\/kriptoaman\.com/);
  assert.match(script, /candidate browser auth fixture only/);
  assert.match(script, /candidate UI with browser-only unauthenticated fixture/);
  assert.match(script, /realCredentialsUsed:false/);
  assert.match(script, /503 fail-closed/);
  assert.match(script, /REQUIRE_LIVE_BRAND/);
  assert.match(script, /EVENT !== 'pull_request'/);
  assert.doesNotMatch(script, /password|private.?key|mnemonic|seed phrase|authorization/i);
});

test('Phase 11E covers five primary domains and ZEVARYQ Wallet', async () => {
  const script = await read('.github/scripts/phase11e-final-cross-surface.mjs');
  for (const route of ['/', '/Market', '/IntelligenceHub', '/ZEVARYQ', '/Services', '/wallet-app']) {
    assert.equal(script.includes(route), true, 'missing route ' + route);
  }
  assert.match(script, /LOGIN_REQUIRED/);
  assert.match(script, /Connect Wallet\|Receive ZVQ\|My Wallet Assets/);
  assert.match(script, /candidatePublic/);
});

test('Phase 11E checks mobile and desktop geometry and production states', async () => {
  const script = await read('.github/scripts/phase11e-final-cross-surface.mjs');
  assert.match(script, /horizontal overflow/);
  assert.match(script, /bottom navigation touch area too small/);
  assert.match(script, /bottom navigation touch width too small/);
  assert.match(script, /desktop sidebar missing/);
  assert.match(script, /mobile embedded navigation missing/);
  assert.match(script, /CANONICAL_STATES/);
  assert.match(script, /390/);
  assert.match(script, /1440/);
});

test('Phase 11E workflow builds candidate, waits after merge and preserves evidence', async () => {
  const workflow = await read('.github/workflows/phase11e-final-cross-surface.yml');
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /vite preview --host 127\.0\.0\.1 --port 4173/);
  assert.match(workflow, /phase11e-final-cross-surface\.mjs/);
  assert.match(workflow, /phase11e-final-cross-surface-evidence/);
  assert.match(workflow, /Allow post-merge production deployment to settle/);
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /PHASE11E_EVENT/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /schedule:/);
});

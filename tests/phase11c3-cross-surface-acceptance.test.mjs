import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11C.3 walks the canonical five-domain KriptoAman experience', async () => {
  const script = await read('.github/scripts/phase11c3-cross-surface-browser.mjs');
  for (const route of ['/dashboard', '/Market', '/IntelligenceHub', '/ZEVARYQ', '/Services']) {
    assert.equal(script.includes(route), true, 'missing workspace route ' + route);
  }
  assert.match(script, /PUBLIC_HREFS/);
  assert.match(script, /WORKSPACE_HREFS/);
  assert.match(script, /publicMobileAcceptance/);
  assert.match(script, /authenticatedJourney/);
  assert.match(script, /auth-mobile/);
  assert.match(script, /auth-desktop/);
});

test('Phase 11C.3 auth fixture is browser-only and all other APIs fail closed', async () => {
  const script = await read('.github/scripts/phase11c3-cross-surface-browser.mjs');
  assert.match(script, /url\.pathname === '\/api\/auth\/me'/);
  assert.match(script, /status: 401/);
  assert.match(script, /status: 503/);
  assert.match(script, /realCredentialsUsed: false/);
  assert.match(script, /acceptance@kriptoaman\.local/);
  assert.doesNotMatch(script, /password|bearer|authorization|session.?token|private.?key/i);
});

test('Phase 11C.3 checks shell geometry, active navigation, overflow and canonical states', async () => {
  const script = await read('.github/scripts/phase11c3-cross-surface-browser.mjs');
  assert.match(script, /horizontal overflow/);
  assert.match(script, /active route mismatch/);
  assert.match(script, /topbar height drifted across surfaces/);
  assert.match(script, /primary navigation geometry drifted across surfaces/);
  assert.match(script, /CANONICAL_STATES/);
  assert.match(script, /LOGIN_REQUIRED/);
});

test('Phase 11C.3 workflow tests the built candidate and stores visual evidence', async () => {
  const workflow = await read('.github/workflows/phase11c3-cross-surface-acceptance.yml');
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /vite preview --host 127\.0\.0\.1 --port 4173/);
  assert.match(workflow, /phase11c3-cross-surface-browser\.mjs/);
  assert.match(workflow, /phase11c3-cross-surface-evidence/);
  assert.doesNotMatch(workflow, /pages\.dev/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11F adds live read-only ZEVARYQ evidence to login', async () => {
  const login = await read('src/pages/Login.jsx');
  const visual = await read('src/components/auth/LoginNetworkEntrance.jsx');
  assert.match(login, /LoginNetworkEntrance/);
  assert.match(login, /visual={<LoginNetworkEntrance language={language} \/>}/);
  assert.match(visual, /EXPECTED_CHAIN_ID = 22028/);
  assert.match(visual, /EXPECTED_CHAIN_HEX = '0x560c'/);
  assert.match(visual, /\/api\/kam\/network-status/);
  assert.match(visual, /explorer\.kriptoaman\.com\/api\/v2\/blocks/);
  assert.match(visual, /Promise\.allSettled/);
});

test('Phase 11F keeps authentication independent from blockchain telemetry', async () => {
  const visual = await read('src/components/auth/LoginNetworkEntrance.jsx');
  const login = await read('src/pages/Login.jsx');
  assert.match(visual, /authentication is independent from blockchain telemetry|autentikasi tidak bergantung pada telemetri blockchain/);
  assert.match(visual, /method: 'GET'/);
  assert.doesNotMatch(visual, /\/api\/auth\//);
  assert.doesNotMatch(visual, /POST|PUT|PATCH|DELETE/);
  assert.match(login, /loginViaEmailPassword/);
  assert.match(login, /verifyAdminMagic2FA/);
});

test('Phase 11F never fabricates network evidence', async () => {
  const visual = await read('src/components/auth/LoginNetworkEntrance.jsx');
  assert.match(visual, /networkResult\.status === 'fulfilled' \? networkResult\.value : null/);
  assert.match(visual, /explorerResult\.status === 'fulfilled' \? explorerResult\.value : \[\]/);
  assert.match(visual, /UNAVAILABLE/);
  assert.doesNotMatch(visual, /mock|sample block|fake block|synthetic/i);
});

test('Phase 11F preserves the standard auth layout for other auth pages', async () => {
  const layout = await read('src/components/AuthLayout.jsx');
  assert.match(layout, /visual = null/);
  assert.match(layout, /visual \?/);
  assert.match(layout, /max-w-md/);
  assert.match(layout, /max-w-6xl/);
});

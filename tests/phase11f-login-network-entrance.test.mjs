import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11F login now reuses the canonical ZEVARYQ truth surfaces', async () => {
  const login = await read('src/pages/Login.jsx');
  const visual = await read('src/components/auth/LoginNetworkEntrance.jsx');
  assert.match(login, /LoginNetworkEntrance/);
  assert.match(login, /visual={<LoginNetworkEntrance language={language} \/>}/);
  assert.match(visual, /useZevaryqSurface/);
  assert.match(visual, /useZevaryqNetworkInspection/);
  assert.match(visual, /data-cross-surface-truth="zevaryq-surface-v1"/);
  assert.match(visual, /data-network-source=\{surface\?\.networkSourceMode/);
  assert.match(visual, /data-network-state=\{networkState\}/);
  assert.match(visual, /data-explorer-state=\{explorerState\}/);
  assert.doesNotMatch(visual, /EXPLORER_BLOCKS|Promise\.allSettled|fetch\(/);
});

test('Phase 11F keeps authentication independent from blockchain telemetry', async () => {
  const visual = await read('src/components/auth/LoginNetworkEntrance.jsx');
  const login = await read('src/pages/Login.jsx');
  assert.match(visual, /authentication is independent from blockchain telemetry|autentikasi tidak bergantung pada telemetri blockchain/);
  assert.doesNotMatch(visual, /\/api\/auth\//);
  assert.doesNotMatch(visual, /POST|PUT|PATCH|DELETE/);
  assert.match(login, /loginViaEmailPassword/);
  assert.match(login, /verifyAdminMagic2FA/);
});

test('Phase 11F never fabricates network evidence and fails closed through canonical states', async () => {
  const visual = await read('src/components/auth/LoginNetworkEntrance.jsx');
  assert.match(visual, /DATA_STATE\.UNAVAILABLE/);
  assert.match(visual, /DATA_STATE\.CHECKING/);
  assert.match(visual, /DATA_STATE\.INDEXED/);
  assert.match(visual, /inspection\?\.blocks \|\| \[\]/);
  assert.match(visual, /Number\.isSafeInteger\(indexedHead\)/);
  assert.doesNotMatch(visual, /mock|sample block|fake block|synthetic/i);
});

test('Phase 11F preserves the standard auth layout for other auth pages', async () => {
  const layout = await read('src/components/AuthLayout.jsx');
  assert.match(layout, /visual = null/);
  assert.match(layout, /visual \?/);
  assert.match(layout, /max-w-md/);
  assert.match(layout, /max-w-6xl/);
});

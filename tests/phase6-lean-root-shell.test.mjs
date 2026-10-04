import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public root uses a lean shell and defers provider-heavy application code', async () => {
  const [app, full] = await Promise.all([
    read('src/App.jsx'),
    read('src/FullAppShell.jsx'),
  ]);

  assert.match(app, /const FullAppShell = lazy\(\(\) => import\('\.\/FullAppShell'\)\)/);
  assert.match(app, /if \(pathname === '\/'\)/);
  assert.match(app, /return <KriptoAmanGlobalLanding \/>/);
  assert.match(app, /<AppRouteGate \/>/);
  assert.match(app, /<PWAInstallPrompt \/>/);

  for (const forbidden of [
    'AuthProvider',
    'QueryClientProvider',
    'pagesConfig',
    'WorkspaceExperience',
    'NativeConnectivityBanner',
    'Web3Provider',
  ]) {
    assert.equal(app.includes(forbidden), false, `Lean root must not eagerly reference ${forbidden}`);
    assert.equal(full.includes(forbidden), true, `Full shell must retain ${forbidden}`);
  }
});

test('full application shell retains protected routing and wallet provider contracts', async () => {
  const full = await read('src/FullAppShell.jsx');
  assert.match(full, /path="\/dashboard"/);
  assert.match(full, /ProtectedRoute/);
  assert.match(full, /ADMIN_PAGE_KEYS\.has\(path\)/);
  assert.match(full, /path="\/wallet-app"/);
  assert.match(full, /<Web3Provider><WalletStandalonePage \/><\/Web3Provider>/);
  assert.match(full, /QueryClientProvider client=\{queryClientInstance\}/);
  assert.match(full, /<AuthProvider>/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 11C keeps KriptoAman primary surfaces in one adaptive experience', async () => {
  const [app, layout, home, primary] = await Promise.all([
    read('src/FullAppShell.jsx'),
    read('src/Layout.jsx'),
    read('src/pages/HomeV10.jsx'),
    read('src/components/mobile/PrimaryBottomNav.jsx'),
  ]);

  assert.match(app, /AdaptivePrimarySurface/);
  assert.match(app, /isAuthenticated/);
  assert.match(app, /isLoadingAuth/);
  assert.match(app, /path === 'Market'/);
  assert.match(app, /path === 'ZEVARYQ'/);
  assert.match(app, /path === 'QoryVExDiscovery'/);
  assert.match(app, /path="\/Services"/);
  assert.match(layout, /PRIMARY_NAV_ITEMS/);
  assert.match(home, /PRIMARY_NAV_ITEMS/);
  assert.match(primary, /PRIMARY_NAV_ITEMS/);
});

test('Phase 11C keeps ZEVARYQ Wallet a deliberate standalone ecosystem application', async () => {
  const [app, wallet] = await Promise.all([
    read('src/FullAppShell.jsx'),
    read('src/pages/Wallet.jsx'),
  ]);
  assert.match(app, /path="\/wallet-app"/);
  assert.match(app, /WalletStandalonePage \? <Web3Provider><WalletStandalonePage \/><\/Web3Provider>/);
  assert.match(wallet, /OFFICIAL WALLET/);
  assert.match(wallet, /ZEVARYQ Wallet/);
  assert.match(wallet, /WalletBottomNavigation/);
});

test('Phase 11C does not introduce write or custody behavior into navigation unification', async () => {
  const [contract, app, layout] = await Promise.all([
    read('src/lib/primaryNavigation.js'),
    read('src/FullAppShell.jsx'),
    read('src/Layout.jsx'),
  ]);
  const surface = contract + app + layout;
  assert.doesNotMatch(surface, /eth_sendRawTransaction|eth_sendTransaction|private.?key|genesis|validator.?key|custody/i);
});

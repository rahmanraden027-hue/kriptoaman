import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layout = await readFile(new URL('../src/Layout.jsx', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const primaryNav = await readFile(new URL('../src/components/mobile/PrimaryBottomNav.jsx', import.meta.url), 'utf8');

test('primary mobile bottom navigation remains fixed to five approved tabs', () => {
  const expectedEntries = [
    "{ id: 'home', page: 'Home', icon: Home }",
    "{ id: 'markets', page: 'Market', icon: TrendingUp }",
    "{ id: 'wallet', page: 'Wallet', icon: Wallet }",
    "{ id: 'alerts', page: 'Alerts', icon: Bell }",
    "{ id: 'profile', page: 'Profile', icon: User }",
  ];

  const positions = expectedEntries.map((entry) => {
    const index = layout.indexOf(entry);
    assert.notEqual(index, -1, `Missing locked bottom-nav entry: ${entry}`);
    return index;
  });

  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(layout, /id: \{ home: 'Beranda', markets: 'Pasar', wallet: 'Pantau', alerts: 'Peringatan', profile: 'Profil' \}/);
  assert.match(layout, /BOTTOM_NAV\.map/);
});

test('public Market keeps the same approved five-tab navigation without a back control', () => {
  const expectedPages = ["page: 'Home'", "page: 'Market'", "page: 'Wallet'", "page: 'Alerts'", "page: 'Profile'"];
  const positions = expectedPages.map((entry) => {
    const index = primaryNav.indexOf(entry);
    assert.notEqual(index, -1, `Missing public Market bottom-nav entry: ${entry}`);
    return index;
  });

  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(primaryNav, /home: 'Beranda', markets: 'Pasar', wallet: 'Pantau', alerts: 'Peringatan', profile: 'Profil'/);
  assert.match(app, /PublicMarketWithNav/);
  assert.match(app, /PrimaryBottomNav currentPageName="Market"/);
  assert.doesNotMatch(app, /MarketPageWithBack/);
});

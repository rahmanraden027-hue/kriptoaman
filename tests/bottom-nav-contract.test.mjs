import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layout = await readFile(new URL('../src/Layout.jsx', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/FullAppShell.jsx', import.meta.url), 'utf8');
const primaryNav = await readFile(new URL('../src/components/mobile/PrimaryBottomNav.jsx', import.meta.url), 'utf8');

test('primary mobile bottom navigation remains fixed to five final tabs', () => {
  const expectedEntries = [
    "{ id: 'home', page: 'Home', icon: Home }",
    "{ id: 'markets', page: 'Market', icon: BarChart3 }",
    "{ id: 'intelligence', page: 'IntelligenceHub', icon: BrainCircuit }",
    "{ id: 'onchain', page: 'ZEVARYQ', icon: ShieldCheck }",
    "{ id: 'ecosystem', page: 'Services', icon: LayoutGrid }",
  ];

  const positions = expectedEntries.map((entry) => {
    const index = layout.indexOf(entry);
    assert.notEqual(index, -1, `Missing locked bottom-nav entry: ${entry}`);
    return index;
  });

  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(layout, /id: \{ home: 'Beranda', markets: 'Market', intelligence: 'Intelijen', onchain: 'On-Chain', ecosystem: 'Ekosistem' \}/);
  assert.match(layout, /BOTTOM_NAV\.map/);
});

test('public Market uses the same UI 4.2 five-tab navigation without a back control', () => {
  const expectedPages = ["page: 'Home'", "page: 'Market'", "page: 'IntelligenceHub'", "page: 'ZEVARYQ'", "page: 'Services'"];
  const positions = expectedPages.map((entry) => {
    const index = primaryNav.indexOf(entry);
    assert.notEqual(index, -1, `Missing public Market bottom-nav entry: ${entry}`);
    return index;
  });

  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(primaryNav, /home: 'Beranda', markets: 'Market', intelligence: 'Intelijen', onchain: 'On-Chain', ecosystem: 'Ekosistem'/);
  assert.match(app, /PublicMarketWithNav/);
  assert.match(app, /PrimaryBottomNav currentPageName="Market"/);
  assert.doesNotMatch(app, /MarketPageWithBack/);
});

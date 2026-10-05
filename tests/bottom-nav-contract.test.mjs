import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

const [layout, app, primaryNav, contract] = await Promise.all([
  read('src/Layout.jsx'),
  read('src/FullAppShell.jsx'),
  read('src/components/mobile/PrimaryBottomNav.jsx'),
  read('src/lib/primaryNavigation.js'),
]);

test('five primary surfaces are defined once in the canonical navigation contract', () => {
  const expected = [
    ["home", "Home", "/", "/dashboard"],
    ["markets", "Market", "/Market", "/Market"],
    ["intelligence", "IntelligenceHub", "/IntelligenceHub", "/IntelligenceHub"],
    ["onchain", "ZEVARYQ", "/ZEVARYQ", "/ZEVARYQ"],
    ["ecosystem", "Services", "/Services", "/Services"],
  ];

  let previous = -1;
  for (const [id, page, publicTo, workspaceTo] of expected) {
    const marker = `id: '${id}', page: '${page}', publicTo: '${publicTo}', workspaceTo: '${workspaceTo}'`;
    const index = contract.indexOf(marker);
    assert.notEqual(index, -1, `Missing canonical primary navigation entry: ${marker}`);
    assert.ok(index > previous, `Primary navigation order drifted at ${id}`);
    previous = index;
  }

  assert.match(contract, /home: 'Beranda'/);
  assert.match(contract, /markets: 'Market'/);
  assert.match(contract, /intelligence: 'Intelijen'/);
  assert.match(contract, /onchain: 'On-Chain'/);
  assert.match(contract, /ecosystem: 'Ekosistem'/);
});

test('public and authenticated shells consume the same primary navigation contract', () => {
  assert.match(layout, /PRIMARY_NAV_ITEMS/);
  assert.match(layout, /primaryNavLabels/);
  assert.match(layout, /primaryNavTo\(item, 'workspace'\)/);
  assert.match(primaryNav, /PRIMARY_NAV_ITEMS/);
  assert.match(primaryNav, /primaryNavLabels/);
  assert.match(primaryNav, /primaryNavTo\(item, mode\)/);
  assert.match(primaryNav, /mode = 'public'/);
  assert.match(app, /AdaptivePrimarySurface/);
  assert.doesNotMatch(app, /PublicMarketWithNav/);
});

test('primary public surfaces preserve authenticated Layout and public fallback navigation', () => {
  assert.match(app, /path === 'Market'/);
  assert.match(app, /path === 'ZEVARYQ'/);
  assert.match(app, /path === 'QoryVExDiscovery'/);
  assert.match(app, /currentPageName="Services"/);
  assert.match(app, /isAuthenticated/);
  assert.match(app, /<LayoutWrapper currentPageName=\{currentPageName\}><Page \/><\/LayoutWrapper>/);
  assert.match(app, /<PrimaryBottomNav currentPageName=\{currentPageName\} mode="public" \/>/);
  assert.equal((app.match(/path="\/Services"/g) || []).length, 1);
});

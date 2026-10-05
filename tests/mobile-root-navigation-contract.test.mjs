import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

const [mobileHeader, bottomNav, contract] = await Promise.all([
  read('src/components/mobile/MobileHeader.jsx'),
  read('src/components/mobile/PrimaryBottomNav.jsx'),
  read('src/lib/primaryNavigation.js'),
]);

test('five primary mobile domains remain the canonical navigation model', () => {
  for (const page of ['Home', 'Market', 'IntelligenceHub', 'ZEVARYQ', 'Services']) {
    assert.ok(contract.includes(`page: '${page}'`), `Missing canonical page ${page}`);
  }
  for (const route of ['/', '/dashboard', '/Market', '/IntelligenceHub', '/ZEVARYQ', '/Services']) {
    assert.ok(contract.includes(`'${route}'`), `Missing canonical route ${route}`);
  }
});

test('primary bottom navigation keeps active-state, touch and safe-area behavior', () => {
  assert.match(bottomNav, /const active = currentPageName === page/);
  assert.match(bottomNav, /min-h-\[56px\]/);
  assert.match(bottomNav, /min-w-\[56px\]/);
  assert.match(bottomNav, /aria-current/);
  assert.match(bottomNav, /safe-area-inset-bottom/);
  assert.match(bottomNav, /primaryNavTo\(item, mode\)/);
});

test('mobile header still suppresses redundant headers on established root workspace pages', () => {
  assert.match(mobileHeader, /if \(isRoot\) return null/);
});

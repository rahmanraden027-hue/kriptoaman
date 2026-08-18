import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const mobileHeader = await readFile(new URL('../src/components/mobile/MobileHeader.jsx', import.meta.url), 'utf8');
const bottomNav = await readFile(new URL('../src/components/mobile/PrimaryBottomNav.jsx', import.meta.url), 'utf8');

test('five primary mobile pages never render a back header', () => {
  for (const page of ['Home', 'Market', 'PortfolioOverview', 'Wallet', 'SecurityHub']) {
    assert.match(mobileHeader, new RegExp(`['\"]${page}['\"]`));
  }
  for (const path of ['/dashboard', '/market', '/portfoliooverview', '/wallet', '/securityhub']) {
    assert.ok(mobileHeader.toLowerCase().includes(path), `Missing root path ${path}`);
  }
  assert.match(mobileHeader, /if \(isRoot\) return null/);
});

test('primary bottom navigation keeps approved routes and active-state behavior', () => {
  const requiredRoutes = [
    ["Home", "/dashboard"],
    ["Market", "/Market"],
    ["PortfolioOverview", "/PortfolioOverview"],
    ["Wallet", "/Wallet"],
    ["SecurityHub", "/SecurityHub"],
  ];

  for (const [page, route] of requiredRoutes) {
    assert.ok(bottomNav.includes(`page: '${page}'`), `Missing page ${page}`);
    assert.ok(bottomNav.includes(`to: '${route}'`), `Missing route ${route}`);
  }

  assert.match(bottomNav, /const active = currentPageName === page/);
  assert.match(bottomNav, /min-h-\[58px\]/);
  assert.match(bottomNav, /safe-area-inset-bottom/);
});

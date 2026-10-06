import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

const SURFACES = [
  ['src/pages/MarketWithKAM.jsx', 'market'],
  ['src/pages/IntelligenceHub.jsx', 'intelligence'],
  ['src/pages/ZEVARYQ.jsx', 'network'],
  ['src/pages/PortfolioOverview.jsx', 'portfolio'],
  ['src/pages/SecurityHub.jsx', 'security'],
];

test('Phase 15F exposes one shared continuity component and canonical destinations', async () => {
  const rail = await read('src/components/command/CrossSurfaceRail.jsx');
  for (const id of ['command-center', 'market', 'intelligence', 'network', 'portfolio', 'security', 'wallet']) {
    assert.match(rail, new RegExp("id: '" + id + "'"));
    assert.match(rail, new RegExp('data-surface-link='));
  }
  for (const route of ['/', '/Market', '/IntelligenceHub', '/ZEVARYQ', '/PortfolioOverview', '/SecurityHub', '/wallet-app']) {
    assert.ok(rail.includes("to: '" + route + "'"), route);
  }
  assert.match(rail, /data-product-continuity="phase15f"/);
  assert.match(rail, /aria-current=\{active \? 'page' : undefined\}/);
});

test('Phase 15F marks every principal product surface with one release identity', async () => {
  for (const [path, id] of SURFACES) {
    const source = await read(path);
    assert.match(source, new RegExp('data-product-surface="' + id + '"'), path);
    assert.match(source, /data-product-release="phase15f"/, path);
    assert.match(source, /CrossSurfaceRail/, path);
    assert.match(source, new RegExp('current="' + id + '"'), path);
  }
});

test('Phase 15F removes the legacy Intelligence to KAMNetwork navigation drift', async () => {
  const intelligence = await read('src/pages/IntelligenceHub.jsx');
  assert.match(intelligence, /to: '\/ZEVARYQ'/);
  assert.doesNotMatch(intelligence, /to: '\/KAMNetwork'/);
});

test('Phase 15F aligns Market and Security to command hero language', async () => {
  const [market, security] = await Promise.all([
    read('src/pages/MarketWithKAM.jsx'),
    read('src/pages/SecurityHub.jsx'),
  ]);
  assert.match(market, /className="ka-command-hero p-3 sm:p-4"/);
  assert.match(security, /className="ka-command-hero p-5 sm:p-7"/);
});

test('Phase 15F preserves the protected Wallet implementation and aligns it at the route shell', async () => {
  const [shell, wallet] = await Promise.all([
    read('src/FullAppShell.jsx'),
    read('src/pages/Wallet.jsx'),
  ]);
  assert.match(shell, /path="\/wallet-app"/);
  assert.match(shell, /data-product-surface="wallet"/);
  assert.match(shell, /data-product-release="phase15f"/);
  assert.match(shell, /const WalletPage = Pages\.Wallet/);
  assert.match(shell, /function WalletStandaloneSurface\(\)/);
  assert.match(shell, /<CrossSurfaceRail current="wallet" compact \/>/);
  assert.match(shell, /WalletStandalonePage \? <Web3Provider><WalletStandalonePage \/><\/Web3Provider> : <PageNotFound \/>/);
  assert.match(wallet, /OFFICIAL WALLET/);
  assert.match(wallet, /ZEVARYQ Wallet/);
  assert.match(wallet, /No custody or transaction execution without explicit wallet confirmation/);
  assert.doesNotMatch(wallet, /data-product-release="phase15f"/);
  assert.doesNotMatch(wallet, /CrossSurfaceRail/);
});

test('Phase 15F publishes the corrected architecture contract', async () => {
  const architecture = await read('src/lib/productArchitecture.js');
  assert.match(architecture, /PRODUCT_ARCHITECTURE_VERSION = '2026\.1'/);
  assert.match(architecture, /CROSS_SURFACE_RELEASE = 'phase15f'/);
  assert.match(architecture, /id: 'portfolio',[\s\S]*route: '\/PortfolioOverview'/);
  assert.match(architecture, /id: 'network',[\s\S]*route: '\/ZEVARYQ'/);
  assert.match(architecture, /id: 'wallet',[\s\S]*route: '\/wallet-app'/);
});

test('Phase 15F browser acceptance covers all aligned surfaces on mobile and desktop', async () => {
  const [browser, workflow] = await Promise.all([
    read('.github/scripts/phase11c3-cross-surface-browser.mjs'),
    read('.github/workflows/phase11c3-cross-surface-acceptance.yml'),
  ]);
  for (const route of ['/Market', '/IntelligenceHub', '/ZEVARYQ', '/PortfolioOverview', '/SecurityHub', '/wallet-app']) {
    assert.ok(browser.includes("path: '" + route + "'"), route);
  }
  assert.match(browser, /PHASE15F_MOBILE_CONTINUITY=PASS/);
  assert.match(browser, /PHASE15F_DESKTOP_CONTINUITY=PASS/);
  assert.match(browser, /width: 390, height: 844/);
  assert.match(browser, /width: 1440, height: 1000/);
  assert.match(browser, /data-product-release="phase15f"/);
  assert.match(browser, /ka_financial_intelligence_onboarding_v2/);
  assert.match(browser, /a\.ka-sidebar-link\[href=/);
  assert.match(browser, /page\.locator\(selector\)\.first\(\)\.click\(\)/);
  assert.match(browser, /horizontal overflow/);
  assert.match(workflow, /phase15f-cross-surface-product-alignment\.test\.mjs/);
  assert.match(workflow, /src\/components\/command\/CrossSurfaceRail\.jsx/);
});

test('Phase 15F remains inside the presentation and navigation safety boundary', async () => {
  const doc = await read('docs/PHASE15F_CROSS_SURFACE_PRODUCT_ALIGNMENT.md');
  for (const phrase of [
    'does not alter market data collection',
    'wallet signing',
    'transaction broadcast',
    'balances',
    'token state',
    'RPC write policy',
    'genesis',
    'validator configuration',
    'DNS',
    'chain state',
  ]) assert.match(doc, new RegExp(phrase, 'i'), phrase);
});

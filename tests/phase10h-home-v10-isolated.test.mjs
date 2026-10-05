import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 10H adds HomeV10 as an isolated data-first surface', async () => {
  const home = await read('src/pages/HomeV10.jsx');
  assert.match(home, /LiveMarketTicker/);
  assert.match(home, /FeaturedMarketAsset/);
  assert.match(home, /MarketPulse/);
  assert.match(home, /TopMovers/);
  assert.match(home, /IntelligenceStream/);
  assert.match(home, /VerifyAnything/);
  assert.match(home, /OnChainNow/);
  assert.match(home, /ZevaryqLiveStrip/);
  assert.doesNotMatch(home, /Production Command Center|production routes/i);
});

test('Phase 10H reuses the existing KriptoAman market data boundary', async () => {
  const hook = await read('src/hooks/useMarketSurface.js');
  assert.match(hook, /useCoinMarkets/);
  assert.match(hook, /kriptoaman-market-db/);
  assert.match(hook, /LIVE/);
  assert.match(hook, /SNAPSHOT/);
  assert.doesNotMatch(hook, /state = ['\"]STALE['\"]/);
  assert.match(hook, /UNAVAILABLE/);
  assert.doesNotMatch(hook, /coingecko|coinmarketcap|cryptocompare/i);
});

test('Phase 10H keeps intelligence deterministic and evidence oriented', async () => {
  const [hook, intelligence, onchain, network] = await Promise.all([
    read('src/hooks/useMarketSurface.js'),
    read('src/components/home-v10/IntelligenceStream.jsx'),
    read('src/components/home-v10/OnChainNow.jsx'),
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
  ]);
  assert.match(hook, /MOMENTUM/);
  assert.match(hook, /VOLUME/);
  assert.match(hook, /BREADTH/);
  assert.match(intelligence, /Live Intelligence/);
  assert.match(onchain, /\/api\/zvq-token-intelligence/);
  assert.match(network, /\/api\/kam\/network-status/);
});


test('Phase 10I keeps featured market data visible when optional media is absent', async () => {
  const [hook, featured] = await Promise.all([
    read('src/hooks/useMarketSurface.js'),
    read('src/components/home-v10/FeaturedMarketAsset.jsx'),
  ]);
  assert.doesNotMatch(hook, /filter\(asset => asset\.image && Array\.isArray\(asset\.sparkline\)/);
  assert.match(featured, /MARKET SNAPSHOT/);
  assert.match(featured, /7D history unavailable/);
  assert.match(featured, /hasTrace/);
  assert.match(featured, /formatCompactUsd\(asset\.volume\)/);
});

test('Phase 10J promotes HomeV10 to production root while retaining isolated preview rollback surface', async () => {
  const [homeV3, shell, app] = await Promise.all([
    read('src/pages/HomeV3.jsx'),
    read('src/FullAppShell.jsx'),
    read('src/App.jsx'),
  ]);
  assert.match(homeV3, /export default function HomeV3/);
  assert.match(homeV3, /MY KRIPTOAMAN/);
  assert.match(shell, /HomeV10/);
  assert.match(shell, /path="\/preview\/home-v10"/);
  assert.match(app, /if \(pathname === '\/'\)/);
  assert.equal(app.includes("import HomeV10 from './pages/HomeV10';"), true);
  assert.match(app, /<HomeV10 \/>/);
  assert.doesNotMatch(app, /<KriptoAmanGlobalLanding \/>/);
  assert.doesNotMatch(app, /pathname === '\/preview\/home-v10'/);
});


test('Phase 10L hardens HomeV10 for global mobile and accessibility readiness', async () => {
  const [home, featured, topMovers, onchain, network, installPrompt, evidence, deviceScript, deviceWorkflow] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/components/home-v10/FeaturedMarketAsset.jsx'),
    read('src/components/home-v10/TopMovers.jsx'),
    read('src/components/home-v10/OnChainNow.jsx'),
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
    read('src/components/pwa/PWAInstallPrompt.jsx'),
    read('.github/workflows/home-v10-preview-evidence.yml'),
    read('.github/scripts/phase7-device-class-browser.mjs'),
    read('.github/workflows/phase7-device-class-visual.yml'),
  ]);

  assert.match(home, /Skip to live market data/);
  assert.match(home, /id="home-v10-content"/);
  assert.match(home, /safe-area-inset-top/);
  assert.match(home, /safe-area-inset-bottom/);
  assert.match(home, /aria-label="Mobile primary navigation"/);
  assert.match(home, /aria-current="page"/);
  assert.match(home, /h-11 w-11/);
  assert.match(home, /role="status"/);
  assert.match(home, /aria-live="polite"/);
  assert.match(home, /Market data status:/);
  assert.match(featured, /prefers-reduced-motion: reduce/);
  assert.match(featured, /aria-pressed=/);
  assert.match(featured, /min-h-11/);
  assert.match(featured, /decoding="async"/);
  assert.match(topMovers, /aria-pressed=/);
  assert.match(topMovers, /min-h-11/);
  assert.match(onchain, /min-h-11/);
  assert.match(network, /role="status"/);
  assert.match(network, /aria-live="polite"/);
  assert.match(network, /Open ZEVARYQ Explorer in a new tab/);
  assert.match(network, /min-h-11/);
  assert.match(installPrompt, /bottom-\[calc\(5\.25rem\+env\(safe-area-inset-bottom,0px\)\)\]/);
  assert.match(evidence, /360,800,compact-mobile/);
  assert.match(evidence, /430,932,large-mobile/);
  assert.match(evidence, /PWAInstallPrompt\.jsx/);
  assert.match(deviceScript, /PHASE7_TARGET/);
  assert.match(deviceScript, /Mobile primary navigation/);
  assert.match(deviceScript, /install CTA overlaps mobile navigation/);
  assert.doesNotMatch(deviceScript, /Live Block Flow|Node Master|data-phase7-visual/);
  assert.match(deviceWorkflow, /src\/pages\/HomeV10\.jsx/);
  assert.match(deviceWorkflow, /kriptoaman\.pages\.dev/);
  assert.match(deviceWorkflow, /Allow production deployment to settle/);
  assert.match(deviceWorkflow, /github\.event_name == 'push'/);
  assert.match(deviceWorkflow, /sleep 60/);
});

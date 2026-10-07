import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 10K locks HomeV10 to the production root and keeps rollback route available', async () => {
  const [app, shell, home] = await Promise.all([
    read('src/App.jsx'),
    read('src/FullAppShell.jsx'),
    read('src/pages/HomeV10.jsx'),
  ]);
  assert.match(app, /if \(pathname === '\/'\)/);
  assert.match(app, /<HomeV10 \/>/);
  assert.match(shell, /path="\/preview\/home-v10"/);
  for (const marker of [
    'LiveMarketTicker',
    'FeaturedMarketAsset',
    'MarketPulse',
    'TopMovers',
    'IntelligenceStream',
    'VerifyAnything',
    'OnChainNow',
    'ZevaryqLiveStrip',
  ]) assert.ok(home.includes(marker), marker);
  assert.doesNotMatch(home, /Production Command Center|Official Launch 2026/i);
});

test('Phase 10K preserves first-party market and ZEVARYQ evidence boundaries', async () => {
  const [market, raw, onchain, network, zevaryqSurface] = await Promise.all([
    read('src/hooks/useMarketSurface.js'),
    read('src/components/home/useCoinMarkets.js'),
    read('src/components/home-v10/OnChainNow.jsx'),
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
    read('src/hooks/useZevaryqSurface.js'),
  ]);
  assert.match(market, /kriptoaman-market-db/);
  assert.match(market, /LIVE/);
  assert.match(market, /SNAPSHOT/);
  assert.doesNotMatch(market, /state = ['"]STALE['"]/);
  assert.match(raw, /\/api\/market-snapshot-page/);
  assert.match(raw, /MARKET_ASSET_LIMIT = 5000/);
  assert.match(raw, /fetchWithTimeout\(\s*`\/api\/market-snapshot-page/);
  assert.doesNotMatch(raw, /fetchWithTimeout\(\s*`https?:\/\//);
  assert.match(zevaryqSurface, /ONCHAIN_ENDPOINT = '\/api\/zvq-token-intelligence'/);
  assert.match(zevaryqSurface, /onChainPayload\?\.status === 'live'/);
  assert.match(zevaryqSurface, /NETWORK_ENDPOINT = '\/api\/kam\/network-status'/);
  assert.match(zevaryqSurface, /networkPayload\?\.live === true/);
  assert.match(zevaryqSurface, /networkPayload\?\.verified === true/);
  assert.match(onchain, /ON-CHAIN EVIDENCE/);
  assert.match(network, /NETWORK PROOF/);
});

test('Phase 10K live browser proof is read-only and enforces production data acceptance', async () => {
  const [script, workflow] = await Promise.all([
    read('scripts/verify-home-v10-production.mjs'),
    read('.github/workflows/home-v10-production-lock.yml'),
  ]);
  for (const marker of [
    'https://kriptoaman.com/',
    '/api/market-snapshot-page',
    '/api/kam/network-status',
    '/api/zvq-token-intelligence',
    'compact-mobile-360',
    'mobile-390',
    'large-mobile-430',
    'tablet-768',
    'desktop-1440',
    'clean-command-center-v1',
    "reducedMotion: 'reduce'",
    'HOME_V10_PRODUCTION_OK',
    'phase15d',
    'data-command-layer',
    'VERIFIED',
    'SYNCED',
    'no uncaught JavaScript errors',
  ]) assert.ok(script.includes(marker), marker);
  assert.match(script, /●\\s\*LIVE/);
  assert.match(script, /scrollWidth <= config\.width \+ 1/);
  assert.doesNotMatch(script, /eth_sendTransaction|eth_sendRawTransaction|personal_|private[_ -]?key|wallet_requestPermissions/i);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /node scripts\/verify-home-v10-production\.mjs/);
  assert.match(workflow, /retention-days: 30/);
  assert.match(workflow, /statuses: write/);
  assert.match(workflow, /kriptoaman\/home-v10-production-visual-proof/);
});


test('Master final keeps data binding truthful, motion calm, and ecosystem routes honest', async () => {
  const [home, stats, hero, ecosystem, proof] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/components/home-v10/CommandStats.jsx'),
    read('src/components/home-v10/CommandCenterHero.jsx'),
    read('src/components/home-v10/EcosystemRail.jsx'),
    read('scripts/verify-home-v10-production.mjs'),
  ]);

  assert.match(home, /data-master-final="clean-command-center-v1"/);
  assert.match(home, /data-animation-polish="calm-reduced-motion-safe-v1"/);

  assert.match(stats, /data-master-kpi-count="4"/);
  assert.match(stats, /data-kpi-source-mode="verified-live-only"/);
  assert.match(stats, /lg:grid-cols-4/);
  assert.doesNotMatch(stats, /label: 'ZVQ market'/);
  assert.doesNotMatch(stats, /label: 'Market breadth'/);

  assert.match(hero, /data-command-orbit="calm"/);
  assert.match(hero, /motion-reduce:animate-none/);
  assert.match(hero, /min-h-11/);

  assert.match(ecosystem, /name: 'ORIVEX'/);
  assert.match(ecosystem, /RWA Platform · Roadmap/);
  assert.match(ecosystem, /data-product-status=\{status \|\| 'unavailable'\}/);
  assert.doesNotMatch(ecosystem, /to: '\/ORIVEX'/);

  for (const marker of ['compact-mobile-360', 'mobile-390', 'large-mobile-430', 'tablet-768', 'desktop-1440']) {
    assert.ok(proof.includes(marker), marker);
  }
  assert.match(proof, /reducedMotion: 'reduce'/);
  assert.match(proof, /orbitAnimationName/);
  assert.match(proof, /kpiCount, 4/);
  assert.match(proof, /orivexRoadmapIsLink/);
});

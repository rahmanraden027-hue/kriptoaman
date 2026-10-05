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
  const [market, raw, onchain, network] = await Promise.all([
    read('src/hooks/useMarketSurface.js'),
    read('src/components/home/useCoinMarkets.js'),
    read('src/components/home-v10/OnChainNow.jsx'),
    read('src/components/home-v10/ZevaryqLiveStrip.jsx'),
  ]);
  assert.match(market, /kriptoaman-market-db/);
  assert.match(market, /LIVE/);
  assert.match(market, /SNAPSHOT/);
  assert.doesNotMatch(market, /state = ['\"]STALE['\"]/);
  assert.match(raw, /\/api\/market-snapshot-page/);
  assert.match(raw, /MARKET_ASSET_LIMIT = 5000/);
  assert.match(raw, /fetchWithTimeout\(\s*`\/api\/market-snapshot-page/);
  assert.doesNotMatch(raw, /fetchWithTimeout\(\s*`https?:\/\//);
  assert.match(onchain, /\/api\/zvq-token-intelligence/);
  assert.match(onchain, /payload\?\.status === 'live'/);
  assert.match(network, /\/api\/kam\/network-status/);
  assert.match(network, /payload\?\.live === true/);
  assert.match(network, /payload\?\.verified === true/);
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
    'mobile-390',
    'desktop-1440',
    'HOME_V10_PRODUCTION_OK',
    'no uncaught JavaScript errors',
  ]) assert.ok(script.includes(marker), marker);
  assert.match(script, /●\\s\*LIVE/);
  assert.match(script, /scrollWidth <= config\.width \+ 1/);
  assert.doesNotMatch(script, /eth_sendTransaction|eth_sendRawTransaction|personal_|private[_ -]?key|wallet_requestPermissions/i);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /node scripts\/verify-home-v10-production\.mjs/);
  assert.match(workflow, /retention-days: 30/);
});

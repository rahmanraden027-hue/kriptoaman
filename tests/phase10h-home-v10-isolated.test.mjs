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
  assert.match(hook, /STALE/);
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
  assert.match(featured, /7D trace not provided in this snapshot/);
  assert.match(featured, /hasTrace/);
  assert.match(featured, /formatCompactUsd\(asset\.volume\)/);
});


test('Phase 10I.1 preserves missing numeric market fields as unavailable instead of zero', async () => {
  const marketHook = await read('src/components/home/useCoinMarkets.js');
  assert.match(marketHook, /finiteNumberOrNull/);
  assert.match(marketHook, /value !== null/);
  assert.match(marketHook, /high24h: finiteNumberOrNull\(coin\?\.high_24h\)/);
  assert.match(marketHook, /low24h: finiteNumberOrNull\(coin\?\.low_24h\)/);
  assert.doesNotMatch(marketHook, /high24h: Number\.isFinite\(Number\(coin\?\.high_24h\)\)/);
});

test('Phase 10I exposes HomeV10 only on an isolated preview route while production root stays unchanged', async () => {
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
  assert.match(app, /<KriptoAmanGlobalLanding \/>/);
  assert.doesNotMatch(app, /pathname === '\/preview\/home-v10'/);
});

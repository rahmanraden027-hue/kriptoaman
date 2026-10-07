import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('asset logo resolver provides one shared fallback chain and keeps planned ZEVARYQ identities fail-closed', async () => {
  const source = await read('src/components/market/AssetLogo.jsx');

  assert.match(source, /COIN_META/);
  assert.match(source, /zevaryq-wallet-premium-icon\.webp/);
  assert.match(source, /PLANNED_ZEVARYQ_SYMBOLS = new Set\(\['ZBTC', 'ZETH'\]\)/);
  assert.doesNotMatch(source, /asset\?\.image|asset\.image|new URL\(/);
  assert.match(source, /COIN_META\[symbol\]\?\.logo/);
  assert.match(source, /coinlore/);
  assert.match(source, /encodeURIComponent\(String\(symbol \|\| ''\)\.toLowerCase\(\)\)/);
  assert.match(source, /assets\.coincap\.io/);
  assert.match(source, /data-asset-logo="unified-v1"/);
  assert.match(source, /data-asset-logo="symbol-badge-fallback"/);
  assert.doesNotMatch(source, /zbtc-v2\.svg|zeth-v2\.svg/);
});

test('homepage market surfaces use the shared asset logo component including heatmap', async () => {
  const [hero, grid, ticker, movers, featured] = await Promise.all([
    read('src/components/home-v10/CommandCenterHero.jsx'),
    read('src/components/home-v10/MarketCommandGrid.jsx'),
    read('src/components/home-v10/LiveMarketTicker.jsx'),
    read('src/components/home-v10/TopMovers.jsx'),
    read('src/components/home-v10/FeaturedMarketAsset.jsx'),
  ]);

  for (const source of [hero, grid, ticker, movers, featured]) {
    assert.match(source, /AssetLogo/);
  }

  const gridUses = [...grid.matchAll(/<AssetLogo\b/g)].length;
  assert.ok(gridUses >= 3, 'MarketCommandGrid should show logos in overview, featured, and heatmap');
  assert.match(grid, /<AssetLogo asset=\{asset\} size=\{18\} \/>/);
  assert.doesNotMatch(grid, /asset\.image \? <img/);
});

test('Market page uses the same resolver instead of a separate logo map', async () => {
  const market = await read('src/pages/Market.jsx');

  assert.match(market, /import AssetLogo from '..\/components\/market\/AssetLogo'/);
  assert.match(market, /<AssetLogo[\s\S]*asset=\{c\}[\s\S]*size=\{40\}/);
  assert.doesNotMatch(market, /const SYMBOL_LOGOS/);
  assert.doesNotMatch(market, /coinImage\(/);
  assert.doesNotMatch(market, /handleCoinImageError/);
});

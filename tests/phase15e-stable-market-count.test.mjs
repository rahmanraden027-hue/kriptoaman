import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 15E captures authoritative market total from page-zero metadata', async () => {
  const hook = await read('src/components/home/useCoinMarkets.js');
  assert.match(hook, /const \[totalAssets, setTotalAssets\] = useState\(null\)/);
  assert.match(hook, /firstPayload\.totalAssets/);
  assert.match(hook, /setTotalAssets\(authoritativeTotal\)/);
  assert.match(hook, /Math\.min\(Math\.trunc\(count\), MARKET_ASSET_LIMIT\)/);
  assert.match(hook, /totalAssets,/);
});

test('Phase 15E persists authoritative total with verified market cache', async () => {
  const hook = await read('src/components/home/useCoinMarkets.js');
  assert.match(hook, /totalAssets: boundedTotalAssets\(authoritativeTotal, data\.length\)/);
  assert.match(hook, /setTotalAssets\(boundedTotalAssets\(cached\.totalAssets, cached\.data\.length\)\)/);
  assert.match(hook, /saveCache\(combined, capturedAt, 'kriptoaman-market-db', authoritativeTotal\)/);
});

test('Phase 15E uses authoritative total instead of hydration progress for Assets Tracked', async () => {
  const [surface, pulse] = await Promise.all([
    read('src/hooks/useMarketSurface.js'),
    read('src/components/home-v10/MarketPulse.jsx'),
  ]);
  assert.match(surface, /const authoritativeTotal = validNumber\(raw\.totalAssets\)/);
  assert.match(surface, /const trackedAssetCount = authoritativeTotal/);
  assert.match(surface, /rawAssetCount: trackedAssetCount/);
  assert.match(pulse, /data-assets-tracked=\{assetCount \|\| undefined\}/);
});

test('Phase 15E production proof compares visible count to first-party page metadata', async () => {
  const proof = await read('scripts/verify-home-v10-production.mjs');
  assert.match(proof, /\[data-assets-tracked\]/);
  assert.match(proof, /payload\?\.totalAssets/);
  assert.match(proof, /Math\.min\(marketMeta, 5000\)/);
  assert.match(proof, /Assets Tracked must match authoritative page metadata/);
  assert.match(proof, /assetsTracked: snapshot\.assetsTracked/);
});

test('Phase 15E remains inside the read-only presentation boundary', async () => {
  const doc = await read('docs/PHASE15E_STABLE_MARKET_ASSET_COUNT.md');
  assert.match(doc, /does not change the market database/i);
  assert.match(doc, /does not change.*ZEVARYQ network/i);
  assert.match(doc, /wallet signing/);
  assert.match(doc, /chain state/);
});

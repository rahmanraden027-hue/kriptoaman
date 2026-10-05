import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 10L.3 aligns root share metadata with the actual official social asset', async () => {
  const html = await read('index.html');
  assert.match(html, /twitter:card" content="summary"/);
  assert.match(html, /og:image:type" content="image\/webp"/);
  assert.match(html, /og:image:width" content="1024"/);
  assert.match(html, /og:image:height" content="1024"/);
  assert.match(html, /og:image:secure_url" content="https:\/\/kriptoaman\.com\/brand\/kriptoaman-mark-premium\.webp"/);
  assert.match(html, /twitter:site" content="@KriptoAman"/);
  assert.match(html, /name="color-scheme" content="dark"/);
});

test('Phase 10L.3 adds stable dimensions and priority hints to HomeV10 market imagery', async () => {
  const [featured, ticker, movers] = await Promise.all([
    read('src/components/home-v10/FeaturedMarketAsset.jsx'),
    read('src/components/home-v10/LiveMarketTicker.jsx'),
    read('src/components/home-v10/TopMovers.jsx'),
  ]);
  assert.match(featured, /width="56"/);
  assert.match(featured, /height="56"/);
  assert.match(featured, /fetchPriority="high"/);
  assert.match(featured, /decoding="async"/);
  assert.match(ticker, /width="16"/);
  assert.match(ticker, /height="16"/);
  assert.match(ticker, /decoding="async"/);
  assert.match(movers, /width="28"/);
  assert.match(movers, /height="28"/);
  assert.match(movers, /decoding="async"/);
});

test('Phase 10L.3 locks a deterministic initial bundle budget into preview evidence', async () => {
  const [script, workflow] = await Promise.all([
    read('scripts/check-home-v10-bundle-budget.mjs'),
    read('.github/workflows/home-v10-preview-evidence.yml'),
  ]);
  assert.match(script, /HOME_V10_BUNDLE_BUDGET=PASS/);
  assert.match(script, /1_600_000/);
  assert.match(script, /550_000/);
  assert.match(script, /650_000/);
  assert.match(script, /bundle-budget\.json/);
  assert.match(workflow, /HomeV10 initial bundle budget/);
  assert.match(workflow, /check-home-v10-bundle-budget\.mjs/);
  assert.match(workflow, /index\.html/);
  assert.match(workflow, /phase10l3-global-readiness\.test\.mjs/);
});

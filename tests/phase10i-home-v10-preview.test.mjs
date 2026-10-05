import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 10I exposes HomeV10 only on an isolated preview route', async () => {
  const shell = await read('src/FullAppShell.jsx');
  assert.match(shell, /HomeV10Preview/);
  assert.match(shell, /\/preview\/home-v10/);
  assert.match(shell, /DashboardPage/);
  assert.doesNotMatch(shell, /path="\/" element={<HomeV10Preview/);
});

test('Phase 10I visual gate captures mobile tablet and desktop evidence', async () => {
  const workflow = await read('.github/workflows/phase10i-home-v10-preview.yml');
  assert.match(workflow, /width: 390, height: 844, label: 'mobile'/);
  assert.match(workflow, /width: 768, height: 1024, label: 'tablet'/);
  assert.match(workflow, /width: 1440, height: 1080, label: 'desktop'/);
  assert.match(workflow, /horizontal overflow/i);
  assert.match(workflow, /WCAG 2 AA scan/);
  assert.match(workflow, /https:\/\/kriptoaman\.com/);
  assert.match(workflow, /page\.route\('\*\*\/api\/\*\*'/);
});

test('Phase 10I preserves unavailable high and low values as null instead of zero', async () => {
  const marketHook = await read('src/components/home/useCoinMarkets.js');
  assert.match(marketHook, /const nullableNumber/);
  assert.match(marketHook, /high24h: nullableNumber\(coin\?\.high_24h\)/);
  assert.match(marketHook, /low24h: nullableNumber\(coin\?\.low_24h\)/);
});

test('Phase 10I makes the market ticker visibly live without timer-driven rerenders', async () => {
  const ticker = await read('src/components/home-v10/LiveMarketTicker.jsx');
  assert.match(ticker, /ka-v10-market-ticker/);
  assert.match(ticker, /prefers-reduced-motion/);
  assert.match(ticker, /42s linear infinite/);
  assert.doesNotMatch(ticker, /setInterval|requestAnimationFrame/);
});

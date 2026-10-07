import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Production Visual Master locks the globe as KriptoAman signature identity', async () => {
  const [home, hero] = await Promise.all([
    read('src/pages/HomeV10.jsx'),
    read('src/components/home-v10/CommandCenterHero.jsx'),
  ]);

  assert.match(home, /data-production-visual-master="v1"/);
  assert.match(hero, /data-visual-master-globe="signature-v1"/);
  assert.match(hero, /max-w-\[600px\]/);
  assert.match(hero, /xl:max-w-\[680px\]/);
  assert.match(hero, /xl:grid-cols-\[\.72fr_1\.48fr_\.8fr\]/);
  assert.match(hero, /Visual topology · verified core data only/);
  assert.match(hero, /networkSourceMode === 'FIRST_PARTY_CORROBORATED'/);
});

test('Production Visual Master hides incomplete featured-market evidence instead of rendering false zeros', async () => {
  const grid = await read('src/components/home-v10/MarketCommandGrid.jsx');

  assert.match(grid, /positiveFinite/);
  assert.match(grid, /verifiedPriceSeries/);
  assert.match(grid, /featuredSeriesVerified/);
  assert.match(grid, /data-price-path-state=/);
  assert.match(grid, /Verified price path unavailable/);
  assert.match(grid, /Chart disembunyikan sampai seri harga positif yang terverifikasi tersedia/);
  assert.match(grid, /positiveFinite\(featured\.high24h\)/);
  assert.match(grid, /positiveFinite\(featured\.low24h\)/);
  assert.doesNotMatch(grid, /<span className="text-slate-400">High 24H<\/span><b[^>]*>\{formatPrice\(featured\.high24h\)\}/);
});

test('Production Visual Master labels unavailable pending-pool telemetry honestly', async () => {
  const pulse = await read('src/components/home-v10/NetworkPulse.jsx');

  assert.match(pulse, /data-pending-pool-telemetry="not-exposed"/);
  assert.match(pulse, /Pending-pool telemetry/);
  assert.match(pulse, />NOT EXPOSED</);
  assert.doesNotMatch(pulse, />UNAVAILABLE<\/b>/);
  assert.match(pulse, /no synthetic transaction counts/);
});

test('Production Visual Master keeps the install control out of the way during active mobile scrolling', async () => {
  const prompt = await read('src/components/pwa/PWAInstallPrompt.jsx');

  assert.match(prompt, /useRef/);
  assert.match(prompt, /scrollActive/);
  assert.match(prompt, /setTimeout\(\(\) => setScrollActive\(false\), 650\)/);
  assert.match(prompt, /pointer-events-none translate-x-2 opacity-0/);
  assert.match(prompt, /bottom-\[calc\(6\.75rem\+env\(safe-area-inset-bottom,0px\)\)\]/);
});

test('Production Visual Master remains presentation-only', async () => {
  const source = [
    await read('src/pages/HomeV10.jsx'),
    await read('src/components/home-v10/CommandCenterHero.jsx'),
    await read('src/components/home-v10/MarketCommandGrid.jsx'),
    await read('src/components/home-v10/NetworkPulse.jsx'),
    await read('src/components/pwa/PWAInstallPrompt.jsx'),
  ].join('\n');

  assert.doesNotMatch(source, /eth_sendRawTransaction|eth_sendTransaction|personal_|private.?key|validator.?key|genesis/i);
});

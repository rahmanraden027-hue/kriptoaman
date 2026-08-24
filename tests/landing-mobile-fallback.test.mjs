import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public landing has a responsive CSS safety net for mobile rendering', async () => {
  const styles = await read('src/components/landing/GlobalLandingStyles.jsx');
  assert.match(styles, /\.ka-landing header nav\{display:none;/);
  assert.match(styles, /@media \(max-width:1023px\)/);
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(styles, /flex-direction:column/);
  assert.match(styles, /#beranda \.ka-sec-title/);
  assert.match(styles, /header \.ka-btn-primary\{display:inline-flex/);
});

test('hero network, center logo and coin badges remain positioned without utility CSS', async () => {
  const [styles, hero] = await Promise.all([
    read('src/components/landing/GlobalLandingStyles.jsx'),
    read('src/components/landing/GLandingHero.jsx'),
  ]);
  assert.match(hero, /ka-hero-visual/);
  assert.match(hero, /ka-hero-network/);
  assert.match(hero, /ka-hero-center/);
  assert.match(hero, /ka-hero-logo/);
  assert.match(hero, /ka-coin-btc/);
  assert.match(hero, /ka-coin-trx/);
  assert.match(styles, /\.ka-hero-network\{position:absolute;inset:0;width:100%;height:100%/);
  assert.match(styles, /\.ka-hero-center\{position:absolute;inset:0;display:flex/);
  assert.match(styles, /\.ka-coin-badge\{position:absolute!important;width:58px!important;height:58px!important/);
  assert.match(styles, /\.ka-coin-btc\{top:6px;left:4px;/);
  assert.match(styles, /\.ka-coin-trx\{bottom:18px;right:6px;/);
});

test('desktop landing restores navigation and two-column hero', async () => {
  const styles = await read('src/components/landing/GlobalLandingStyles.jsx');
  assert.match(styles, /@media \(min-width:1024px\)/);
  assert.match(styles, /header nav\{display:flex/);
  assert.match(styles, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
});

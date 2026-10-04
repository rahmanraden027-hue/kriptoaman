import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('physical-device install prompt collapses instead of covering mobile content', async () => {
  const source = await read('src/components/pwa/PWAInstallPrompt.jsx');
  assert.match(source, /const isPublicRoot = pathname === '\/'/);
  assert.match(source, /isPublicRoot \? 'bottom-\[calc\(\.75rem\+env\(safe-area-inset-bottom,0px\)\)\] right-3'/);
  assert.match(source, /lg:not-sr-only/);
  assert.match(source, /lg:w-auto lg:gap-2 lg:px-4/);
  assert.match(source, /className="flex min-h-11 min-w-10/);
});

test('physical-device landing forces readable hero metrics and institutional cards', async () => {
  const styles = await read('src/components/landing/GlobalLandingStyles.jsx');
  assert.match(styles, /\.ka-institutional-grid\{grid-template-columns:1fr!important\}/);
  assert.match(styles, /\.ka-console-metrics\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important\}/);
  assert.match(styles, /\.ka-footer-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(styles, /\.ka-command-hero \.ka-net-line\{animation-duration:45s\}/);
});

test('institutional and footer expose phase 6 mobile hooks and production UI label', async () => {
  const [institutional, footer] = await Promise.all([
    read('src/components/landing/GLandingInstitutional.jsx'),
    read('src/components/landing/GLandingFooter.jsx'),
  ]);
  assert.match(institutional, /ka-institutional-grid/);
  assert.match(institutional, /ka-institutional-card/);
  assert.match(footer, /ka-footer-grid/);
  assert.match(footer, /Production UI 1\.0/);
});


test('above-the-fold premium mark is preloaded before React hydration', async () => {
  const html = await read('index.html');
  assert.match(html, /rel="preload" as="image" href="\/brand\/kriptoaman-mark-premium\.webp" type="image\/webp" fetchpriority="high"/);
});

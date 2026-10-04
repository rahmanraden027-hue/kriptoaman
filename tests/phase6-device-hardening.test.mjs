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

test('public root retains the lightweight language provider required by landing navigation', async () => {
  const app = await read('src/App.jsx');
  assert.equal(app.includes("import { LanguageProvider } from '@/lib/LanguageContext';"), true);
  assert.equal(app.includes('<LanguageProvider>'), true);
  assert.equal(app.includes('<KriptoAmanGlobalLanding />'), true);
  assert.equal(app.includes('</LanguageProvider>'), true);
});

test('mobile critical path does not preload the below-fold premium mark', async () => {
  const [html, header, hero, console, styles] = await Promise.all([
    read('index.html'),
    read('src/components/landing/GLandingHeader.jsx'),
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingHeroConsole.jsx'),
    read('src/components/landing/GlobalLandingStyles.jsx'),
  ]);
  assert.equal(html.includes('rel="preload" as="image" href="/brand/kriptoaman-mark-premium.webp"'), false);
  assert.equal(html.includes('\\n    <meta name="theme-color"'), false);
  assert.equal(header.includes('src="/icons/kriptoaman-32.png"'), true);
  assert.equal(hero.includes("const GLandingHeroConsole = lazy(() => import('@/components/landing/GLandingHeroConsole'))"), true);
  assert.equal(console.includes('src="/icons/kriptoaman-192.png" loading="lazy" fetchPriority="low" decoding="async"'), true);
  assert.equal(styles.includes('#beranda .ka-hero-console{content-visibility:auto'), true);
});

test('mobile hero console is deferred until user intent or idle while desktop remains immediate', async () => {
  const [landing, hero, console] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingHero.jsx'),
    read('src/components/landing/GLandingHeroConsole.jsx'),
  ]);
  assert.equal(landing.includes("window.matchMedia('(min-width: 768px)').matches"), true);
  assert.equal(landing.includes('window.setTimeout(activate, 3000)'), true);
  assert.equal(landing.includes('window.scrollY > 180'), true);
  assert.equal(landing.includes('<GLandingHero stats={stats} visualReady={heroVisualReady} />'), true);
  assert.equal(hero.includes("lazy(() => import('@/components/landing/GLandingHeroConsole'))"), true);
  assert.equal(hero.includes('HeroConsolePlaceholder'), true);
  assert.equal(hero.includes('COIN_META'), false);
  assert.equal(hero.includes('KriptoAmanLogo'), false);
  assert.equal(console.includes('COIN_META'), true);
  assert.equal(console.includes('KriptoAmanLogo'), true);
});

test('below-fold production modules are code-split without breaking anchor access', async () => {
  const [landing, deferred] = await Promise.all([
    read('src/pages/KriptoAmanGlobalLanding.jsx'),
    read('src/components/landing/GLandingDeferredContent.jsx'),
  ]);
  assert.equal(landing.includes("const GLandingDeferredContent = lazy(() => import('@/components/landing/GLandingDeferredContent'))"), true);
  assert.equal(landing.includes('import LiveBlockFlow3D from'), false);
  assert.equal(landing.includes("const deferredDelayMs = window.matchMedia('(min-width: 768px)').matches ? 1200 : 3500"), true);
  assert.equal(landing.includes('window.setTimeout(activate, deferredDelayMs)'), true);
  assert.equal(landing.includes("window.addEventListener('hashchange', onHashChange)"), true);
  assert.equal(landing.includes("scrollIntoView({ block: 'start' })"), true);
  assert.equal(deferred.includes('LiveBlockFlow3D'), true);
  assert.equal(deferred.includes('LandingMarketPulse'), true);
  assert.equal(deferred.includes('GLandingBody'), true);
  assert.equal(deferred.includes('GLandingInstitutional'), true);
});

test('public root avoids external Google Fonts on the critical render path', async () => {
  const css = await read('src/index.css');
  assert.equal(css.includes('fonts.googleapis.com'), false);
  assert.match(css, /system-ui/);
});

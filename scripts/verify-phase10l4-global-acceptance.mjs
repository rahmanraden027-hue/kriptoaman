// Phase 10L.4 read-only global production acceptance.
// Verifies crawler-visible metadata, five viewport classes, first-party live data,
// accessibility essentials, and layout stability without credentials or mutations.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_CORE;
const chromePath = process.env.KA_CHROME;
if (!modulePath || !chromePath) throw new Error('PLAYWRIGHT_CORE and KA_CHROME are required');

const { chromium } = await import(pathToFileURL(modulePath).href);
const target = String(process.env.PHASE10L4_TARGET || 'https://kriptoaman.com/').replace(/\/+$/, '/') ;
const origin = new URL(target).origin;
const evidenceDir = resolve(process.env.PHASE10L4_EVIDENCE_DIR || 'phase10l4-global-evidence');
await mkdir(evidenceDir, { recursive: true });

const viewports = [
  { name: 'compact-mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'large-mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];

const requiredApis = [
  '/api/market-snapshot-page',
  '/api/kam/network-status',
  '/api/zvq-token-intelligence',
];

const staticRoot = await fetch(target, { redirect: 'follow', headers: { 'User-Agent': 'KriptoAman-Phase10L4-Acceptance/1.0' } });
assert.equal(staticRoot.status, 200, 'production root must return HTTP 200 to crawlers');
const staticHtml = await staticRoot.text();
for (const marker of [
  '<link rel="canonical" href="https://kriptoaman.com/"',
  'name="robots" content="index, follow, max-image-preview:large"',
  'property="og:image" content="https://kriptoaman.com/brand/kriptoaman-mark-premium.webp"',
  'property="og:image:type" content="image/webp"',
  'property="og:image:width" content="1024"',
  'property="og:image:height" content="1024"',
  'name="twitter:card" content="summary"',
  'name="twitter:site" content="@KriptoAman"',
]) assert.ok(staticHtml.includes(marker), 'crawler metadata missing: ' + marker);

const robotsResponse = await fetch(origin + '/robots.txt', { redirect: 'follow' });
assert.equal(robotsResponse.status, 200, 'robots.txt must return HTTP 200');
const robots = await robotsResponse.text();
assert.match(robots, /User-agent:\s*\*/i);
assert.match(robots, /Allow:\s*\//i);
assert.match(robots, /Disallow:\s*\/api\//i);
assert.match(robots, /^Sitemap:\s*https:\/\/kriptoaman\.com\/sitemap\.xml\s*$/im);

const sitemapResponse = await fetch(origin + '/sitemap.xml', { redirect: 'follow' });
assert.equal(sitemapResponse.status, 200, 'sitemap.xml must return HTTP 200');
const sitemap = await sitemapResponse.text();
assert.ok(sitemap.includes('<loc>https://kriptoaman.com/</loc>'), 'sitemap must include production root');
assert.ok(sitemap.includes('<loc>https://kriptoaman.com/en</loc>'), 'sitemap must include English public route');

const shareResponse = await fetch(origin + '/brand/kriptoaman-mark-premium.webp', { redirect: 'follow' });
assert.equal(shareResponse.status, 200, 'share image must return HTTP 200');
assert.match(shareResponse.headers.get('content-type') || '', /image\/webp/i, 'share image content type');
const shareBytes = (await shareResponse.arrayBuffer()).byteLength;
assert.ok(shareBytes >= 50_000, 'share image must be a substantive production asset');

let browser;

try {
  browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  for (const config of viewports) {
    const context = await browser.newContext({
      viewport: { width: config.width, height: config.height },
      deviceScaleFactor: 1,
      isMobile: config.width < 768,
      hasTouch: config.width < 768,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });

    await context.addInitScript(() => {
      window.__kaVitals = { cls: 0, lcp: 0 };
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__kaVitals.cls += entry.value || 0;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
      try {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) window.__kaVitals.lcp = last.startTime || 0;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
    });

    const page = await context.newPage();
    const pageErrors = [];
    const requestFailures = [];
    const apiResponses = [];

    page.on('pageerror', error => pageErrors.push(String(error)));
    page.on('requestfailed', request => {
      if (requiredApis.some(path => request.url().includes(path))) {
        requestFailures.push({ url: request.url(), failure: request.failure()?.errorText || 'unknown' });
      }
    });
    page.on('response', response => {
      if (requiredApis.some(path => response.url().includes(path))) {
        apiResponses.push({ url: response.url(), status: response.status() });
      }
    });

    try {
      const url = target + (target.includes('?') ? '&' : '?') + 'phase10l4=' + encodeURIComponent(config.name);
      const navigation = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      assert.equal(navigation?.status(), 200, config.name + ' root HTTP status');

      await page.locator('#home-v10-content').waitFor({ state: 'attached', timeout: 30_000 });
      await page.locator('section[aria-label="Market ticker"]').waitFor({ state: 'attached', timeout: 30_000 });

      await page.waitForFunction(() => {
        const ticker = document.querySelector('section[aria-label="Market ticker"]');
        const sections = [...document.querySelectorAll('section')];
        const onChain = sections.find(node => node.textContent?.includes('ON-CHAIN NOW'));
        const zvq = document.querySelector('section[data-zvq-chain-id="22028"]');
        return Boolean(
          ticker && /●\s*(SNAPSHOT|DELAYED)/.test(ticker.textContent || '') &&
          onChain && /#\s*[\d,]+/.test(onChain.textContent || '') &&
          zvq && /●\s*VERIFIED/.test(zvq.textContent || '') && /#[\d,]+/.test(zvq.textContent || '')
        );
      }, null, { timeout: 45_000, polling: 500 });

      await page.waitForTimeout(1200);

      const snapshot = await page.evaluate(() => {
        const meta = (selector) => document.head.querySelector(selector)?.getAttribute('content') || '';
        const link = (selector) => document.head.querySelector(selector)?.getAttribute('href') || '';
        const ticker = document.querySelector('section[aria-label="Market ticker"]');
        const sections = [...document.querySelectorAll('section')];
        const onChain = sections.find(node => node.textContent?.includes('ON-CHAIN NOW'));
        const zvq = document.querySelector('section[data-zvq-chain-id="22028"]');
        const search = [...document.querySelectorAll('header a[href="/Market"][aria-label]')].find(node => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        const searchRect = search?.getBoundingClientRect();
        const mobileNav = document.querySelector('nav[aria-label="Mobile primary navigation"]');
        const navStyle = mobileNav ? getComputedStyle(mobileNav) : null;
        const skip = document.querySelector('a[href="#home-v10-content"]');
        const nav = performance.getEntriesByType('navigation')[0];
        const topMoverHeading = [...document.querySelectorAll('h2')].find(node => node.textContent?.trim() === 'Top Movers');
        const topMoverButtons = topMoverHeading?.parentElement?.querySelectorAll('button') || [];
        const minMoverTarget = [...topMoverButtons].reduce((min, button) => Math.min(min, button.getBoundingClientRect().height), Infinity);
        return {
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          title: document.title,
          lang: document.documentElement.lang,
          description: meta('meta[name="description"]'),
          robots: meta('meta[name="robots"]'),
          ogImage: meta('meta[property="og:image"]'),
          ogImageType: meta('meta[property="og:image:type"]'),
          ogImageWidth: meta('meta[property="og:image:width"]'),
          ogImageHeight: meta('meta[property="og:image:height"]'),
          twitterCard: meta('meta[name="twitter:card"]'),
          twitterSite: meta('meta[name="twitter:site"]'),
          canonical: link('link[rel="canonical"]'),
          hreflangId: link('link[rel="alternate"][hreflang="id"]'),
          hreflangEn: link('link[rel="alternate"][hreflang="en"]'),
          hreflangDefault: link('link[rel="alternate"][hreflang="x-default"]'),
          searchWidth: searchRect?.width || 0,
          searchHeight: searchRect?.height || 0,
          mobileNavDisplay: navStyle?.display || 'missing',
          skipPresent: Boolean(skip),
          politeStatusCount: document.querySelectorAll('[role="status"][aria-live="polite"]').length,
          tickerText: ticker?.textContent?.replace(/\s+/g, ' ').trim() || '',
          onChainText: onChain?.textContent?.replace(/\s+/g, ' ').trim() || '',
          zvqText: zvq?.textContent?.replace(/\s+/g, ' ').trim() || '',
          minMoverTarget: Number.isFinite(minMoverTarget) ? minMoverTarget : null,
          cls: Number(window.__kaVitals?.cls || 0),
          lcp: Number(window.__kaVitals?.lcp || 0),
          domContentLoadedMs: Number(nav?.domContentLoadedEventEnd || 0),
          oldPromoCopyPresent: /Production Command Center|Official Launch 2026/i.test(document.body.innerText),
        };
      });

      assert.equal(snapshot.width, config.width, config.name + ' viewport width');
      assert.ok(snapshot.scrollWidth <= config.width + 1, config.name + ' must not overflow horizontally');
      assert.equal(snapshot.title, 'KriptoAman — Verified Data. Real Intelligence.', config.name + ' title');
      assert.equal(snapshot.lang, 'id', config.name + ' language');
      assert.match(snapshot.robots, /index,\s*follow/i, config.name + ' robots');
      assert.equal(snapshot.canonical, 'https://kriptoaman.com/', config.name + ' canonical');
      assert.equal(snapshot.hreflangId, 'https://kriptoaman.com/', config.name + ' id alternate');
      assert.equal(snapshot.hreflangEn, 'https://kriptoaman.com/en', config.name + ' en alternate');
      assert.equal(snapshot.hreflangDefault, 'https://kriptoaman.com/', config.name + ' x-default alternate');
      assert.equal(snapshot.ogImage, 'https://kriptoaman.com/brand/kriptoaman-mark-premium.webp', config.name + ' OG image');
      assert.equal(snapshot.ogImageType, 'image/webp', config.name + ' OG image type');
      assert.equal(snapshot.ogImageWidth, '1024', config.name + ' OG width');
      assert.equal(snapshot.ogImageHeight, '1024', config.name + ' OG height');
      assert.equal(snapshot.twitterCard, 'summary', config.name + ' Twitter card');
      assert.equal(snapshot.twitterSite, '@KriptoAman', config.name + ' Twitter site');
      assert.ok(snapshot.searchWidth >= 44 && snapshot.searchHeight >= 44, config.name + ' search target >=44px');
      assert.equal(snapshot.skipPresent, true, config.name + ' skip link');
      assert.ok(snapshot.politeStatusCount >= 2, config.name + ' polite status surfaces');
      if (config.width < 768) assert.notEqual(snapshot.mobileNavDisplay, 'none', config.name + ' mobile nav visible');
      else assert.equal(snapshot.mobileNavDisplay, 'none', config.name + ' mobile nav hidden at tablet/desktop');
      if (snapshot.minMoverTarget !== null) assert.ok(snapshot.minMoverTarget >= 44, config.name + ' mover tabs >=44px');
      assert.ok(snapshot.cls <= 0.15, config.name + ' CLS must stay <= 0.15');
      assert.equal(snapshot.oldPromoCopyPresent, false, config.name + ' old promo copy absent');
      assert.match(snapshot.tickerText, /●\s*(SNAPSHOT|DELAYED)/, config.name + ' market snapshot truth');
      assert.doesNotMatch(snapshot.tickerText, /●\s*LIVE/, config.name + ' snapshot-backed market must not claim LIVE');
      assert.match(snapshot.onChainText, /#\s*[\d,]+/, config.name + ' on-chain block');
      assert.match(snapshot.zvqText, /●\s*VERIFIED/, config.name + ' ZEVARYQ VERIFIED');

      const onChainBlock = Number(snapshot.onChainText.match(/#\s*([\d,]+)/)?.[1]?.replace(/,/g, ''));
      const networkBlock = Number(snapshot.zvqText.match(/#\s*([\d,]+)/)?.[1]?.replace(/,/g, ''));
      assert.ok(Number.isSafeInteger(onChainBlock) && onChainBlock > 0, config.name + ' on-chain block numeric');
      assert.ok(Number.isSafeInteger(networkBlock) && networkBlock > 0, config.name + ' network block numeric');
      assert.ok(Math.abs(onChainBlock - networkBlock) <= 25, config.name + ' chain surfaces within 25 blocks');

      assert.deepEqual(pageErrors, [], config.name + ' no uncaught JavaScript errors');
      assert.deepEqual(requestFailures, [], config.name + ' required API network failures');
      for (const path of requiredApis) {
        const matching = apiResponses.filter(item => item.url.includes(path));
        assert.ok(matching.some(item => item.status >= 200 && item.status < 300), config.name + ' required API 2xx: ' + path);
      }

      await page.screenshot({
        path: join(evidenceDir, config.name + '.png'),
        fullPage: true,
        animations: 'disabled',
      });

      console.log('PHASE10L4_VIEWPORT_PASS ' + JSON.stringify({
        viewport: config.name,
        cls: snapshot.cls,
        lcp: snapshot.lcp,
        dcl: snapshot.domContentLoadedMs,
        onChain: onChainBlock,
        network: networkBlock,
      }));
    } catch (error) {
      await page.screenshot({
        path: join(evidenceDir, config.name + '-failure.png'),
        fullPage: true,
        animations: 'disabled',
      }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  if (browser) await browser.close();
}

await writeFile(join(evidenceDir, 'phase10l4-pass.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  scope: 'Phase 10L.4 final global read-only production acceptance',
  result: 'PASS',
  viewportClasses: viewports.map(({ name, width, height }) => ({ name, width, height })),
}, null, 2));

console.log('PHASE10L4_GLOBAL_ACCEPTANCE=PASS');

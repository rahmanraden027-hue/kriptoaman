// Phase 10K read-only production browser acceptance for KriptoAman HomeV10.
// Verifies the live production root without credentials, wallet signing, writes, deployments,
// transactions, or chain mutations.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_CORE;
const chromePath = process.env.KA_CHROME;
if (!modulePath || !chromePath) throw Error('PLAYWRIGHT_CORE and KA_CHROME are required');

const { chromium } = await import(pathToFileURL(modulePath).href);
const evidenceDir = resolve(process.env.HOME_V10_PRODUCTION_EVIDENCE_DIR || 'home-v10-production-proof');
await mkdir(evidenceDir, { recursive: true });

const runId = String(process.env.GITHUB_RUN_ID || 'manual').replace(/[^0-9a-z_-]/gi, '');
const url = 'https://kriptoaman.com/?phase10k_production_lock=' + runId;
const cases = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];
const requiredApis = [
  '/api/market-snapshot-page',
  '/api/kam/network-status',
  '/api/zvq-token-intelligence',
];

let browser;
const report = [];

try {
  browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  for (const config of cases) {
    const context = await browser.newContext({
      viewport: { width: config.width, height: config.height },
      deviceScaleFactor: 1,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const pageErrors = [];
    const requestFailures = [];
    const apiResponses = [];

    page.on('pageerror', error => pageErrors.push(String(error)));
    page.on('requestfailed', request => {
      if (requiredApis.some(path => request.url().includes(path))) {
        requestFailures.push({
          url: request.url(),
          failure: request.failure()?.errorText || 'unknown',
        });
      }
    });
    page.on('response', response => {
      if (requiredApis.some(path => response.url().includes(path))) {
        apiResponses.push({ url: response.url(), status: response.status() });
      }
    });

    try {
      const navigation = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert.equal(navigation?.status(), 200, 'production root must return HTTP 200');

      await page.waitForFunction(() => {
        const ticker = document.querySelector('section[aria-label="Live market ticker"]');
        const verify = document.querySelector('#verify');
        const sections = [...document.querySelectorAll('section')];
        const onChain = sections.find(node => node.querySelector(':scope > div > div > p')?.textContent?.trim() === 'ON-CHAIN NOW');
        const zvq = sections.find(node => node.querySelector(':scope > b')?.textContent?.trim() === 'ZEVARYQ');
        return Boolean(
          ticker
          && /●\s*LIVE/.test(ticker.textContent || '')
          && verify
          && onChain
          && /#\s*[\d,]+/.test(onChain.textContent || '')
          && zvq
          && /●\s*LIVE/.test(zvq.textContent || '')
          && /#[\d,]+/.test(zvq.textContent || '')
        );
      }, null, { timeout: 45000, polling: 500 });

      const snapshot = await page.evaluate(() => {
        const root = document.documentElement;
        const ticker = document.querySelector('section[aria-label="Live market ticker"]');
        const sections = [...document.querySelectorAll('section')];
        const onChain = sections.find(node => node.querySelector(':scope > div > div > p')?.textContent?.trim() === 'ON-CHAIN NOW');
        const zvq = sections.find(node => node.querySelector(':scope > b')?.textContent?.trim() === 'ZEVARYQ');
        const verify = document.querySelector('#verify');
        const tickerSymbols = ticker
          ? [...ticker.querySelectorAll('b')].map(node => node.textContent?.trim()).filter(Boolean)
          : [];
        return {
          viewport: innerWidth,
          scrollWidth: root.scrollWidth,
          title: document.title,
          tickerText: ticker?.textContent?.replace(/\s+/g, ' ').trim() || '',
          tickerSymbols,
          verifyReady: Boolean(verify?.querySelector('input') && verify?.querySelector('button[type="submit"]')),
          onChainText: onChain?.textContent?.replace(/\s+/g, ' ').trim() || '',
          zvqText: zvq?.textContent?.replace(/\s+/g, ' ').trim() || '',
          oldPromoCopyPresent: /Production Command Center|Official Launch 2026/i.test(document.body.innerText),
        };
      });

      assert.equal(snapshot.viewport, config.width, 'viewport width');
      assert.ok(snapshot.scrollWidth <= config.width + 1, 'no horizontal overflow at ' + config.width + 'px');
      assert.match(snapshot.tickerText, /●\s*LIVE/, 'market ticker must be LIVE');
      assert.ok(snapshot.tickerSymbols.length >= 5, 'market ticker must display real assets');
      assert.equal(snapshot.verifyReady, true, 'Verify Anything input and submit must be available');
      assert.match(snapshot.onChainText, /#\s*[\d,]+/, 'On-Chain Now must display a real block');
      const onChainBlock = Number(snapshot.onChainText.match(/#\s*([\d,]+)/)?.[1]?.replace(/,/g, ''));
      const networkBlock = Number(snapshot.zvqText.match(/#\s*([\d,]+)/)?.[1]?.replace(/,/g, ''));
      assert.ok(Number.isSafeInteger(onChainBlock) && onChainBlock > 0, 'On-Chain block must be numeric');
      assert.ok(Number.isSafeInteger(networkBlock) && networkBlock > 0, 'ZEVARYQ network block must be numeric');
      assert.ok(Math.abs(onChainBlock - networkBlock) <= 25, 'first-party chain surfaces must remain within 25 blocks');
      assert.match(snapshot.zvqText, /●\s*LIVE/, 'ZEVARYQ strip must be LIVE');
      assert.match(snapshot.zvqText, /#[\d,]+/, 'ZEVARYQ strip must display a real block number');
      assert.equal(snapshot.oldPromoCopyPresent, false, 'production root must stay data-first, not launch-promo copy');
      assert.deepEqual(pageErrors, [], 'no uncaught JavaScript errors');
      assert.deepEqual(requestFailures, [], 'required production APIs must not fail at network layer');

      for (const path of requiredApis) {
        const matching = apiResponses.filter(item => item.url.includes(path));
        assert.ok(matching.length >= 1, 'required API was not observed: ' + path);
        assert.ok(matching.some(item => item.status >= 200 && item.status < 300), 'required API did not return 2xx: ' + path);
      }

      await page.screenshot({
        path: join(evidenceDir, config.name + '.png'),
        fullPage: true,
        animations: 'disabled',
      });

      const result = {
        viewport: config.name,
        result: 'PASS',
        snapshot,
        apiResponses,
        requestFailures,
        pageErrors,
      };
      report.push(result);
      console.log('HOME_V10_PRODUCTION_OK ' + JSON.stringify({
        viewport: config.name,
        ticker: snapshot.tickerSymbols.slice(0, 8),
        onChain: snapshot.onChainText.match(/#\s*[\d,]+/)?.[0] || null,
        zvq: snapshot.zvqText.match(/#[\d,]+/)?.[0] || null,
        jsErrors: pageErrors.length,
      }));
    } catch (error) {
      await page.screenshot({
        path: join(evidenceDir, config.name + '-failure.png'),
        fullPage: true,
        animations: 'disabled',
      }).catch(() => {});
      report.push({
        viewport: config.name,
        result: 'FAIL',
        error: String(error),
        apiResponses,
        requestFailures,
        pageErrors,
        observed: await page.evaluate(() => ({
          body: document.body.innerText.slice(0, 1800),
          ticker: document.querySelector('section[aria-label="Live market ticker"]')?.textContent,
        })).catch(() => null),
      });
      console.error('HOME_V10_PRODUCTION_FAIL ' + JSON.stringify(report.at(-1)));
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await writeFile(
    join(evidenceDir, 'proof.json'),
    JSON.stringify({
      checkedAt: new Date().toISOString(),
      url,
      scope: 'read-only KriptoAman HomeV10 production lock',
      report,
    }, null, 2),
  );
  if (browser) await browser.close();
}

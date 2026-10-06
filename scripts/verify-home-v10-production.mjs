// Phase 16D read-only post-merge production browser acceptance for KriptoAman HomeV10.
// Verifies the live Phase 16C production root without credentials, wallet signing, writes,
// transactions, or chain mutations. Deployment propagation is retried but truth checks remain fail-closed.
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
const url = 'https://kriptoaman.com/?phase16d_live_lock=' + runId;
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

const PHASE16C_VISUAL_MARKER = 'phase16c-final-command-center-v1';

async function waitForLiveDeployment(page, resetEvidence) {
  let lastStatus = null;
  let lastBody = '';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    resetEvidence();
    const attemptUrl = url + '&attempt=' + attempt;
    const navigation = await page.goto(attemptUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
    lastStatus = navigation?.status() ?? null;

    if (lastStatus === 200) {
      try {
        await page.waitForFunction(
          marker => Boolean(
            document.querySelector('main[data-visual-integration="' + marker + '"]')
            && document.querySelector('[data-phase16c-command-center="true"]')
            && /KRIPTOAMAN/i.test(document.body.innerText || '')
          ),
          PHASE16C_VISUAL_MARKER,
          { timeout: 15000, polling: 500 },
        );
        return;
      } catch {
        lastBody = await page.evaluate(() => document.body.innerText.slice(0, 600)).catch(() => '');
      }
    }

    if (attempt < 3) await page.waitForTimeout(15000);
  }

  throw new Error(
    'Phase 16C production deployment not ready after 3 attempts; '
    + 'last HTTP=' + String(lastStatus)
    + '; body=' + JSON.stringify(lastBody),
  );
}

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
      await waitForLiveDeployment(page, () => {
        pageErrors.length = 0;
        requestFailures.length = 0;
        apiResponses.length = 0;
      });

      await page.waitForFunction(() => {
        const ticker = document.querySelector('section[aria-label="Live market ticker"]');
        const verify = document.querySelector('#verify');
        const networkLayer = document.querySelector('[data-command-layer="network"]');
        const networkSections = networkLayer ? [...networkLayer.querySelectorAll(':scope > section')] : [];
        const onChain = networkSections.find(node => /ON-CHAIN NOW/.test(node.textContent || ''));
        const zvq = networkSections.find(node => /ZEVARYQ/.test(node.textContent || '') && /VERIFIED/.test(node.textContent || ''));
        return Boolean(
          ticker
          && /●\s*LIVE/.test(ticker.textContent || '')
          && verify
          && onChain
          && /ON-CHAIN EVIDENCE/.test(onChain.textContent || '')
          && /#\s*[\d,]+/.test(onChain.textContent || '')
          && zvq
          && /●\s*VERIFIED/.test(zvq.textContent || '')
          && /SYNCED/.test(zvq.textContent || '')
          && /#[\d,]+/.test(zvq.textContent || '')
          && document.querySelector('main[data-command-release="phase15d"]')
          && document.querySelector('main[data-visual-integration="phase16c-final-command-center-v1"]')
          && document.querySelector('[data-phase16c-command-center="true"]')
        );
      }, null, { timeout: 45000, polling: 500 });

      // Let response events flush after the exact On-Chain component becomes live.
      await page.waitForTimeout(250);

      const snapshot = await page.evaluate(() => {
        const root = document.documentElement;
        const ticker = document.querySelector('section[aria-label="Live market ticker"]');
        const networkLayer = document.querySelector('[data-command-layer="network"]');
        const networkSections = networkLayer ? [...networkLayer.querySelectorAll(':scope > section')] : [];
        const onChain = networkSections.find(node => /ON-CHAIN NOW/.test(node.textContent || ''));
        const zvq = networkSections.find(node => /ZEVARYQ/.test(node.textContent || '') && /VERIFIED/.test(node.textContent || ''));
        const verify = document.querySelector('#verify');
        const commandLayers = [...document.querySelectorAll('[data-command-layer]')]
          .map(node => node.getAttribute('data-command-layer'));
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
          commandRelease: document.querySelector('main')?.getAttribute('data-command-release') || null,
          visualIntegration: document.querySelector('main')?.getAttribute('data-visual-integration') || null,
          commandCenterReady: Boolean(document.querySelector('[data-phase16c-command-center="true"]')),
          commandLayers,
          assetsTracked: Number(document.querySelector('[data-assets-tracked]')?.getAttribute('data-assets-tracked')) || null,
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
      assert.equal(snapshot.commandRelease, 'phase15d', 'live production must preserve the Phase 15D command release marker');
      assert.equal(snapshot.visualIntegration, PHASE16C_VISUAL_MARKER, 'live production must expose the Phase 16C visual integration marker');
      assert.equal(snapshot.commandCenterReady, true, 'Phase 16C command-center hero must be mounted');
      assert.deepEqual(
        snapshot.commandLayers,
        ['market', 'intelligence', 'network', 'evidence'],
        'command center hierarchy must remain Market → Intelligence → Network → Evidence',
      );
      assert.match(snapshot.zvqText, /●\s*VERIFIED/, 'ZEVARYQ strip must be VERIFIED');
      assert.match(snapshot.zvqText, /SYNCED/, 'ZEVARYQ strip must be SYNCED');
      assert.match(snapshot.zvqText, /#[\d,]+/, 'ZEVARYQ strip must display a real block number');
      assert.equal(snapshot.oldPromoCopyPresent, false, 'production root must stay data-first, not launch-promo copy');
      const marketMeta = await page.evaluate(async () => {
        const response = await fetch('/api/market-snapshot-page?page=0&limit=500', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return null;
        const payload = await response.json();
        return Number(payload?.totalAssets) || null;
      });
      const expectedTracked = Number.isFinite(marketMeta) ? Math.min(marketMeta, 5000) : null;
      assert.ok(Number.isFinite(expectedTracked) && expectedTracked > 0, 'authoritative market total must be available');
      assert.equal(snapshot.assetsTracked, expectedTracked, 'Assets Tracked must match authoritative page metadata before background hydration completes');
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
        release: snapshot.commandRelease,
        visualIntegration: snapshot.visualIntegration,
        commandCenterReady: snapshot.commandCenterReady,
        hierarchy: snapshot.commandLayers,
        assetsTracked: snapshot.assetsTracked,
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
      scope: 'read-only KriptoAman Phase 16D post-merge live domain lock',
      report,
    }, null, 2),
  );
  if (browser) await browser.close();
}

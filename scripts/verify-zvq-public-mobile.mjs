// Hosted production browser proof. No wallet signing, fixtures, private keys or writes.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const origin = 'https://explorer.kriptoaman.com';
const client = process.env.PLAYWRIGHT_CORE;
const chrome = process.env.ZVQ_CHROME;
if (!client || !chrome) throw Error('Reviewed local Chrome and Playwright client are required');
const { chromium } = await import(pathToFileURL(client).href);
const destination = process.env.ZVQ_PUBLIC_SCREENSHOTS ?? '/tmp/zvq-public-mobile-proof';
await mkdir(destination, { recursive: true });

const browser = await chromium.launch({
  headless: true, executablePath: chrome,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const cases = [
  { name: 'android-360', width: 360, height: 800 },
  { name: 'android-393', width: 393, height: 852 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];
try {
  for (const item of cases) {
    const context = await browser.newContext({
      viewport: { width: item.width, height: item.height }, deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error.message).slice(0, 250)));
    await page.goto(origin + '/?zvq_public_mobile=' + item.width, {
      waitUntil: 'domcontentloaded', timeout: 30000,
    });
    await page.locator('#rainbowWaves').waitFor({ timeout: 15000 });
    // Allow one bounded runtime poll to populate verified indexed data.
    await page.waitForTimeout(5000);
    const home = await page.evaluate(() => {
      const emblem = [...document.querySelectorAll('.official-emblem')];
      return {
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        officialLogos: emblem.length,
        logoLoaded: emblem.every(img => img.complete && img.naturalWidth > 0),
        v2AssetReady: typeof window.ZVQv2?.validTx === 'function',
        latestBlockText: document.querySelector('#blocks')?.textContent?.trim().slice(0, 100),
        txStatus: document.querySelector('#v2-tx-status')?.textContent?.trim(),
        orbitStatus: document.querySelector('.zvq-orbit-badge')?.textContent?.trim(),
      };
    });
    assert.equal(home.width, item.width, item.name + ' viewport width');
    assert.ok(home.scrollWidth <= item.width + 2, item.name + ' homepage horizontal overflow');
    assert.equal(home.officialLogos, 3, item.name + ' approved logo placement count');
    assert.equal(home.logoLoaded, true, item.name + ' missing official emblem asset');
    assert.equal(home.v2AssetReady, true, item.name + ' missing Explorer V2 runtime');
    if (item.width <= 393) {
      assert.ok(home.scrollHeight > item.height, item.name + ' vertically scrollable content');
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
      const scrolled = await page.evaluate(() => window.scrollY);
      assert.ok(scrolled > 0, item.name + ' mobile page cannot scroll');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.locator('#menu').click();
      assert.equal(await page.locator('#menu').getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('#nav').isVisible(), true);
      await page.locator('#menu').click();
    }
    const rpc = await page.evaluate(async () => {
      const response = await fetch('/rpc', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
      });
      return { http: response.status, body: await response.json() };
    });
    assert.equal(rpc.http, 200, item.name + ' browser same-origin RPC');
    assert.equal(rpc.body.result, '0x560c', item.name + ' browser chain ID');
    const indexed = await page.request.get(origin + '/api/v2/blocks', { timeout: 15000 });
    assert.equal(indexed.status(), 200, item.name + ' public indexer');
    assert.ok((await indexed.json()).items?.length > 0, item.name + ' indexer has no blocks');
    assert.deepEqual(errors, [], item.name + ' homepage JS error');
    await page.screenshot({
      path: join(destination, item.name + '-explorer.png'),
      fullPage: true, animations: 'disabled',
    });
    await page.goto(origin + '/developer?zvq_mobile=' + item.width, {
      waitUntil: 'domcontentloaded', timeout: 30000,
    });
    await page.locator('main[data-kam-developer-version="1.0.0"]').waitFor();
    const dev = await page.evaluate(() => {
      const logo = document.querySelector('.mark');
      return {
        scrollWidth: document.documentElement.scrollWidth,
        title: document.title,
        logoLoaded: logo?.tagName === 'IMG' && logo.complete && logo.naturalWidth > 0,
        network: document.querySelector('main')?.textContent?.includes('ZEVARYQ Mainnet'),
        copyButton: !!document.querySelector('[data-copy="https://rpc.kriptoaman.com"]'),
      };
    });
    assert.ok(dev.scrollWidth <= item.width + 2, item.name + ' Developer horizontal overflow');
    assert.equal(dev.logoLoaded, true, item.name + ' Developer official emblem missing');
    assert.equal(dev.network, true, item.name + ' Developer displays wrong network');
    assert.equal(dev.copyButton, true, item.name + ' broken RPC console button');
    await page.screenshot({
      path: join(destination, item.name + '-developer.png'),
      fullPage: true, animations: 'disabled',
    });
    const network = await page.request.get(origin + '/developer/network.json', { timeout: 15000 });
    assert.equal(network.status(), 200, item.name + ' Developer network JSON');
    const configuration = await network.json();
    assert.equal(configuration.chainId, 22028);
    assert.equal(configuration.nativeCurrency.symbol, 'ZVQ');
    assert.deepEqual(errors, [], item.name + ' public browser JS error');
    console.log('PUBLIC_MOBILE_PASS ' + JSON.stringify({
      viewport: item.name, homepageScrollWidth: home.scrollWidth,
      devScrollWidth: dev.scrollWidth, officialLogos: home.officialLogos,
      browserRpcChain: rpc.body.result, txStatus: home.txStatus,
      orbitStatus: home.orbitStatus,
    }));
    await context.close();
  }
} finally {
  await browser.close();
}

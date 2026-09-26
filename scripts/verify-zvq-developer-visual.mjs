// Live browser proof for the exact public ZVQ Developer Center, not a mockup.
// Captures Android-size and desktop screenshots and checks real navigation.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const chrome = process.env.ZVQ_CHROME;
const library = process.env.PLAYWRIGHT_CORE;
const output = process.env.ZVQ_DEV_SCREENSHOT_DIR;
if (!chrome || !library || !output) throw Error('Approved Chrome, Playwright and screenshot path required');
const { chromium } = await import(library);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chrome,
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  for (const spec of [{ name: 'android-360', width: 360, height: 800 },
                       { name: 'android-393', width: 393, height: 852 },
                       { name: 'desktop-1440', width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: 1, isMobile: spec.width < 500, hasTouch: spec.width < 500 });
    const page = await context.newPage();
    const errors = [];
    const assetFailures = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('requestfailed', request => {
      if (request.url().includes('/zevaryq-assets/')) {
        assetFailures.push({ url: request.url(), failure: request.failure()?.errorText });
      }
    });
    page.on('response', response => {
      if (response.url().includes('/zevaryq-assets/') && response.status() >= 400) {
        assetFailures.push({ url: response.url(), status: response.status() });
      }
    });
    const response = await page.goto('https://explorer.kriptoaman.com/developer', {
      waitUntil: 'domcontentloaded', timeout: 25000,
    });
    assert.equal(response?.status(), 200, spec.name + ' HTTP');
    await page.locator('main[data-kam-developer-version="1.0.0"]').waitFor();
    assert.match(await page.locator('body').innerText(), /ZEVARYQ Mainnet/);
    assert.match(await page.locator('body').innerText(), /ZVQ/);
    // DOMContentLoaded can precede image loading. Decode the approved emblem
    // before judging visual readiness, but never hide an actual image failure.
    let logoDecodeError = null;
    try {
      await page.locator('img.mark').evaluate(image => image.decode(), undefined, { timeout: 15000 });
    } catch (error) {
      logoDecodeError = String(error);
    }
    const sizes = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      heroVisible: Boolean(document.querySelector('.hero h1')),
      rpcCopyButton: Boolean(document.querySelector('[data-copy="https://rpc.kriptoaman.com"]')),
      approvedLogo: (() => {
        const image = document.querySelector('.mark');
        return image?.tagName === 'IMG' && image.complete && image.naturalWidth > 0;
      })(),
      walletButton: Boolean(document.querySelector('#addWallet')),
      logo: (() => {
        const image = document.querySelector('img.mark');
        return { src: image?.currentSrc, complete: image?.complete,
          naturalWidth: image?.naturalWidth, naturalHeight: image?.naturalHeight };
      })(),
    }));
    // Save a full-page screenshot and JSON diagnostics BEFORE any layout
    // assertion so a real regression leaves actionable CI artifacts.
    const screenshot = join(output, spec.name + '.png');
    await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
    const diagnostic = { viewport: spec, http: response?.status(), sizes,
      logoDecodeError, assetFailures, pageErrors: errors };
    await writeFile(join(output, spec.name + '.json'), JSON.stringify(diagnostic, null, 2));
    console.log('DEVELOPER_LIVE_VISUAL_DIAG ' + spec.name + ' ' + JSON.stringify(diagnostic));
    assert.equal(sizes.width, spec.width, spec.name + ' viewport');
    assert.ok(sizes.scrollWidth <= spec.width + 1,
      spec.name + ' horizontal overflow: ' + JSON.stringify(sizes));
    assert.ok(sizes.heroVisible && sizes.rpcCopyButton && sizes.approvedLogo && sizes.walletButton,
      spec.name + ' incomplete Developer UI: ' + JSON.stringify(diagnostic));
    if (spec.width < 500) {
      await page.evaluate(() => window.scrollTo(0, 600));
      const y = await page.evaluate(() => window.scrollY);
      assert.ok(y > 0, spec.name + ' vertical scrolling blocked');
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    assert.deepEqual(errors, [], spec.name + ' uncaught JavaScript errors');
    console.log('DEVELOPER_LIVE_VISUAL_PASS ' + spec.name + ' ' + JSON.stringify(sizes));
    await context.close();
  }
} finally {
  await browser.close();
}

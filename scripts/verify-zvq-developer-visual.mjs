// Live browser proof for the exact public ZVQ Developer Center, not a mockup.
// Captures Android-size and desktop screenshots and checks real navigation.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
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
    page.on('pageerror', error => errors.push(String(error)));
    const response = await page.goto('https://explorer.kriptoaman.com/developer', {
      waitUntil: 'domcontentloaded', timeout: 25000,
    });
    assert.equal(response?.status(), 200, spec.name + ' HTTP');
    await page.locator('main[data-kam-developer-version="1.0.0"]').waitFor();
    assert.match(await page.locator('body').innerText(), /ZEVARYQ Mainnet/);
    assert.match(await page.locator('body').innerText(), /ZVQ/);
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
    }));
    assert.equal(sizes.width, spec.width, spec.name + ' viewport');
    assert.ok(sizes.scrollWidth <= spec.width + 1,
      spec.name + ' horizontal overflow: ' + JSON.stringify(sizes));
    assert.ok(sizes.heroVisible && sizes.rpcCopyButton && sizes.approvedLogo && sizes.walletButton,
      spec.name + ' incomplete Developer UI');
    if (spec.width < 500) {
      await page.evaluate(() => window.scrollTo(0, 600));
      const y = await page.evaluate(() => window.scrollY);
      assert.ok(y > 0, spec.name + ' vertical scrolling blocked');
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    await page.screenshot({ path: join(output, spec.name + '.png'),
      fullPage: true, animations: 'disabled' });
    assert.deepEqual(errors, [], spec.name + ' uncaught JavaScript errors');
    console.log('DEVELOPER_LIVE_VISUAL_PASS ' + spec.name + ' ' + JSON.stringify(sizes));
    await context.close();
  }
} finally {
  await browser.close();
}

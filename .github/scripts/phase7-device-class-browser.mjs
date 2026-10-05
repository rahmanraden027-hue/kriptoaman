import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const TARGET = process.env.PHASE7_TARGET || 'https://kriptoaman.com/';
const widths = [390, 430];
const androidUA = 'Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

const browser = await chromium.launch({ headless: true });
await fs.mkdir('device-class-evidence', { recursive: true });

try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 932 },
      userAgent: androidUA,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();

    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('section[aria-label="Live market ticker"]').waitFor({ state: 'attached', timeout: 30000 });
    await page.locator('#home-v10-content').waitFor({ state: 'attached', timeout: 30000 });
    await page.waitForTimeout(1800);

    const initial = await page.evaluate(() => {
      const brand = document.querySelector('header a[href="/"]');
      const search = document.querySelector('a[aria-label="Search market"]');
      const nav = document.querySelector('nav[aria-label="Mobile primary navigation"]');
      const verify = document.querySelector('#verify');
      const explorer = document.querySelector('a[href="https://explorer.kriptoaman.com"]');
      const ticker = document.querySelector('section[aria-label="Live market ticker"]');
      const install = document.querySelector('[data-install-cta="true"]');
      const brandRect = brand?.getBoundingClientRect();
      const searchRect = search?.getBoundingClientRect();
      const navRect = nav?.getBoundingClientRect();
      return {
        innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        brandText: brand?.textContent?.trim() || '',
        brandWidth: brandRect?.width || 0,
        searchWidth: searchRect?.width || 0,
        searchHeight: searchRect?.height || 0,
        navHeight: navRect?.height || 0,
        tickerPresent: Boolean(ticker),
        verifyPresent: Boolean(verify),
        explorerPresent: Boolean(explorer),
        installVisible: Boolean(install),
      };
    });

    if (Math.abs(initial.innerWidth - width) > 2) {
      throw new Error(`${width}px viewport mismatch: ${initial.innerWidth}`);
    }
    if (initial.scrollWidth > initial.innerWidth + 1) {
      throw new Error(`${width}px horizontal overflow: ${initial.scrollWidth} > ${initial.innerWidth}`);
    }
    if (initial.brandText !== 'KRIPTOAMAN' || initial.brandWidth < 80) {
      throw new Error(`${width}px HomeV10 brand is missing or collapsed: ${initial.brandText} / ${initial.brandWidth}`);
    }
    if (initial.searchWidth < 44 || initial.searchHeight < 44) {
      throw new Error(`${width}px search touch target is below 44px: ${initial.searchWidth}x${initial.searchHeight}`);
    }
    if (initial.navHeight < 44) {
      throw new Error(`${width}px mobile navigation is too short: ${initial.navHeight}`);
    }
    if (!initial.tickerPresent || !initial.verifyPresent || !initial.explorerPresent) {
      throw new Error(`${width}px HomeV10 data-first composition is incomplete`);
    }
    if (initial.installVisible) {
      throw new Error(`${width}px install CTA appeared before the root reveal threshold`);
    }

    await page.evaluate(() => {
      window.scrollTo({ top: Math.max(520, Math.round(window.innerHeight * 0.72)), behavior: 'instant' });
    });
    await page.waitForTimeout(1200);

    const revealed = await page.evaluate(() => {
      const cta = document.querySelector('[data-install-cta="true"]');
      const nav = document.querySelector('nav[aria-label="Mobile primary navigation"]');
      const ctaRect = cta?.getBoundingClientRect();
      const navRect = nav?.getBoundingClientRect();
      const pressed = [...document.querySelectorAll('button[aria-pressed]')];
      return {
        installVisible: Boolean(cta),
        installWidth: ctaRect?.width || 0,
        installBottom: ctaRect?.bottom ?? null,
        navTop: navRect?.top ?? null,
        pressedButtons: pressed.length,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth,
      };
    });

    if (!revealed.installVisible) {
      throw new Error(`${width}px install CTA did not appear after the reveal threshold`);
    }
    if (revealed.installWidth <= 0 || revealed.installWidth > 110) {
      throw new Error(`${width}px install CTA is not compact after reveal: width=${revealed.installWidth}`);
    }
    if (
      Number.isFinite(revealed.installBottom) &&
      Number.isFinite(revealed.navTop) &&
      revealed.installBottom > revealed.navTop - 4
    ) {
      throw new Error(`${width}px install CTA overlaps mobile navigation: ctaBottom=${revealed.installBottom} navTop=${revealed.navTop}`);
    }
    if (revealed.pressedButtons < 1) {
      throw new Error(`${width}px featured market selector has no aria-pressed state`);
    }
    if (revealed.scrollWidth > revealed.innerWidth + 1) {
      throw new Error(`${width}px overflow after HomeV10 content reveal`);
    }

    await page.screenshot({
      path: `device-class-evidence/phase10l-home-v10-${width}.png`,
      fullPage: true,
    });

    await fs.writeFile(
      `device-class-evidence/phase10l-home-v10-${width}.json`,
      JSON.stringify({ target: TARGET, width, initial, revealed }, null, 2),
    );

    console.log(`PHASE10L_DEVICE_CLASS_${width}=PASS`);
    await context.close();
  }

  console.log('PHASE10L_DEVICE_CLASS_VISUAL=PASS');
} finally {
  await browser.close();
}

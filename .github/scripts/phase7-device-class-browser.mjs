import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const TARGET = 'https://kriptoaman.com/';
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
    });
    const page = await context.newPage();

    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1500);

    const initial = await page.evaluate(() => {
      const brand = document.querySelector('header img');
      const title = document.querySelector('#beranda h1');
      return {
        innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        brandWidth: brand ? Number.parseFloat(getComputedStyle(brand).width) : 0,
        titleTop: title?.getBoundingClientRect().top ?? -1,
        installVisible: Boolean(document.querySelector('[data-install-cta="true"]')),
      };
    });

    if (Math.abs(initial.innerWidth - width) > 2) {
      throw new Error(`${width}px viewport mismatch: ${initial.innerWidth}`);
    }
    if (initial.scrollWidth > initial.innerWidth + 1) {
      throw new Error(`${width}px horizontal overflow: ${initial.scrollWidth} > ${initial.innerWidth}`);
    }
    if (Math.abs(initial.brandWidth - 32) > 2) {
      throw new Error(`${width}px header brand is not 32px: ${initial.brandWidth}`);
    }
    if (initial.installVisible) {
      throw new Error(`${width}px install CTA appeared before the root reveal threshold`);
    }

    await page.waitForTimeout(3500);
    await page.locator('[data-phase7-visual="live-block-flow"]').waitFor({ state: 'attached', timeout: 30000 });
    await page.locator('[data-phase7-visual="node-master"]').waitFor({ state: 'attached', timeout: 30000 });

    await page.locator('[data-phase7-visual="live-block-flow"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    const before = await page.evaluate(() => {
      const beam = document.querySelector('.zvq-event-beam.is-live');
      const orbit = document.querySelector('.zvq-node-orbit.is-live');
      const metricValue = document.querySelector('.ka-console-metrics b');
      const metricLabel = document.querySelector('.ka-console-metrics span');
      const cta = document.querySelector('[data-install-cta="true"]');
      return {
        beam: beam ? getComputedStyle(beam).transform : 'missing',
        beamAnimation: beam ? getComputedStyle(beam).animationName : 'missing',
        orbit: orbit ? getComputedStyle(orbit).rotate : 'missing',
        orbitAnimation: orbit ? getComputedStyle(orbit).animationName : 'missing',
        metricValueSize: metricValue ? getComputedStyle(metricValue).fontSize : 'missing',
        metricLabelSize: metricLabel ? getComputedStyle(metricLabel).fontSize : 'missing',
        installWidth: cta ? cta.getBoundingClientRect().width : 0,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth,
      };
    });

    if (before.beamAnimation !== 'zvqEventSweep') {
      throw new Error(`${width}px live event beam is not running: ${before.beamAnimation}`);
    }
    if (before.orbitAnimation !== 'zvqOrbitDrift') {
      throw new Error(`${width}px live node orbit is not running: ${before.orbitAnimation}`);
    }
    if (before.metricValueSize !== '16px' || before.metricLabelSize !== '10px') {
      throw new Error(`${width}px telemetry type mismatch: value=${before.metricValueSize} label=${before.metricLabelSize}`);
    }
    if (before.installWidth <= 0 || before.installWidth > 105) {
      throw new Error(`${width}px install CTA is not compact after reveal: width=${before.installWidth}`);
    }
    if (before.scrollWidth > before.innerWidth + 1) {
      throw new Error(`${width}px overflow after deferred production modules load`);
    }

    await page.waitForTimeout(900);
    const after = await page.evaluate(() => {
      const beam = document.querySelector('.zvq-event-beam.is-live');
      const orbit = document.querySelector('.zvq-node-orbit.is-live');
      return {
        beam: beam ? getComputedStyle(beam).transform : 'missing',
        orbit: orbit ? getComputedStyle(orbit).rotate : 'missing',
      };
    });

    if (before.beam === after.beam) {
      throw new Error(`${width}px Live Block Flow event beam did not move`);
    }
    if (before.orbit === after.orbit) {
      throw new Error(`${width}px Node Master orbit did not move`);
    }

    await page.screenshot({
      path: `device-class-evidence/phase7-production-${width}.png`,
      fullPage: true,
    });

    await fs.writeFile(
      `device-class-evidence/phase7-production-${width}.json`,
      JSON.stringify({ width, initial, before, after }, null, 2),
    );

    console.log(`PHASE7_DEVICE_CLASS_${width}=PASS`);
    await context.close();
  }

  console.log('PHASE7_DEVICE_CLASS_VISUAL=PASS');
} finally {
  await browser.close();
}

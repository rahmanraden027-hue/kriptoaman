import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const TARGET = process.env.PHASE11G_TARGET || 'https://kriptoaman.com/login';
const devices = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: false, touch: true },
  { name: 'desktop-1440', width: 1440, height: 1000, mobile: false, touch: false },
];

const mobileUA = 'Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const desktopUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const form = document.querySelector('form');
    const visual = document.querySelector('aside[aria-label="Live network evidence"]');
    const email = form?.querySelector('input[type="email"]');
    const password = form?.querySelector('input[type="password"]');
    const submit = form?.querySelector('button[type="submit"]');
    const rect = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height };
    };
    const visualText = visual?.innerText || '';
    const latest = visualText.match(/Latest block\s*#([\d,]+)/i)?.[1] || null;
    return {
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      form: rect(form),
      visual: rect(visual),
      email: rect(email),
      password: rect(password),
      submit: rect(submit),
      emailEnabled: Boolean(email && !email.disabled),
      passwordEnabled: Boolean(password && !password.disabled),
      submitEnabled: Boolean(submit && !submit.disabled),
      visualText,
      chain22028: /Chain ID\s*22028/i.test(visualText),
      stateVerified: /\bVERIFIED\b/.test(visualText),
      stateIndexed: /\bINDEXED\b/.test(visualText),
      stateUnavailable: /\bUNAVAILABLE\b/.test(visualText),
      latestBlock: latest,
      independenceCopy: /autentikasi tidak bergantung pada telemetri blockchain|authentication is independent from blockchain telemetry/i.test(visualText),
    };
  });
}

function validateGeometry(report, label) {
  assert(report.scrollWidth <= report.width + 1, label + ': horizontal overflow ' + report.scrollWidth + ' > ' + report.width);
  assert(report.form && report.visual, label + ': login form or network visual missing');
  for (const entry of [['form', report.form], ['visual', report.visual], ['email', report.email], ['password', report.password], ['submit', report.submit]]) {
    const name = entry[0];
    const r = entry[1];
    assert(r && r.width > 0 && r.height > 0, label + ': ' + name + ' geometry unavailable');
    assert(r.left >= -1 && r.right <= report.width + 1, label + ': ' + name + ' clipped horizontally');
  }
  assert(report.email.height >= 36, label + ': email control too short');
  assert(report.password.height >= 36, label + ': password control too short');
  assert(report.submit.height >= 40, label + ': submit control too short');
  assert(report.emailEnabled && report.passwordEnabled && report.submitEnabled, label + ': login controls are not available');
  assert(report.independenceCopy, label + ': auth-independence copy missing');
  assert(report.chain22028 || report.stateUnavailable, label + ': network identity neither verified nor failed closed');
  assert(report.stateVerified || report.stateUnavailable, label + ': RPC state is neither VERIFIED nor UNAVAILABLE');
  assert(report.stateIndexed || report.stateUnavailable, label + ': Explorer state is neither INDEXED nor UNAVAILABLE');
  if (report.latestBlock) {
    const n = Number(report.latestBlock.replaceAll(',', ''));
    assert(Number.isSafeInteger(n) && n > 0, label + ': invalid latest block ' + report.latestBlock);
  }
  assert(!/mock|sample block|fake block|synthetic/i.test(report.visualText), label + ': fabricated-data wording detected');
}

await fs.mkdir('phase11g-evidence', { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const device of devices) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      userAgent: device.mobile ? mobileUA : desktopUA,
      isMobile: device.mobile,
      hasTouch: device.touch,
      deviceScaleFactor: 1,
      locale: 'id-ID',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('form').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('aside[aria-label="Live network evidence"]').waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(3500);

    const report = await snapshot(page);
    validateGeometry(report, device.name);

    await page.screenshot({ path: 'phase11g-evidence/' + device.name + '-live.png', fullPage: true });
    await fs.writeFile(
      'phase11g-evidence/' + device.name + '-live.json',
      JSON.stringify({ target: TARGET, mode: 'live', device, report }, null, 2),
    );
    await context.close();
    console.log('PHASE11G_' + device.name.toUpperCase().replaceAll('-', '_') + '_LIVE=PASS');
  }

  for (const device of [devices[0], devices[2]]) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      userAgent: device.mobile ? mobileUA : desktopUA,
      isMobile: device.mobile,
      hasTouch: device.touch,
      deviceScaleFactor: 1,
      locale: 'id-ID',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await page.route('**/api/kam/network-status*', route => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Phase 11G forced fail-closed probe' }),
    }));
    await page.route('https://explorer.kriptoaman.com/api/v2/blocks*', route => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Phase 11G forced fail-closed probe' }),
    }));

    await page.goto(TARGET + '?phase11g=fail-closed-' + device.name, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('form').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('aside[aria-label="Live network evidence"]').waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(1500);

    const report = await snapshot(page);
    assert(report.stateUnavailable, device.name + ' fail-closed: UNAVAILABLE state missing');
    assert(report.emailEnabled && report.passwordEnabled && report.submitEnabled, device.name + ' fail-closed: login controls became unavailable');
    assert(report.scrollWidth <= report.width + 1, device.name + ' fail-closed: horizontal overflow');
    assert(!report.stateVerified && !report.stateIndexed, device.name + ' fail-closed: unavailable telemetry was presented as live');

    await page.screenshot({ path: 'phase11g-evidence/' + device.name + '-fail-closed.png', fullPage: true });
    await fs.writeFile(
      'phase11g-evidence/' + device.name + '-fail-closed.json',
      JSON.stringify({ target: TARGET, mode: 'forced-fail-closed', device, report }, null, 2),
    );
    await context.close();
    console.log('PHASE11G_' + device.name.toUpperCase().replaceAll('-', '_') + '_FAIL_CLOSED=PASS');
  }

  console.log('PHASE11G_LOGIN_NETWORK_DEVICE_ACCEPTANCE=PASS');
} finally {
  await browser.close();
}

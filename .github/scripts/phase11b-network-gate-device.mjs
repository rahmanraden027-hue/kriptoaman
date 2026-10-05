import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const TARGET = process.env.PHASE11B_TARGET || 'https://kriptoaman.com/preview/network-gate';
const devices = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: false, touch: true },
  { name: 'desktop-1440', width: 1440, height: 1000, mobile: false, touch: false },
];
const mobileUA = 'Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const desktopUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

function containedRatio(rect, bounds) {
  const left = Math.max(bounds.left, rect.left);
  const right = Math.min(bounds.right, rect.right);
  const top = Math.max(bounds.top, rect.top);
  const bottom = Math.min(bounds.bottom, rect.bottom);
  const visible = Math.max(0, right - left) * Math.max(0, bottom - top);
  const total = Math.max(1, rect.width * rect.height);
  return visible / total;
}

await fs.mkdir('phase11b-evidence', { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const device of devices) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      userAgent: device.mobile ? mobileUA : desktopUA,
      isMobile: device.mobile,
      hasTouch: device.touch,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();

    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByText('Live Network Gate', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });

    let liveReady = false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      liveReady = await page.evaluate(() => (
        document.body.innerText.includes('Live evidence')
        && document.querySelectorAll('.zvq-cube').length > 0
      ));
      if (liveReady) break;
      await page.waitForTimeout(5000);
      if (attempt === 1) await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    if (!liveReady) throw new Error(device.name + ' did not reach verified live evidence state');

    const report = await page.evaluate(() => {
      const text = document.body.innerText;
      const cubes = [...document.querySelectorAll('.zvq-cube')];
      const links = [...document.querySelectorAll('a')];
      const cta = links.filter(link => ['Masuk', 'Buka Explorer', 'Masuk ke KriptoAman'].some(label => link.textContent?.includes(label)));
      const cubeRects = cubes.map(cube => {
        const r = cube.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, text: cube.textContent?.trim() || '' };
      });
      const ctaRects = cta.map(link => {
        const r = link.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, text: link.textContent?.trim() || '' };
      });
      const stage = document.querySelector('[aria-label="Verified recent ZEVARYQ blocks"]');
      const stageBox = stage?.getBoundingClientRect();
      const stageRect = stageBox ? {
        left: stageBox.left,
        right: stageBox.right,
        top: stageBox.top,
        bottom: stageBox.bottom,
        width: stageBox.width,
        height: stageBox.height,
      } : null;
      const firstCubeStyle = cubes[0] ? getComputedStyle(cubes[0]) : null;
      const latestBlock = text.match(/Latest block\s*#([\d,]+)/i)?.[1] || null;
      const chainId = text.match(/Chain ID\s*(\d+)/i)?.[1] || null;
      return {
        innerWidth,
        innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        chainId,
        chainHexVisible: text.includes('0x560c'),
        liveEvidence: text.includes('Live evidence'),
        rpcVerified: text.includes('RPC') && text.includes('Verified'),
        explorerIndexed: text.includes('Explorer') && text.includes('Indexed'),
        latestBlock,
        cubeCount: cubes.length,
        cubeRects,
        ctaRects,
        stageRect,
        reducedMotionAnimationName: firstCubeStyle?.animationName || null,
        title: document.title,
      };
    });

    if (report.scrollWidth > report.innerWidth + 1) {
      throw new Error(device.name + ' horizontal overflow: ' + report.scrollWidth + ' > ' + report.innerWidth);
    }
    if (report.chainId !== '22028' || !report.chainHexVisible) {
      throw new Error(device.name + ' ZEVARYQ chain identity is not visible and verified');
    }
    if (!report.liveEvidence || !report.rpcVerified || !report.explorerIndexed || report.cubeCount < 1) {
      throw new Error(device.name + ' live evidence composition is incomplete');
    }
    if (!report.latestBlock || Number(report.latestBlock.replaceAll(',', '')) <= 0) {
      throw new Error(device.name + ' latest block is missing or invalid');
    }
    if (report.reducedMotionAnimationName !== 'none') {
      throw new Error(device.name + ' reduced-motion contract did not disable cube animation: ' + report.reducedMotionAnimationName);
    }
    if (report.ctaRects.length < 3) {
      throw new Error(device.name + ' safe exits are incomplete');
    }
    for (const rect of report.ctaRects) {
      if (rect.width < 44 || rect.height < 44) {
        throw new Error(device.name + ' CTA below 44px touch target: ' + rect.text + ' ' + rect.width + 'x' + rect.height);
      }
      if (rect.left < -1 || rect.right > report.innerWidth + 1) {
        throw new Error(device.name + ' CTA clipped horizontally: ' + rect.text);
      }
    }
    if (!report.stageRect || report.stageRect.width <= 0 || report.stageRect.height <= 0) {
      throw new Error(device.name + ' 3D stage bounds are unavailable');
    }
    for (const rect of report.cubeRects) {
      const horizontalVisible = Math.max(
        0,
        Math.min(report.innerWidth, rect.right) - Math.max(0, rect.left),
      ) / Math.max(1, rect.width);
      if (horizontalVisible < 0.6) {
        throw new Error(device.name + ' 3D cube is severely clipped horizontally: ' + rect.text + ' ratio=' + horizontalVisible.toFixed(2));
      }
      const stageRatio = containedRatio(rect, report.stageRect);
      if (stageRatio < 0.45) {
        throw new Error(device.name + ' 3D cube escapes its visual stage: ' + rect.text + ' ratio=' + stageRatio.toFixed(2));
      }
    }

    await page.screenshot({
      path: 'phase11b-evidence/' + device.name + '.png',
      fullPage: true,
    });
    await fs.writeFile(
      'phase11b-evidence/' + device.name + '.json',
      JSON.stringify({ target: TARGET, device, report }, null, 2),
    );

    console.log('PHASE11B_' + device.name.toUpperCase().replaceAll('-', '_') + '=PASS');
    await context.close();
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    userAgent: desktopUA,
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByText('Live Network Gate', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(2500);
  const normalMotion = await page.evaluate(() => {
    const cube = document.querySelector('.zvq-cube');
    return cube ? getComputedStyle(cube).animationName : null;
  });
  if (!normalMotion || normalMotion === 'none') {
    throw new Error('desktop normal-motion probe did not retain 3D cube animation');
  }
  await context.close();

  console.log('PHASE11B_NORMAL_MOTION=PASS');
  console.log('PHASE11B_NETWORK_GATE_DEVICE_ACCEPTANCE=PASS');
} finally {
  await browser.close();
}

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const TARGET = process.env.PHASE11C3_TARGET || 'http://127.0.0.1:4173';
const PUBLIC_HREFS = ['/', '/Market', '/IntelligenceHub', '/ZEVARYQ', '/Services'];
const WORKSPACE_HREFS = ['/dashboard', '/Market', '/IntelligenceHub', '/ZEVARYQ', '/Services'];
const CANONICAL_STATES = ['LIVE', 'VERIFIED', 'SYNCED', 'PARTIAL', 'SNAPSHOT', 'UNAVAILABLE', 'CHECKING'];
const MOCK_USER = {
  id: 'phase11c3-acceptance-user',
  email: 'acceptance@kriptoaman.local',
  full_name: 'Acceptance User',
  role: 'user',
};

await fs.mkdir('phase11c3-evidence', { recursive: true });
const browser = await chromium.launch({ headless: true });

function pathOf(href) {
  try { return new URL(href, TARGET).pathname; } catch { return href; }
}

async function prepareContext({ width, height, authenticated }) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: 'id-ID',
    reducedMotion: 'reduce',
    isMobile: width < 600,
    hasTouch: width < 900,
    deviceScaleFactor: 1,
  });

  await context.addInitScript(() => {
    localStorage.setItem('ka_language', 'id');
    localStorage.setItem('_ka_disclaimer_accepted_v2', '1');
    localStorage.removeItem('cv_pin_enabled');
  });

  const page = await context.newPage();
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/auth/me' && request.method() === 'GET') {
      if (authenticated) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: MOCK_USER }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthenticated acceptance fixture' }),
        });
      }
      return;
    }

    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Acceptance fixture unavailable' }),
    });
  });

  return { context, page };
}

async function waitForStable(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
}

async function collectPrimaryNav(page, expectedHrefs) {
  return page.evaluate((expected) => {
    const navs = [...document.querySelectorAll('nav, aside')];
    const canonical = expected.join('|');

    for (const nav of navs) {
      const links = [...nav.querySelectorAll('a[href]')];
      const hrefs = links.map((link) => new URL(link.href, location.href).pathname);
      const unique = [...new Set(hrefs.filter((href) => expected.includes(href)))];
      if (unique.length === expected.length && expected.every((href) => unique.includes(href))) {
        const active = links.find((link) => link.getAttribute('aria-current') === 'page');
        const rect = nav.getBoundingClientRect();
        return {
          canonical,
          hrefs: unique,
          activeHref: active ? new URL(active.href, location.href).pathname : null,
          activeText: active?.textContent?.trim() || null,
          rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
        };
      }
    }
    return null;
  }, expectedHrefs);
}

async function collectSurface(page, expectedHrefs) {
  return page.evaluate((args) => {
    const { canonicalStates } = args;
    const topbar = document.querySelector('.ka-global-topbar');
    const sidebar = document.querySelector('.ka-global-sidebar');
    const embedded = document.querySelector('.ka-embedded-nav');
    const bodyText = document.body.innerText;
    const topbarRect = topbar?.getBoundingClientRect();
    const sidebarRect = sidebar?.getBoundingClientRect();
    const embeddedRect = embedded?.getBoundingClientRect();
    return {
      path: location.pathname,
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      shellPresent: Boolean(document.querySelector('.ka-global-shell')),
      topbarPresent: Boolean(topbar),
      sidebarPresent: Boolean(sidebar),
      embeddedNavPresent: Boolean(embedded),
      topbarHeight: topbarRect?.height || 0,
      sidebarWidth: sidebarRect?.width || 0,
      embeddedNavHeight: embeddedRect?.height || 0,
      brandPresent: bodyText.includes('KRIPTOAMAN'),
      canonicalStates: canonicalStates.filter((state) => new RegExp('\\b' + state + '\\b').test(bodyText)),
    };
  }, { expectedHrefs, canonicalStates: CANONICAL_STATES });
}

function assertHrefs(actual, expected, label) {
  if (!actual) throw new Error(label + ': canonical primary navigation not found');
  for (const href of expected) {
    if (!actual.hrefs.includes(href)) throw new Error(label + ': missing primary route ' + href);
  }
}

function assertNoOverflow(surface, label) {
  if (surface.scrollWidth > surface.innerWidth + 1) {
    throw new Error(label + ': horizontal overflow ' + surface.scrollWidth + ' > ' + surface.innerWidth);
  }
}

async function publicMobileAcceptance() {
  const { context, page } = await prepareContext({ width: 390, height: 844, authenticated: false });
  const evidence = [];

  try {
    const surfaces = [
      { path: '/', active: '/', stateRequired: true },
      { path: '/Market', active: '/Market', stateRequired: true },
      { path: '/ZEVARYQ', active: '/ZEVARYQ', stateRequired: true },
      { path: '/Services', active: '/Services', stateRequired: false },
    ];

    for (const surfaceSpec of surfaces) {
      await page.goto(TARGET + surfaceSpec.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForStable(page);

      const nav = await collectPrimaryNav(page, PUBLIC_HREFS);
      const surface = await collectSurface(page, PUBLIC_HREFS);
      assertHrefs(nav, PUBLIC_HREFS, 'public ' + surfaceSpec.path);
      assertNoOverflow(surface, 'public ' + surfaceSpec.path);

      if (nav.activeHref !== surfaceSpec.active) {
        throw new Error('public ' + surfaceSpec.path + ': active route mismatch ' + nav.activeHref + ' !== ' + surfaceSpec.active);
      }
      if (surfaceSpec.stateRequired && surface.canonicalStates.length === 0) {
        throw new Error('public ' + surfaceSpec.path + ': no canonical production state visible');
      }

      const slug = surfaceSpec.path === '/' ? 'home' : surfaceSpec.path.slice(1).toLowerCase();
      await page.screenshot({ path: 'phase11c3-evidence/public-mobile-' + slug + '.png', fullPage: true });
      evidence.push({ surface: surfaceSpec.path, nav, report: surface });
    }

    await page.goto(TARGET + '/IntelligenceHub', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForURL(/\/login(?:\?|$)/, { timeout: 15000 });
    evidence.push({
      surface: '/IntelligenceHub',
      accessBoundary: 'LOGIN_REQUIRED',
      resolvedPath: new URL(page.url()).pathname,
    });
    await page.screenshot({ path: 'phase11c3-evidence/public-mobile-intelligence-login-boundary.png', fullPage: true });
  } finally {
    await context.close();
  }

  return evidence;
}

async function authenticatedJourney({ width, height, label }) {
  const { context, page } = await prepareContext({ width, height, authenticated: true });
  const evidence = [];
  const journey = [
    { path: '/dashboard', active: '/dashboard', stateRequired: true },
    { path: '/Market', active: '/Market', stateRequired: true },
    { path: '/IntelligenceHub', active: '/IntelligenceHub', stateRequired: true },
    { path: '/ZEVARYQ', active: '/ZEVARYQ', stateRequired: true },
    { path: '/Services', active: '/Services', stateRequired: false },
  ];

  try {
    await page.goto(TARGET + journey[0].path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('.ka-global-shell').waitFor({ state: 'attached', timeout: 30000 });
    await waitForStable(page);

    let baselineTopbarHeight = null;
    let baselineNavMetric = null;

    for (let index = 0; index < journey.length; index += 1) {
      const step = journey[index];
      if (index > 0) {
        const selector = width >= 1024
          ? '.ka-global-sidebar a[href="' + step.path + '"]'
          : '.ka-embedded-nav a[href="' + step.path + '"]';
        await page.locator(selector).click();
        await page.waitForURL((url) => url.pathname === step.path, { timeout: 15000 });
        await waitForStable(page);
      }

      const nav = await collectPrimaryNav(page, WORKSPACE_HREFS);
      const surface = await collectSurface(page, WORKSPACE_HREFS);
      assertHrefs(nav, WORKSPACE_HREFS, label + ' ' + step.path);
      assertNoOverflow(surface, label + ' ' + step.path);

      if (!surface.shellPresent || !surface.topbarPresent || !surface.brandPresent) {
        throw new Error(label + ' ' + step.path + ': authenticated KriptoAman shell is incomplete');
      }
      if (nav.activeHref !== step.active) {
        throw new Error(label + ' ' + step.path + ': active route mismatch ' + nav.activeHref + ' !== ' + step.active);
      }
      if (step.stateRequired && surface.canonicalStates.length === 0) {
        throw new Error(label + ' ' + step.path + ': no canonical production state visible');
      }

      if (width >= 1024) {
        if (!surface.sidebarPresent || surface.sidebarWidth < 220) {
          throw new Error(label + ' ' + step.path + ': desktop sidebar missing or collapsed');
        }
      } else if (!surface.embeddedNavPresent || surface.embeddedNavHeight < 60) {
        throw new Error(label + ' ' + step.path + ': mobile workspace navigation missing or too short');
      }

      if (baselineTopbarHeight === null) baselineTopbarHeight = surface.topbarHeight;
      if (Math.abs(surface.topbarHeight - baselineTopbarHeight) > 4) {
        throw new Error(label + ' ' + step.path + ': topbar height drifted across surfaces');
      }

      const navMetric = width >= 1024 ? surface.sidebarWidth : surface.embeddedNavHeight;
      if (baselineNavMetric === null) baselineNavMetric = navMetric;
      if (Math.abs(navMetric - baselineNavMetric) > 6) {
        throw new Error(label + ' ' + step.path + ': primary navigation geometry drifted across surfaces');
      }

      const slug = step.path === '/dashboard' ? 'dashboard' : step.path.slice(1).toLowerCase();
      await page.screenshot({ path: 'phase11c3-evidence/' + label + '-' + slug + '.png', fullPage: true });
      evidence.push({ surface: step.path, nav, report: surface });
    }
  } finally {
    await context.close();
  }

  return evidence;
}


async function phase15fContinuityAcceptance({ width, height, label }) {
  const { context, page } = await prepareContext({ width, height, authenticated: true });
  const evidence = [];
  const surfaces = [
    { path: '/Market', id: 'market' },
    { path: '/IntelligenceHub', id: 'intelligence' },
    { path: '/ZEVARYQ', id: 'network' },
    { path: '/PortfolioOverview', id: 'portfolio' },
    { path: '/SecurityHub', id: 'security' },
    { path: '/wallet-app', id: 'wallet' },
  ];

  try {
    for (const spec of surfaces) {
      await page.goto(TARGET + spec.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForStable(page);

      const continuity = await page.evaluate(({ id }) => {
        const surface = document.querySelector(
          '[data-product-surface="' + id + '"][data-product-release="phase15f"]',
        );
        const rail = document.querySelector(
          '[data-product-continuity="phase15f"][data-current-surface="' + id + '"]',
        );
        const links = rail ? [...rail.querySelectorAll('[data-surface-link]')] : [];
        const active = rail?.querySelector('[aria-current="page"]');
        return {
          id,
          surfacePresent: Boolean(surface),
          railPresent: Boolean(rail),
          linkIds: links.map((link) => link.getAttribute('data-surface-link')),
          activeId: active?.getAttribute('data-surface-link') || null,
          innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
        };
      }, spec);

      if (!continuity.surfacePresent) throw new Error(label + ' ' + spec.path + ': Phase 15F surface marker missing');
      if (!continuity.railPresent) throw new Error(label + ' ' + spec.path + ': Phase 15F continuity rail missing');
      if (continuity.activeId !== spec.id) {
        throw new Error(label + ' ' + spec.path + ': continuity active surface mismatch ' + continuity.activeId + ' !== ' + spec.id);
      }
      for (const required of ['command-center', 'market', 'intelligence', 'network', 'portfolio', 'security', 'wallet']) {
        if (!continuity.linkIds.includes(required)) {
          throw new Error(label + ' ' + spec.path + ': continuity rail missing ' + required);
        }
      }
      if (continuity.scrollWidth > continuity.innerWidth + 1) {
        throw new Error(label + ' ' + spec.path + ': horizontal overflow ' + continuity.scrollWidth + ' > ' + continuity.innerWidth);
      }

      const slug = spec.id.replaceAll('-', '_');
      await page.screenshot({
        path: 'phase11c3-evidence/' + label + '-phase15f-' + slug + '.png',
        fullPage: true,
      });
      evidence.push({ surface: spec.path, continuity });
    }
  } finally {
    await context.close();
  }

  return evidence;
}

try {
  const publicMobile = await publicMobileAcceptance();
  const authMobile = await authenticatedJourney({ width: 390, height: 844, label: 'auth-mobile' });
  const authDesktop = await authenticatedJourney({ width: 1440, height: 1000, label: 'auth-desktop' });
  const phase15fMobile = await phase15fContinuityAcceptance({ width: 390, height: 844, label: 'phase15f-mobile' });
  const phase15fDesktop = await phase15fContinuityAcceptance({ width: 1440, height: 1000, label: 'phase15f-desktop' });

  const report = {
    target: TARGET,
    generatedAt: new Date().toISOString(),
    fixture: {
      auth: 'browser-intercept-only',
      nonAuthApiPolicy: '503-fail-closed',
      realCredentialsUsed: false,
    },
    publicMobile,
    authMobile,
    authDesktop,
    phase15fMobile,
    phase15fDesktop,
  };

  await fs.writeFile('phase11c3-evidence/cross-surface-report.json', JSON.stringify(report, null, 2));
  console.log('PHASE11C3_PUBLIC_MOBILE=PASS');
  console.log('PHASE11C3_AUTH_MOBILE=PASS');
  console.log('PHASE11C3_AUTH_DESKTOP=PASS');
  console.log('PHASE11C3_CROSS_SURFACE_ACCEPTANCE=PASS');
  console.log('PHASE15F_MOBILE_CONTINUITY=PASS');
  console.log('PHASE15F_DESKTOP_CONTINUITY=PASS');
} finally {
  await browser.close();
}

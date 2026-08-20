import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public international and status routes remain exposed', async () => {
  const app = await read('src/App.jsx');
  assert.match(app, /path="\/en"/);
  assert.match(app, /path="\/SystemStatus"/);
  assert.match(app, /path="\/register"/);
});

test('registration requires consent, strong passwords, and six-digit OTP', async () => {
  const [registerPage, registerApi, verifyApi] = await Promise.all([
    read('src/pages/Register.jsx'),
    read('functions/api/auth/register.js'),
    read('functions/api/auth/verify-email.js'),
  ]);
  assert.match(registerPage, /minimal 12 karakter/);
  assert.match(registerPage, /termsAccepted/);
  assert.match(registerApi, /body\.termsAccepted !== true/);
  assert.match(registerApi, /checkRateLimit/);
  assert.match(verifyApi, /\^\\d\{6\}\$/);
  assert.match(verifyApi, /maxAttempts: 5/);
});

test('deployment headers enforce transport, framing, and permission boundaries', async () => {
  const headers = await read('public/_headers');
  assert.match(headers, /Strict-Transport-Security: max-age=31536000/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\)/);
  assert.match(headers, /\/api\/\*[\s\S]*Cache-Control: no-store/);
});

test('PWA and responsive market contracts are present', async () => {
  const [manifest, market, index] = await Promise.all([
    read('public/manifest.json'),
    read('src/pages/Market.jsx'),
    read('index.html'),
  ]);
  const parsed = JSON.parse(manifest);
  assert.ok(['standalone', 'minimal-ui'].includes(parsed.display));
  assert.ok(parsed.icons.some(icon => String(icon.sizes).includes('512')));
  assert.match(market, /max-w-7xl/);
  assert.match(market, /sm:px-6/);
  assert.match(index, /hrefLang="en"|hreflang="en"/i);
});

test('public copy avoids unverified custody and security claims', async () => {
  const [english, privacy, footer] = await Promise.all([
    read('src/pages/EnglishLanding.jsx'),
    read('src/pages/PrivacyPolicy.jsx'),
    read('src/components/landing/GLandingFooter.jsx'),
  ]);
  assert.match(english, /not an exchange, custodian, broker, or investment adviser/i);
  assert.match(footer, /PT Kripto Aman Indonesia/);
  assert.doesNotMatch(privacy, /Enkripsi end-to-end/);
  assert.doesNotMatch(privacy, /Dukungan autentikasi multi-faktor/);
});

test('production monitor accepts supporting-provider degradation but rejects outages', async () => {
  const monitor = await read('scripts/check-system-health.mjs');

  assert.match(monitor, /payload\.ok !== true \|\| payload\.overall === 'outage'/);
  assert.match(monitor, /\['ok', 'degraded'\]\.includes\(payload\.overall\)/);
  assert.match(monitor, /healthy_with_fallback/);
  assert.match(monitor, /requiredServices = \['app', 'database', 'coinlore'\]/);
});

test('Android signing restore safely normalizes and validates Base64 secrets', async () => {
  const workflow = await read('.github/workflows/android-play.yml');

  assert.match(workflow, /printf '%s' "\$PLAY_KEYSTORE_BASE64" \| tr -d/);
  assert.match(workflow, /\^\[A-Za-z0-9\+\/\]\+\=\{0,2\}\$/);
  assert.match(workflow, /normalized_keystore_base64\} % 4 != 0/);
  assert.match(workflow, /printf '%s' "\$normalized_keystore_base64" \| base64 --decode/);
  assert.doesNotMatch(workflow, /echo "\$PLAY_KEYSTORE_BASE64" \| base64 --decode/);
});

test('world-class visual layer loads last and preserves responsive app navigation', async () => {
  const [entry, worldUi] = await Promise.all([
    read('src/main.jsx'),
    read('src/styles/world-class-ui.css'),
  ]);

  const v9Import = entry.indexOf("import '@/styles/final-ui-v9.css'");
  const worldImport = entry.indexOf("import '@/styles/world-class-ui.css'");
  assert.ok(v9Import >= 0 && worldImport > v9Import);
  assert.match(worldUi, /\.ka-global-topbar/);
  assert.match(worldUi, /\.ka-global-sidebar/);
  assert.match(worldUi, /\.ka-command-hero/);
  assert.match(worldUi, /\.ka-command-panel/);
  assert.match(worldUi, /\.ka-embedded-nav/);
  assert.match(worldUi, /env\(safe-area-inset-bottom/);
  assert.match(worldUi, /prefers-reduced-motion/);
});

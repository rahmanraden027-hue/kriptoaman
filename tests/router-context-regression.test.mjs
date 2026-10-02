import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('PWA install prompt stays inside the router and error boundary', async () => {
  const source = await read('src/App.jsx');
  const appRender = source.slice(source.indexOf('function App()'));
  const compact = appRender.replace(/\s+/g, ' ');

  assert.match(
    compact,
    /<Router>.*<AppErrorBoundary>.*<AuthenticatedApp\s*\/>.*<PWAInstallPrompt\s*\/>.*<\/AppErrorBoundary>.*<\/Router>/,
    'PWAInstallPrompt calls useLocation and must render below BrowserRouter',
  );
  assert.doesNotMatch(
    compact,
    /<\/Router>.*<PWAInstallPrompt\s*\/>/,
    'rendering PWAInstallPrompt outside BrowserRouter causes an immediate runtime invariant error',
  );
});

test('PWA install prompt continues to use the router location contract', async () => {
  const source = await read('src/components/pwa/PWAInstallPrompt.jsx');
  assert.match(source, /import \{ useLocation \} from 'react-router-dom'/);
  assert.match(source, /const \{ pathname \} = useLocation\(\)/);
});

test('PWA install prompt stays compact at the mobile safe-area edge', async () => {
  const source = await read('src/components/pwa/PWAInstallPrompt.jsx');

  assert.match(source, /bottom-\[calc\(\.75rem\+env\(safe-area-inset-bottom,0px\)\)\]/);
  assert.match(source, /right-3/);
  assert.match(source, /sm:hidden[^>]*>Pasang</);
  assert.doesNotMatch(source, /left-1\/2[^\n]*-translate-x-1\/2/);
});

test('normal public landing exposes a browser-smoke readiness marker', async () => {
  const source = await read('src/pages/KriptoAmanGlobalLanding.jsx');
  assert.match(source, /data-ka-public-landing="ready"/);
  assert.doesNotMatch(source, /data-ka-safe-public/);
});


test('Android install surface separates signed native APK from PWA', async () => {
  const source = await read('src/components/pwa/PWAInstallPrompt.jsx');
  const workflow = await read('.github/workflows/android-play.yml');
  assert.match(source, /Download APK Signed · v1\.5\.5/);
  assert.match(source, /android-v1\.5\.5\/KriptoAman-1\.5\.5\.apk/);
  assert.match(source, /Install Web App \(PWA\)/);
  assert.match(source, /com\.kriptoaman\.app/);
  assert.match(workflow, /Publish immutable versioned GitHub Release/);
  assert.match(workflow, /KriptoAman-1\.5\.5\.apk\.sha256/);
  assert.match(workflow, /Release \$tag already exists\. Bump Android version/);
  assert.match(workflow, /contents: write/);
});

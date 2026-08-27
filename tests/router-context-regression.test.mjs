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

test('normal public landing exposes a browser-smoke readiness marker', async () => {
  const source = await read('src/pages/KriptoAmanGlobalLanding.jsx');
  assert.match(source, /data-ka-public-landing="ready"/);
  assert.doesNotMatch(source, /data-ka-safe-public/);
});

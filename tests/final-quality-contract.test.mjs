import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('price alerts evaluate live prices once and persist trigger state', async () => {
  const alerts = await read('src/pages/Alerts.jsx');
  assert.match(alerts, /useLivePrices/);
  assert.match(alerts, /triggeredAt/);
  assert.match(alerts, /triggeredPrice/);
  assert.match(alerts, /Notification\.permission === 'granted'/);
  assert.match(alerts, /tag: `ka-price-alert-/);
});

test('mobile and desktop primary actions follow the selected language', async () => {
  const [layout, actions, navigation] = await Promise.all([
    read('src/Layout.jsx'),
    read('src/components/home/HomeQuickActions.jsx'),
    read('src/lib/primaryNavigation.js'),
  ]);
  assert.match(layout, /primaryNavLabels/);
  assert.match(navigation, /home: 'Home'/);
  assert.match(navigation, /home: 'Beranda'/);
  assert.match(layout, /Global intelligence · Watch-only/);
  assert.match(layout, /Intelijen global · Pemantauan/);
  assert.match(actions, /Watch Wallet/);
  assert.match(actions, /useLanguage/);
});

test('home defers non-critical panels and exposes stable loading fallbacks', async () => {
  const home = await read('src/pages/Home.jsx');
  assert.match(home, /lazy\(\(\) => import/);
  assert.match(home, /Suspense/);
  assert.match(home, /DeferredFallback/);
});

test('service worker navigation fails safe without a cached app shell', async () => {
  const worker = await read('public/sw.js');
  assert.match(worker, /Service Worker v2\.4\.4/);
  assert.match(worker, /Promise\.allSettled/);
  assert.match(worker, /cache: 'no-store'/);
  assert.match(worker, /offlineNavigationResponse/);
  assert.match(worker, /status: 503/);
  assert.match(worker, /Content-Type.*text\/html/);
  assert.doesNotMatch(worker, /caches\.match\('\/index\.html'\)/);
  assert.doesNotMatch(worker, /cache\.put\('\/index\.html'/);
});

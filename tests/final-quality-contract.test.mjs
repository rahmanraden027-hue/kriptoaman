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
  const [layout, actions] = await Promise.all([
    read('src/Layout.jsx'),
    read('src/components/home/HomeQuickActions.jsx'),
  ]);
  assert.match(layout, /DESKTOP_LABELS/);
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

test('service worker final cache has an independent offline document', async () => {
  const worker = await read('public/sw.js');
  assert.match(worker, /Service Worker v2\.3\.1/);
  assert.match(worker, /kriptoaman-static-v2\.3\.1/);
  assert.match(worker, /cache: 'no-store'/);
  assert.match(worker, /KriptoAman Offline/);
  assert.match(worker, /Content-Type.*text\/html/);
});

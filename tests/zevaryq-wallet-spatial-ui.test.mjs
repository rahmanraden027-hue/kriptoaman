import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ZEVARYQ Wallet spatial UI is present without replacing financial controls', async () => {
  const wallet = await read('src/pages/Wallet.jsx');
  assert.match(wallet, /zv-hero-visual/);
  assert.match(wallet, /zv-orbit-stage/);
  assert.match(wallet, /zv-action-orb/);
  assert.match(wallet, /OFFICIAL WALLET/);
  assert.match(wallet, /Connect Wallet/);
  assert.match(wallet, /Preview Send/);
  assert.match(wallet, /Receive ZVQ/);
  assert.match(wallet, /ZEVARYQ Explorer/);
  assert.doesNotMatch(wallet, /APP 2 OF 2/);
});

test('spatial effects remain CSS-only, responsive and reduced-motion safe', async () => {
  const css = await read('src/pages/ZevaryqWallet.css');
  assert.match(css, /ZEVARYQ Spatial Finance UI/);
  assert.match(css, /transform-style:preserve-3d/);
  assert.match(css, /zv-orbit-ring/);
  assert.match(css, /zv-network-card/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /canvas\s*\{/i);
});

test('network telemetry exposes live state and Android release is bumped', async () => {
  const [network, gradle] = await Promise.all([
    read('src/components/zevaryq-wallet/NetworkInfrastructureCard.jsx'),
    read('android/app/build.gradle'),
  ]);
  assert.match(network, /data-network-live/);
  assert.match(network, /zv-telemetry-tile/);
  assert.match(gradle, /wallet\s*\{[\s\S]*versionCode 8[\s\S]*versionName "1\.0\.7"/);
});

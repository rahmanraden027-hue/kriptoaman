import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'));
const readiness = await readFile(new URL('../src/pages/PWAValidation.jsx', import.meta.url), 'utf8');
const pwaInitializer = await readFile(new URL('../src/components/pwa/PWAInitializer.jsx', import.meta.url), 'utf8');
const androidManifest = await readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
const androidBuild = await readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
const androidVariables = await readFile(new URL('../android/variables.gradle', import.meta.url), 'utf8');
const capacitorConfig = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'));

test('PWA manifest is aligned with Android 1.4 release identity', () => {
  assert.equal(manifest.short_name, 'KriptoAman');
  assert.equal(manifest.version, '1.4.0');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'maskable'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'maskable'));
  assert.ok(manifest.shortcuts.some(item => item.url === '/Market'));
  assert.ok(manifest.shortcuts.some(item => item.url === '/Wallet'));
  assert.ok(manifest.shortcuts.some(item => item.url === '/SecurityHub'));

  const serialized = JSON.stringify(manifest);
  assert.doesNotMatch(serialized, /2\.500\+|2\.000 aset|2500\+|2000\+ assets/i);
});

test('PWA install icons referenced by manifest exist in release assets', async () => {
  for (const icon of manifest.icons.filter(item => item.src.startsWith('/icons/'))) {
    await access(new URL(`../public${icon.src}`, import.meta.url));
  }
});

test('PWA does not request notification permission automatically on startup', () => {
  assert.doesNotMatch(pwaInitializer, /Notification\.requestPermission\s*\(/);
  assert.match(pwaInitializer, /Notification\.permission !== 'granted'/);
  assert.match(pwaInitializer, /VITE_VAPID_PUBLIC_KEY/);
});

test('PWA readiness page does not make hard-coded completion claims', () => {
  assert.doesNotMatch(readiness, /COINVAULT/i);
  assert.doesNotMatch(readiness, />100%</);
  assert.doesNotMatch(readiness, />37\/37</);
  assert.doesNotMatch(readiness, /Remaining Actions[\s\S]*>0</);
  assert.match(readiness, /Belum dinyatakan 100% siap store/);
  assert.match(readiness, /build AAB terbaru/);
  assert.match(readiness, /Play Console Data safety/);
});

test('Android release identity and target SDK remain Play-ready', () => {
  assert.equal(capacitorConfig.appId, 'com.kriptoaman.app');
  assert.equal(capacitorConfig.appName, 'KriptoAman');
  assert.match(androidBuild, /applicationId\s+"com\.kriptoaman\.app"/);
  assert.match(androidBuild, /versionCode\s+5/);
  assert.match(androidBuild, /versionName\s+"1\.4"/);
  assert.match(androidVariables, /compileSdkVersion\s*=\s*36/);
  assert.match(androidVariables, /targetSdkVersion\s*=\s*36/);
});

test('Android release disables application backup for sensitive app state', () => {
  assert.match(androidManifest, /android:allowBackup="false"/);
  assert.doesNotMatch(androidManifest, /android:allowBackup="true"/);
});

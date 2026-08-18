import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'));
const readiness = await readFile(new URL('../src/pages/PWAValidation.jsx', import.meta.url), 'utf8');

test('PWA manifest is aligned with Android 1.3 release identity', () => {
  assert.equal(manifest.short_name, 'KriptoAman');
  assert.equal(manifest.version, '1.3.0');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'maskable'));
  assert.ok(manifest.shortcuts.some(item => item.url === '/Market'));
  assert.ok(manifest.shortcuts.some(item => item.url === '/Wallet'));
  assert.ok(manifest.shortcuts.some(item => item.url === '/SecurityHub'));

  const serialized = JSON.stringify(manifest);
  assert.doesNotMatch(serialized, /2\.500\+|2\.000 aset|2500\+|2000\+ assets/i);
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

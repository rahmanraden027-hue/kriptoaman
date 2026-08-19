import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const plugin = await readFile(new URL('../android/app/src/main/java/com/kriptoaman/app/KriptoAmanNativePlugin.java', import.meta.url), 'utf8');
const mainActivity = await readFile(new URL('../android/app/src/main/java/com/kriptoaman/app/MainActivity.java', import.meta.url), 'utf8');
const manifest = await readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
const utility = await readFile(new URL('../src/components/mobile/NativeMobileUtility.jsx', import.meta.url), 'utf8');
const services = await readFile(new URL('../src/pages/Services.jsx', import.meta.url), 'utf8');

test('Android registers the KriptoAman native utility plugin', () => {
  assert.match(plugin, /@CapacitorPlugin\(name = "KriptoAmanNative"\)/);
  assert.match(plugin, /getDeviceStatus/);
  assert.match(plugin, /shareText/);
  assert.match(plugin, /haptic/);
  assert.match(mainActivity, /registerPlugin\(KriptoAmanNativePlugin\.class\)/);
});

test('native utility permissions remain minimal and explicit', () => {
  assert.match(manifest, /android\.permission\.INTERNET/);
  assert.match(manifest, /android\.permission\.ACCESS_NETWORK_STATE/);
  assert.match(manifest, /android\.permission\.VIBRATE/);
  assert.doesNotMatch(manifest, /READ_CONTACTS|READ_SMS|ACCESS_FINE_LOCATION|RECORD_AUDIO/);
});

test('Mobile Utility Center is native-only and surfaced in Services', () => {
  assert.match(utility, /Capacitor\.isNativePlatform\(\)/);
  assert.match(utility, /Mobile Utility Center/);
  assert.match(utility, /NativeUtility\.getDeviceStatus/);
  assert.match(utility, /NativeUtility\.shareText/);
  assert.match(utility, /NativeUtility\.haptic/);
  assert.match(services, /<NativeMobileUtility \/>/);
});

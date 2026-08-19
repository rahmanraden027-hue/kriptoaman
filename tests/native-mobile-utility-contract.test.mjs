import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const plugin = await readFile(new URL('../android/app/src/main/java/com/kriptoaman/app/KriptoAmanNativePlugin.java', import.meta.url), 'utf8');
const mainActivity = await readFile(new URL('../android/app/src/main/java/com/kriptoaman/app/MainActivity.java', import.meta.url), 'utf8');
const manifest = await readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
const utility = await readFile(new URL('../src/components/mobile/NativeMobileUtility.jsx', import.meta.url), 'utf8');
const banner = await readFile(new URL('../src/components/mobile/NativeConnectivityBanner.jsx', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const services = await readFile(new URL('../src/pages/Services.jsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../android/app/src/main/res/values/styles.xml', import.meta.url), 'utf8');
const iconBackground = await readFile(new URL('../android/app/src/main/res/values/ic_launcher_background.xml', import.meta.url), 'utf8');

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

test('Android has explicit native navigation and offline recovery', () => {
  assert.match(mainActivity, /OnBackPressedCallback/);
  assert.match(mainActivity, /canGoBack\(\)/);
  assert.match(mainActivity, /showOfflineRecoveryIfNeeded/);
  assert.match(mainActivity, /NET_CAPABILITY_VALIDATED/);
  assert.match(mainActivity, /Coba lagi/);
});

test('native connectivity loss is surfaced globally without affecting the website', () => {
  assert.match(banner, /Capacitor\.isNativePlatform\(\)/);
  assert.match(banner, /Mode offline/);
  assert.match(banner, /NativeUtility\.getDeviceStatus/);
  assert.match(app, /<NativeConnectivityBanner \/>/);
});

test('Android splash and adaptive icon follow the KriptoAman dark identity', () => {
  assert.match(styles, /windowSplashScreenBackground/);
  assert.match(styles, /windowSplashScreenAnimatedIcon/);
  assert.match(styles, /postSplashScreenTheme/);
  assert.match(iconBackground, /#050D18/i);
});

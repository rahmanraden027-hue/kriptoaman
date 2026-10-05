import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 9C keeps global public copy under singular KRIPTOAMAN identity', async () => {
  const [english, nav, native, about, company] = await Promise.all([
    read('src/pages/EnglishLanding.jsx'),
    read('src/lib/NavigationTracker.jsx'),
    read('src/components/mobile/NativeMobileUtility.jsx'),
    read('src/pages/AboutUs.jsx'),
    read('src/pages/CompanyFacts.jsx'),
  ]);

  assert.match(english, /KRIPTOAMAN · VERIFIED DATA/);
  assert.match(english, /Verified data\./);
  assert.match(english, /Real intelligence\./);
  assert.doesNotMatch(english, /2,000\+/);
  assert.doesNotMatch(english, /\['8', 'supported networks'\]/);

  assert.match(nav, /KriptoAman — Verified Data\. Real Intelligence\./);
  assert.doesNotMatch(nav, /Crypto Intelligence\. Global Market Edge\./);

  assert.match(native, /Market · On-chain · Network · Evidence\. Verified Data\. Real Intelligence\./);
  assert.match(about, /Market · On-chain · Network · Evidence/);
  assert.match(company, /Verified crypto intelligence across market, on-chain, network, and evidence/);
});

test('Phase 9C keeps store-facing app name singular and positioning consistent', async () => {
  const [listing, submission, globalRelease] = await Promise.all([
    read('play-console/STORE_LISTING.md'),
    read('STORE_SUBMISSION_PACKAGE.md'),
    read('GLOBAL_STORE_RELEASE.md'),
  ]);

  assert.match(listing, /App name: `KriptoAman`/);
  assert.match(listing, /Recommended headline: `Verified Data\. Real Intelligence\.`/);
  assert.match(listing, /Recommended support line: `Market · On-chain · Network · Evidence`/);

  assert.match(submission, /Verified Crypto Intelligence/);
  assert.match(submission, /Intelijen Kripto Terverifikasi/);
  assert.match(globalRelease, /Master brand: \*\*KriptoAman\*\*/);
  assert.match(globalRelease, /Intelligence.*feature\/category descriptor/);
});

test('Phase 9C synchronizes current Android platform release identity across store docs', async () => {
  const [listing, submission, globalRelease, playRelease, gradle] = await Promise.all([
    read('play-console/STORE_LISTING.md'),
    read('STORE_SUBMISSION_PACKAGE.md'),
    read('GLOBAL_STORE_RELEASE.md'),
    read('PLAY_STORE_RELEASE.md'),
    read('android/app/build.gradle'),
  ]);

  assert.match(gradle, /platform\s*\{[\s\S]*versionCode\s+13[\s\S]*versionName\s+"1\.5\.6"/);
  assert.match(listing, /Android version: `1\.5\.6`/);
  assert.match(listing, /Version code: `13`/);
  assert.match(submission, /Release line: KriptoAman 1\.5\.6/);
  assert.match(submission, /Android `versionCode`: `13`/);
  assert.match(globalRelease, /Android 1\.5\.6 \(`versionCode 13`\)/);
  assert.match(playRelease, /Versi Android: `1\.5\.6` \(`versionCode 13`\)/);
  assert.match(playRelease, /Trusted `main` run: `37308557602`/);
});

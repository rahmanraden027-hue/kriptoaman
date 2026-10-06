import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Phase 7 device gate measures the HomeV10 market search target independent of locale', async () => {
  const [script, home] = await Promise.all([
    read('.github/scripts/phase7-device-class-browser.mjs'),
    read('src/pages/HomeV10.jsx'),
  ]);

  assert.match(script, /header a\[href="\/Market"\]\[aria-label\]/);
  assert.doesNotMatch(script, /aria-label="Search market"/);
  assert.match(home, /language === 'en' \? 'Search market' : 'Cari market'/);
  assert.match(home, /className="grid h-11 min-h-11 w-11 min-w-11 shrink-0/);
});


test('Phase 10L.4 global acceptance measures the HomeV10 market search target independent of locale', async () => {
  const script = await read('scripts/verify-phase10l4-global-acceptance.mjs');

  assert.match(script, /header a\[href="\/Market"\]\[aria-label\]/);
  assert.doesNotMatch(script, /aria-label="Search market"/);
});

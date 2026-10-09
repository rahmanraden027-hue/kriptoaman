import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const LOGO_CONTRACT = Object.freeze({
  version: '20261008-zevaryq-identity-v2',
  sha256: 'a74790a590757e6f4425d384fdc0cdf40cb8030807eb7c0892ba8aaa4e6fc6cc',
  placements: 2,
  source: '/zevaryq-assets/zevaryq-master-v2.svg?v=20261008-zevaryq-identity-v2',
});

// Visual Master V3 (#1084) deliberately removed the duplicate satellite globe.
// Count actual image tags and verify each approved slot, not ornamental satellites.
export function verifyLogoPlacement(html) {
  const c = LOGO_CONTRACT;
  assert.ok(html.includes(`data-zvq-official-logo="${c.version}"`), 'identity marker');
  assert.ok(html.includes(`data-zvq-logo-integrity="sha256-${c.sha256}"`), 'integrity marker');
  assert.ok(html.includes("EXPECTED_CHAIN='0x560c'"), 'chain guard');
  const images = html.match(/<img\b[^>]*>/g) || [];
  const marks = images.filter(tag => tag.includes('class="official-emblem"'));
  assert.equal(marks.length, c.placements, 'header and primary hero placements');
  for (const tag of marks) assert.ok(tag.includes(`src="${c.source}"`), 'approved image source');
  for (const slot of ['logo logo-zvq', 'earth-brandmark']) {
    const prefix = `<span class="${slot}"`;
    const start = html.indexOf(prefix);
    assert.ok(start >= 0, `missing ${slot}`);
    assert.equal(html.indexOf(prefix, start + prefix.length), -1, `duplicate ${slot}`);
    const openingEnd = html.indexOf('>', start);
    assert.ok(html.slice(openingEnd + 1).startsWith('<img class="official-emblem"'), `missing image in ${slot}`);
  }
  return { placements: c.placements, version: c.version, sha256: c.sha256 };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  assert.ok(process.argv[2], 'usage: node scripts/verify-zvq-logo-placement.mjs HTML');
  console.log(JSON.stringify(verifyLogoPlacement(await readFile(process.argv[2], 'utf8'))));
}

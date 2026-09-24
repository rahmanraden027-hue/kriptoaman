import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../explorer-dashboard/', import.meta.url);
const html = await readFile(new URL('zevaryq-production.html', root), 'utf8');
const approved = [
  ['assets/zevaryq-emblem.webp', '3fcabc6475d975b65b49c5d6a88c5d1c6e64630b11d5674bfc773a92dd2ec95f'],
  ['assets/zevaryq-favicon.png', '7cc9708233c2624b7b4f95b5ae0902c5cf1233e1648b271a5a41ab02dc95fffe'],
];

test('official ZVQ logo assets match the approved gold-and-blue files', async () => {
  for (const [file, expected] of approved) {
    const bytes = await readFile(new URL(file, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, file);
  }
});

test('one official logo is consistently used in header, hero and satellite view', () => {
  assert.match(html, /data-zvq-official-logo="20260924-goldblue-zvq"/);
  assert.match(html, /data-zvq-logo-integrity="sha256-3fcabc6475d975b65b49c5d6a88c5d1c6e64630b11d5674bfc773a92dd2ec95f"/);
  assert.equal((html.match(/class="official-emblem"/g) || []).length, 3);
  assert.equal((html.match(/class="earth-brandmark"/g) || []).length, 2);
  assert.match(html, /class="logo logo-zvq" role="img" aria-label="ZEVARYQ ZVQ official/);
  assert.equal((html.match(/src="\/zevaryq-assets\/zevaryq-emblem\.webp\?v=20260924-goldblue-zvq"/g) || []).length, 3);
  assert.match(html, /zevaryq-favicon\.png\?v=20260924-goldblue-zvq/);
  assert.equal((html.match(/class="official-logo-fallback"/g) || []).length, 3);
});

test('visual-only logo change preserves mainnet and verified-data safeguards', () => {
  assert.match(html, /const EXPECTED_CHAIN='0x560c'/);
  assert.match(html, /data-zvq-token-discovery="indexed-v2"/);
  assert.match(html, /unavailable values are never simulated/);
  assert.match(html, /setInterval\(probe,12000\)/);
  assert.match(html, /@media\(max-width:560px\)/);
});

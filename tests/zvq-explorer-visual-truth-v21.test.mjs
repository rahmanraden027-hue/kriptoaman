import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Script } from 'node:vm';

const root = new URL('../explorer-dashboard/', import.meta.url);
const master = '/zevaryq-assets/zevaryq-master-v2.svg?v=20261008-zevaryq-identity-v2';
const pages = [
  'address-detail.html', 'addresses.html', 'api-docs.html', 'block-detail.html',
  'blocks.html', 'contracts.html', 'developer-docs.html', 'developer-examples.html',
  'developer-starter.html', 'developer-verify.html', 'developer.html', 'index.html',
  'stats.html', 'status.html', 'tokens.html', 'transaction-detail.html',
  'transactions.html', 'validators.html', 'zevaryq-production.html',
];

test('all Explorer routes use the same canonical ZEVARYQ emblem and favicon', async () => {
  for (const name of pages) {
    const html = await readFile(new URL(name, root), 'utf8');
    assert.ok(html.includes(master), name + ': missing canonical logo asset');
    assert.match(html, /rel="icon"[^>]*zevaryq-master-v2\.svg/, name + ': favicon');
    assert.doesNotMatch(html, /<div class="mark">K<\/div>/, name + ': legacy K symbol');
    assert.doesNotMatch(html, /src="https:\/\/kriptoaman\.com\/brand\/(?:zevaryq|kriptoaman)-mark\.svg"/, name + ': legacy external logo');
    if (name !== 'zevaryq-production.html') {
      assert.match(html, /alt="ZEVARYQ Master V2 network emblem"/, name + ': missing accessible brand name');
    }
  }
});

test('globe reads verified chain head only, distinguishing LIVE INDEXED STALE and UNAVAILABLE', async () => {
  const html = await readFile(new URL('zevaryq-production.html', root), 'utf8');
  const css = await readFile(new URL('assets/zvq-v2.css', root), 'utf8');
  const js = await readFile(new URL('assets/zvq-v2.js', root), 'utf8');
  assert.ok(Buffer.byteLength(html) < 100_000, 'production HTML size ceiling');
  assert.match(html, /zvq-v2\.css\?v=20260925[^"]*globe21/);
  assert.match(html, /zvq-v2\.js\?v=20260925[^"]*globe21/);
  assert.match(js, /function renderGlobeProof\(state\)/);
  assert.match(js, /state\.rpc&&Number\.isSafeInteger\(state\.head\)/);
  assert.match(js, /state\.api&&indexed!==null\?'INDEXED'/);
  assert.match(js, /indexed!==null\?'STALE':'UNAVAILABLE'/);
  assert.match(js, /renderGlobeProof\(state\)/);
  assert.match(js, /scene\.dataset\.provenance=source\.toLowerCase\(\)/);
  assert.match(css, /animation-play-state:paused/);
  assert.match(js, /node locations unverified/);
  assert.match(css, /\.zvq-globe-proof\[data-provenance="stale"\]/);
  assert.doesNotThrow(() => new Script(js));
  assert.match(html, /Illustrative visualization; geography appears only with verified evidence/);
});

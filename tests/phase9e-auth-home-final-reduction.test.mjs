import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Phase 9E keeps authenticated Home personal and removes repeated chain telemetry', async () => {
  const home = await read('src/pages/HomeV3.jsx');

  assert.match(home, /MY KRIPTOAMAN/);
  assert.match(home, /MY WORKSPACE/);
  assert.match(home, /Watchlist/);
  assert.match(home, /New Token Radar/);
  assert.match(home, /Asset Passport & Discovery/);

  assert.doesNotMatch(home, /ZEVARYQ EVIDENCE/);
  assert.doesNotMatch(home, /Compact ZEVARYQ evidence/);
  assert.doesNotMatch(home, /\/api\/zvq-token-intelligence/);
});

test('Phase 9E keeps technical verification available without duplicating it inline', async () => {
  const home = await read('src/pages/HomeV3.jsx');

  assert.match(home, /System Evidence/);
  assert.match(home, /SYSTEM STATUS/);
  assert.match(home, /ZEVARYQ Explorer/);
  assert.match(home, /OPEN EXPLORER/);
  assert.match(home, /Verified chain head/);
  assert.match(home, /Verified RPC required/);
});

test('Phase 9E does not touch production mutation surfaces', async () => {
  const home = await read('src/pages/HomeV3.jsx');

  assert.doesNotMatch(home, /eth_sendTransaction/);
  assert.doesNotMatch(home, /eth_sendRawTransaction/);
  assert.doesNotMatch(home, /private key/i);
  assert.doesNotMatch(home, /validator credential/i);
});

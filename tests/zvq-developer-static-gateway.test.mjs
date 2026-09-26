import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDeveloperGateway, ROUTES } from '../scripts/zvq-developer-static-gateway.mjs';

let root, server, base;
before(async () => {
  root = await mkdtemp(join(tmpdir(), 'zvq-developer-'));
  for (const [path, [file]] of Object.entries(ROUTES)) {
    if (path === '/developers') continue;
    await writeFile(join(root, file), path === '/developer/network.json'
      ? JSON.stringify({ chainId: 22028, chainIdHex: '0x560c',
                         nativeCurrency: { symbol: 'ZVQ' } })
      : '<main data-kam-developer-version="1.0.0">ZVQ public documentation</main>');
  }
  server = createDeveloperGateway({ root });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (root) await rm(root, { recursive: true, force: true });
});
test('every exact reviewed page and alias are GET-only without fallback', async () => {
  assert.equal(Object.keys(ROUTES).length, 7);
  for (const path of Object.keys(ROUTES)) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, path);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    if (path.endsWith('.json')) {
      assert.match(res.headers.get('content-type'), /application\/json/);
      assert.equal((await res.json()).chainId, 22028);
    } else {
      assert.match(res.headers.get('content-type'), /text\/html/);
      assert.match(await res.text(), /ZVQ/);
    }
    const head = await fetch(base + path, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const post = await fetch(base + path, { method: 'POST', body: 'x' });
    assert.equal(post.status, 405);
  }
});
test('RPC, admin, prefix, suffix, double slash and encoded paths stay unavailable', async () => {
  for (const path of ['/rpc','/api/admin','/developer/wallet','/developer/../rpc',
                      '//developer','/developer%2fdocs','/developer.json']) {
    const r = await fetch(base + path, { redirect: 'manual' });
    assert.equal(r.status, 404, path);
  }
});
test('cache-busted exact route remains supported; no generic directory', async () => {
  const ok = await fetch(base + '/developer?release=latest');
  assert.equal(ok.status, 200);
  const bad = await fetch(base + '/developer/');
  assert.equal(bad.status, 404);
});
test('missing approved source fails closed instead of serving homepage', async () => {
  await rm(join(root, 'developer-verify.html'));
  const missing = await fetch(base + '/developer/verify');
  assert.equal(missing.status, 503);
  assert.doesNotMatch(await missing.text(), /ZVQ/);
});

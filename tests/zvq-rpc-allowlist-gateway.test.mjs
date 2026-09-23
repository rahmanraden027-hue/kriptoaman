import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRpcGateway, validateRpcPayload, MAX_BODY_BYTES } from '../scripts/zvq-rpc-allowlist-gateway.mjs';

const allowed = { jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] };
test('allowlist accepts chain identity and rejects privileged and write methods', () => {
  assert.equal(validateRpcPayload(allowed), true);
  for (const method of ['admin_peers','debug_traceTransaction','personal_unlockAccount','engine_newPayloadV3','eth_sendRawTransaction','txpool_content']) {
    assert.equal(validateRpcPayload({ ...allowed, method }), false, method);
  }
  assert.equal(validateRpcPayload([allowed]), false, 'batch requests cannot bypass allowlist');
  assert.equal(validateRpcPayload({ ...allowed, params: null }), false);
});
let server, base, calls = 0;
before(async () => {
  server = createRpcGateway({
    upstreamPort: 8545,
    fetchImpl: async (_url, request) => {
      calls++;
      assert.deepEqual(JSON.parse(request.body), allowed);
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x560c' }), {
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });

test('approved read-only RPC forwards exactly one request', async () => {
  const response = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(allowed) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).result, '0x560c');
  assert.equal(calls, 1);
});
test('admin method cannot reach upstream', async () => {
  const response = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...allowed, method: 'admin_peers' }) });
  assert.equal(response.status, 403);
  assert.equal(calls, 1);
});
test('batch cannot bypass method filter', async () => {
  const response = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify([allowed, { ...allowed, method: 'admin_peers' }]) });
  assert.equal(response.status, 403);
  assert.equal(calls, 1);
});
test('oversize payload is rejected without upstream call', async () => {
  const response = await fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...allowed, params: ['x'.repeat(MAX_BODY_BYTES)] }) });
  assert.equal(response.status, 413);
  assert.equal(calls, 1);
});
test('browser CORS permits only approved origins and no private verbs', async () => {
  const good = await fetch(base, { method: 'OPTIONS', headers: { origin: 'https://explorer.kriptoaman.com' } });
  assert.equal(good.status, 204);
  assert.equal(good.headers.get('access-control-allow-origin'), 'https://explorer.kriptoaman.com');
  const bad = await fetch(base, { method: 'OPTIONS', headers: { origin: 'https://attacker.example' } });
  assert.equal(bad.status, 403);
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
  assert.equal(calls, 1);
});
test('deployment cannot run automatically when new code reaches main', () => {
  const workflow = readFileSync(new URL('../.github/workflows/kam-new-host-connectivity.yml', import.meta.url), 'utf8');
  assert.match(workflow, /confirm_rpc_tls:/);
  assert.match(workflow, /default: false/);
  assert.match(workflow, /inputs\.confirm_rpc_tls == true/);
  assert.doesNotMatch(workflow, /^  push:/m);
  const script = readFileSync(new URL('../scripts/finalize-zvq-rpc-origin-https.sh', import.meta.url), 'utf8');
  assert.match(script, /zvq-rpc-allowlist-gateway\.mjs/);
  assert.doesNotMatch(script, /\\\$request_body/);
  assert.match(script, /checkend/);
});

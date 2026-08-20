import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { isAdminRpcBlocked } from '../chain/kam-mainnet/scripts/rpc-security.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('KAM promotion gate accepts transport-level sensitive RPC blocking', () => {
  assert.equal(isAdminRpcBlocked(401, null), true);
  assert.equal(isAdminRpcBlocked(403, null), true);
  assert.equal(isAdminRpcBlocked(404, null), true);
});

test('KAM promotion gate accepts standard JSON-RPC method-not-found responses', () => {
  assert.equal(isAdminRpcBlocked(200, { error: { code: -32601, message: 'Method not found' } }), true);
  assert.equal(isAdminRpcBlocked(200, { error: { code: -32000, message: 'Method is not enabled' } }), true);
});

test('KAM promotion gate rejects an exposed or ambiguous sensitive RPC method', () => {
  assert.equal(isAdminRpcBlocked(200, { result: [] }), false);
  assert.equal(isAdminRpcBlocked(200, { result: [{ id: 'peer' }] }), false);
  assert.equal(isAdminRpcBlocked(200, null), false);
  assert.equal(isAdminRpcBlocked(500, { error: { code: -32601, message: 'Method not found' } }), false);
});

test('KAM public verifier probes every sensitive namespace and records latency', async () => {
  const verifier = await read('chain/kam-mainnet/scripts/verify-public-endpoints.mjs');
  for (const method of [
    'admin_peers',
    'debug_traceTransaction',
    'personal_listAccounts',
    'qbft_getValidatorsByBlockNumber',
  ]) {
    assert.match(verifier, new RegExp(method));
  }
  assert.match(verifier, /sensitiveMethodsBlocked/);
  assert.match(verifier, /latencyMs/);
  assert.match(verifier, /every\(\(probe\) => probe\.ok\)/);
});

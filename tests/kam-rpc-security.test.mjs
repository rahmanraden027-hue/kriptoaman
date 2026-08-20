import assert from 'node:assert/strict';
import test from 'node:test';

import { isAdminRpcBlocked } from '../chain/kam-mainnet/scripts/rpc-security.mjs';

test('KAM promotion gate accepts transport-level admin RPC blocking', () => {
  assert.equal(isAdminRpcBlocked(401, null), true);
  assert.equal(isAdminRpcBlocked(403, null), true);
  assert.equal(isAdminRpcBlocked(404, null), true);
});

test('KAM promotion gate accepts standard JSON-RPC method-not-found responses', () => {
  assert.equal(isAdminRpcBlocked(200, { error: { code: -32601, message: 'Method not found' } }), true);
  assert.equal(isAdminRpcBlocked(200, { error: { code: -32000, message: 'Method is not enabled' } }), true);
});

test('KAM promotion gate rejects an exposed or ambiguous admin RPC method', () => {
  assert.equal(isAdminRpcBlocked(200, { result: [] }), false);
  assert.equal(isAdminRpcBlocked(200, { result: [{ id: 'peer' }] }), false);
  assert.equal(isAdminRpcBlocked(200, null), false);
  assert.equal(isAdminRpcBlocked(500, { error: { code: -32601, message: 'Method not found' } }), false);
});

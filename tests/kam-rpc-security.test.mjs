import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import gateway from '../chain/kam-mainnet/public-rpc-gateway/worker.js';
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
  assert.match(verifier, /KAM_RPC_MAX_LATENCY_MS/);
  assert.match(verifier, /KAM_EXPLORER_MAX_LATENCY_MS/);
  assert.match(verifier, /latencyWithinLimit/);
  assert.match(verifier, /every\(\(probe\) => probe\.ok && probe\.latencyWithinLimit\)/);
});

test('KAM RPC browser root redirects humans to the Developer Console', async () => {
  const response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/', { method: 'GET' }), {});
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://kriptoaman.com/KAMDeveloper');
});

test('KAM RPC health endpoint remains public, candidate-scoped, and reports only origin presence', async () => {
  let response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/health', { method: 'GET' }), {});
  assert.equal(response.status, 200);
  let payload = await response.json();
  assert.equal(payload.service, 'kam-public-rpc-gateway');
  assert.equal(payload.expectedChainId, '0x560c');
  assert.equal(payload.auditOnlyActivation, true);
  assert.equal(payload.originConfigured, false);

  response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/health', { method: 'GET' }), {
    KAM_RPC_ORIGIN: 'https://private-origin.invalid',
  });
  payload = await response.json();
  assert.equal(payload.originConfigured, true);
  assert.equal(JSON.stringify(payload).includes('private-origin.invalid'), false);
});

test('KAM RPC readiness endpoint fails closed when protected origin is not configured', async () => {
  const response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/ready', { method: 'GET' }), {});
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.ready, false);
  assert.equal(payload.reason, 'origin-not-configured');
  assert.equal(payload.expectedChainId, '0x560c');
  assert.equal(payload.chainId, null);
  assert.equal(payload.blockNumber, null);
});

test('KAM RPC origin forwarding is bounded and readiness requires real chain plus block evidence', async () => {
  const worker = await read('chain/kam-mainnet/public-rpc-gateway/worker.js');
  assert.match(worker, /const UPSTREAM_TIMEOUT_MS = 2500;/);
  assert.match(worker, /setTimeout\(\(\) => controller\.abort\(\), timeoutMs\)/);
  assert.match(worker, /signal: controller\.signal/);
  assert.match(worker, /chainId !== EXPECTED_CHAIN_ID/);
  assert.match(worker, /Number\.isSafeInteger\(blockNumber\)/);
  assert.match(worker, /'origin-timeout'/);
  assert.match(worker, /'origin-unreachable'/);
  assert.match(worker, /RPC upstream timeout/);
  assert.match(worker, /RPC upstream unavailable/);
  assert.doesNotMatch(worker, /KAM_RPC_ORIGIN.*console/);
});

test('KAM RPC public gateway still blocks privileged POST methods before upstream', async () => {
  const response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'admin_peers', params: [] }),
  }), {});
  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.error?.code, -32601);
});

test('KAM RPC allowed POST methods still require a configured protected origin', async () => {
  const response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
  }), {});
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.error, 'RPC origin not configured');
});

test('KAM RPC requires JSON content type before parsing a POST body', async () => {
  const response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/', {
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
  }), {});
  assert.equal(response.status, 415);
});

test('KAM RPC applies general and heavy-method edge rate limits', async () => {
  const denied = { limit: async () => ({ success: false }) };
  const allowed = { limit: async () => ({ success: true }) };
  const base = {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
  };
  let response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/', {
    ...base,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
  }), { RPC_RATE_LIMITER: denied });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');

  response = await gateway.fetch(new Request('https://rpc.kriptoaman.com/', {
    ...base,
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_getLogs', params: [{}] }),
  }), { RPC_RATE_LIMITER: allowed, RPC_HEAVY_RATE_LIMITER: denied });
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error?.code, -32005);
});

test('KAM RPC rate-limit configuration has separate general and heavy budgets', async () => {
  const config = await read('chain/kam-mainnet/public-rpc-gateway/wrangler.jsonc');
  assert.match(config, /"RPC_RATE_LIMITER"/);
  assert.match(config, /"limit": 120/);
  assert.match(config, /"RPC_HEAVY_RATE_LIMITER"/);
  assert.match(config, /"limit": 30/);
});

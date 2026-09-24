import test from 'node:test';
import assert from 'node:assert/strict';
import { APPROVED_ORIGINS, assessPreflight, assessChainPost, collectProof }
  from '../scripts/verify-zvq-rpc-cors.mjs';

function approvedHeaders(origin = APPROVED_ORIGINS[0]) {
  return new Headers({ 'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type' });
}

test('approved preflight and exact chain identity pass', () => {
  assert.equal(assessPreflight(204, approvedHeaders(), APPROVED_ORIGINS[0], true).ok, true);
  assert.equal(assessChainPost(200, approvedHeaders(),
    { jsonrpc: '2.0', result: '0x560c' }, APPROVED_ORIGINS[0]).ok, true);
});

test('known live OPTIONS 403 is a failure even when POST succeeds', () => {
  assert.equal(assessPreflight(403, approvedHeaders(), APPROVED_ORIGINS[0], true).ok, false);
});

test('wildcard, missing content-type, unsafe verbs and wrong origin fail closed', () => {
  const wildcard = approvedHeaders();
  wildcard.set('Access-Control-Allow-Origin', '*');
  assert.equal(assessPreflight(204, wildcard, APPROVED_ORIGINS[0], true).ok, false);
  const missing = approvedHeaders();
  missing.delete('Access-Control-Allow-Headers');
  assert.equal(assessPreflight(204, missing, APPROVED_ORIGINS[0], true).ok, false);
  const unsafe = approvedHeaders();
  unsafe.set('Access-Control-Allow-Methods', 'POST, DELETE');
  assert.equal(assessPreflight(204, unsafe, APPROVED_ORIGINS[0], true).ok, false);
  const wrong = approvedHeaders('https://untrusted.invalid');
  assert.equal(assessPreflight(204, wrong, APPROVED_ORIGINS[0], true).ok, false);
});

test('unapproved origin must receive HTTP 403 or 405 without matching CORS', () => {
  const origin = 'https://untrusted.invalid';
  assert.equal(assessPreflight(403, new Headers(), origin, false).ok, true);
  assert.equal(assessPreflight(405, new Headers(), origin, false).ok, true);
  assert.equal(assessPreflight(204, new Headers(), origin, false).ok, false);
  assert.equal(assessPreflight(403, new Headers({ 'Access-Control-Allow-Origin': '*' }),
    origin, false).ok, false);
});

test('POST requires matching CORS and exact chain ID', () => {
  assert.equal(assessChainPost(200, approvedHeaders(),
    { jsonrpc: '2.0', result: '0x1' }, APPROVED_ORIGINS[0]).ok, false);
  assert.equal(assessChainPost(403, approvedHeaders(),
    { jsonrpc: '2.0', result: '0x560c' }, APPROVED_ORIGINS[0]).ok, false);
});

test('mocked external proof collects only redacted read-only evidence', async () => {
  const fetchImpl = async (_url, options) => {
    if (options.method === 'POST') return new Response(
      JSON.stringify({ jsonrpc: '2.0', result: '0x560c' }),
      { status: 200, headers: approvedHeaders() });
    const origin = options.headers.Origin;
    if (origin === 'https://untrusted.invalid') return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: approvedHeaders(origin) });
  };
  const proof = await collectProof({ fetchImpl, rpcUrl: 'http://127.0.0.1:9999/' });
  assert.equal(proof.ready, true);
  assert.equal(proof.checks.length, 3);
  assert.equal(proof.chainPost.chainId, '0x560c');
  assert.equal(proof.checks.every(check => check.ok), true);
  assert.equal(JSON.stringify(proof).includes('privateKey'), false);
});

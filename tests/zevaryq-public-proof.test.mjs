import test from 'node:test';
import assert from 'node:assert/strict';
import { assessPublicProof } from '../scripts/assess-zevaryq-public-proof.mjs';

const core = () => ({
  chainId: { ok: true, value: '0x560c' },
  blockProgress: { ok: true, from: '0x1', to: '0x2' },
  sensitiveMethodsBlocked: { ok: true },
  explorer: { ok: true },
  explorerHeight: { ok: true, distanceBlocks: 1 },
});

test('direct RPC origin is accepted only with all five independent proofs', () => {
  const out = assessPublicProof({ checkedAt: '2026-09-23T05:00:00Z', checks: {
    ...core(), gatewayHealth: { ok: false, status: 404 }, gatewayReady: { ok: false, status: 404 },
  } });
  assert.equal(out.ok, true);
  assert.equal(out.endpointPolicy, 'RPC_ONLY_ORIGIN');
  assert.equal(out.warnings.length, 1);
});

test('gateway endpoints are required when they exist', () => {
  const checks = { ...core(), gatewayHealth: { ok: true, status: 200 }, gatewayReady: { ok: true, status: 200 } };
  assert.equal(assessPublicProof({checks}).ok, true);
  checks.gatewayReady = { ok: false, status: 503 };
  assert.equal(assessPublicProof({checks}).ok, false);
});

test('RPC-only origin must fail if Chain ID, block progress, security or Explorer fails', () => {
  for (const field of ['chainId','blockProgress','sensitiveMethodsBlocked','explorer','explorerHeight']) {
    const checks = { ...core(), gatewayHealth: { ok: false, status: 404 }, gatewayReady: { ok: false, status: 404 } };
    checks[field] = { ok: false };
    const out = assessPublicProof({checks});
    assert.equal(out.ok, false, field + ' was not enforced');
    assert.ok(out.missing.includes(field));
  }
});

test('a 500, missing response, or mixed gateway route errors never pass', () => {
  for (const state of [{health:500,ready:404},{health:404,ready:200},{health:null,ready:null}]) {
    const checks = { ...core(), gatewayHealth: { ok:false,status:state.health }, gatewayReady: { ok:false,status:state.ready } };
    assert.equal(assessPublicProof({checks}).ok, false);
  }
});

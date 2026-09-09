import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../chain/kam-mainnet/eight-gate-readiness.json', import.meta.url), 'utf8'));
const inventory = JSON.parse(await readFile(new URL('../chain/kam-mainnet/pqc-crypto-inventory.json', import.meta.url), 'utf8'));
const evaluator = await readFile(new URL('../chain/kam-mainnet/scripts/evaluate-eight-gates.mjs', import.meta.url), 'utf8');

test('eight-gate policy fails closed while evidence is incomplete', () => {
  assert.equal(manifest.chainId, 22028);
  assert.equal(manifest.status, 'mainnet-candidate-not-public');
  assert.equal(Object.keys(manifest.gates).length, 8);
  assert.equal(Object.values(manifest.gates).every(gate => gate.passed === true), false);
  assert.equal(manifest.policy.allGatesRequired, true);
  assert.equal(manifest.policy.publicQuantumSafeClaimAllowed, false);
  assert.match(evaluator, /REMAIN_MAINNET_CANDIDATE/);
});

test('post-quantum inventory separates signatures, key establishment and present claim boundary', () => {
  assert.equal(inventory.publicQuantumSafeClaimAllowed, false);
  assert.ok(inventory.standards.includes('FIPS 203 ML-KEM'));
  assert.ok(inventory.standards.includes('FIPS 204 ML-DSA'));
  assert.ok(inventory.standards.includes('FIPS 205 SLH-DSA'));
  assert.ok(inventory.systems.some(item => item.system === 'EVM user accounts' && /signature/i.test(item.migration)));
  assert.ok(inventory.systems.some(item => /TLS/.test(item.system) && /ML-KEM/.test(item.migration)));
});

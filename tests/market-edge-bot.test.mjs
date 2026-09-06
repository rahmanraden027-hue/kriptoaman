import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decimalToRaw,
  rawToDecimal,
  profitBps,
  orderedVenuePairs,
  hasSharedAmm,
  evaluateRoundTrip,
} from '../bots/market-edge/lib.mjs';

test('decimal/raw conversion is exact for SOL-like units', () => {
  assert.equal(decimalToRaw('0.05', 9), 50_000_000n);
  assert.equal(rawToDecimal(50_000_000n, 9), '0.05');
});

test('profit bps uses integer arithmetic', () => {
  assert.equal(profitBps(100_000n, 101_000n), 100);
  assert.equal(profitBps(100_000n, 99_000n), -100);
});

test('ordered venue pairs never self-trade', () => {
  const pairs = orderedVenuePairs(['A', 'B', 'C']);
  assert.equal(pairs.length, 6);
  assert.ok(pairs.every(([a, b]) => a !== b));
});

test('shared AMM account is rejected', () => {
  const a = { routePlan: [{ swapInfo: { ammKey: 'POOL_A' } }] };
  const b = { routePlan: [{ swapInfo: { ammKey: 'POOL_A' } }] };
  const c = { routePlan: [{ swapInfo: { ammKey: 'POOL_B' } }] };
  assert.equal(hasSharedAmm(a, b), true);
  assert.equal(hasSharedAmm(a, c), false);
});

test('net edge subtracts execution-cost buffer', () => {
  const result = evaluateRoundTrip({ inputRaw: 1_000_000n, outputRaw: 1_010_000n, executionCostBps: 25, minNetProfitBps: 50 });
  assert.equal(result.grossProfitBps, 100);
  assert.equal(result.netProfitBps, 75);
  assert.equal(result.profitable, true);
});

test('a small gross edge is not called profitable after buffers', () => {
  const result = evaluateRoundTrip({ inputRaw: 1_000_000n, outputRaw: 1_004_000n, executionCostBps: 20, minNetProfitBps: 30 });
  assert.equal(result.grossProfitBps, 40);
  assert.equal(result.netProfitBps, 20);
  assert.equal(result.profitable, false);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../functions/api/kam/network-status.js', import.meta.url), 'utf8');

test('KAM public status uses a bounded fail-fast network probe', () => {
  assert.match(source, /const NETWORK_PROBE_TIMEOUT_MS = 1100;/);
  assert.match(source, /const WALLET_PROBE_TIMEOUT_MS = 1800;/);
  assert.match(source, /async function rpcWithTimeout/);
  assert.match(source, /setTimeout\(\(\) => controller\.abort\(\), timeoutMs\)/);
  assert.match(source, /Promise\.all\(\[\s*rpcWithTimeout\('eth_chainId'\),\s*rpcWithTimeout\('eth_blockNumber'\)/);
});

test('KAM readiness remains fail closed and requires real chain identity plus a block', () => {
  assert.match(source, /chainIdHex\.toLowerCase\(\) === EXPECTED_CHAIN_ID_HEX/);
  assert.match(source, /if \(!verified\) throw new Error\('RPC chain ID mismatch'\)/);
  assert.match(source, /const blockNumber = Number\(BigInt\(blockHex\)\)/);
  assert.match(source, /!Number\.isSafeInteger\(blockNumber\) \|\| blockNumber < 0/);
  assert.match(source, /live: true,\s*verified: true,\s*status: 'mainnet-candidate-rpc-verified',\s*blockNumber/);
  assert.match(source, /live: false,\s*verified: false,\s*blockNumber: null/);
  assert.doesNotMatch(source, /status:\s*'public-mainnet'/);
});

test('degraded anonymous status is edge-cached while wallet lookups remain private', () => {
  assert.match(source, /DEGRADED_PUBLIC_STATUS_CACHE = 'public, max-age=10, s-maxage=60, stale-while-revalidate=120'/);
  assert.match(source, /VERIFIED_PUBLIC_STATUS_CACHE = 'public, max-age=5, s-maxage=20, stale-while-revalidate=40'/);
  assert.match(source, /address \? 'no-store' : VERIFIED_PUBLIC_STATUS_CACHE/);
  assert.match(source, /address \? 'no-store' : DEGRADED_PUBLIC_STATUS_CACHE/);
});

test('public response exposes probe timing but never a private origin secret', () => {
  assert.match(source, /probeDurationMs: Date\.now\(\) - probeStartedAt/);
  assert.doesNotMatch(source, /KAM_RPC_ORIGIN/);
  assert.doesNotMatch(source, /process\.env/);
});

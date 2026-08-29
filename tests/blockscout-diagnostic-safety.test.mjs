import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../scripts/diagnose-blockscout.mjs', import.meta.url), 'utf8');

test('diagnostic uses only read-only JSON-RPC methods', () => {
  for (const method of ['eth_chainId', 'eth_blockNumber', 'eth_getTransactionReceipt']) {
    assert.match(source, new RegExp(method));
  }
  for (const forbidden of [
    'eth_sendTransaction',
    'eth_sendRawTransaction',
    'personal_sign',
    'eth_sign',
    'wallet_',
    'admin_',
    'debug_',
    'qbft_',
  ]) {
    assert.doesNotMatch(source, new RegExp(forbidden));
  }
});

test('diagnostic validates KAM chain identity and Blockscout height', () => {
  assert.match(source, /0x560c/);
  assert.match(source, /\/api\/v2\/blocks/);
  assert.match(source, /\/api\/v2\/stats/);
  assert.match(source, /distance <= 5/);
  assert.doesNotMatch(source, /Math\.random/);
});

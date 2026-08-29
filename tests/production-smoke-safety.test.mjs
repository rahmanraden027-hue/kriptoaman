import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../scripts/production-smoke.mjs', import.meta.url), 'utf8');

test('production smoke only uses approved read-only RPC methods', () => {
  const methods = [...source.matchAll(/rpc\('([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(methods.sort(), ['eth_blockNumber', 'eth_chainId']);
});

test('production smoke contains no transaction submission or signing methods', () => {
  for (const forbidden of ['eth_sendTransaction', 'eth_sendRawTransaction', 'personal_sign', 'eth_sign', 'wallet_']) {
    assert.equal(source.includes(forbidden), false, `forbidden method marker found: ${forbidden}`);
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ACCOUNTS, RPCS, compareBlock, createRpc, format18, verify } from '../scripts/verify-zvq-same-block-balances.mjs';

const H = '0x' + 'a'.repeat(64);
const P = '0x' + 'b'.repeat(64);

function fixture({ badBalance = false, badBlock = false, stagnant = false, wrongChain = false } = {}) {
  const observed = [];
  const heights = new Map(RPCS.map(url => [url, 0]));
  async function rpc(url, method, params = []) {
    observed.push({ url, method, params });
    if (method === 'eth_chainId') return wrongChain && url === RPCS[1] ? '0x1' : '0x560c';
    if (method === 'eth_blockNumber') {
      const calls = heights.get(url) + 1;
      heights.set(url, calls);
      return stagnant && url === RPCS[1] ? '0x100' : calls === 1 ? '0x100' : '0x101';
    }
    if (method === 'eth_getBlockByNumber') {
      return { number: params[0], hash: badBlock && url === RPCS[1] ? '0x' + 'c'.repeat(64) : H,
        parentHash: P };
    }
    if (method === 'eth_getBalance') {
      const amount = params[0] === ACCOUNTS[0].address ? 100n * 10n ** 18n : 0n;
      return '0x' + (badBalance && url === RPCS[1] ? amount + 1n : amount).toString(16);
    }
    throw Error('Unexpected method');
  }
  return { rpc, observed };
}
test('two RPCs agree on Chain ID, advancing heads, exact block hash and both balances', async () => {
  const { rpc, observed } = fixture();
  const data = await verify({ rpc, sleep: async () => {} });
  assert.equal(data.chain_id, 22028);
  assert.equal(data.common_block_number, '0xff');
  assert.equal(data.common_block_hash, H);
  assert.equal(data.balances.length, 2);
  assert.equal(data.balances[0].balance_zvq, '100.000000000000000000');
  assert.equal(data.balances[1].balance_zvq, '0.000000000000000000');
  assert.ok(data.balances.every(x => x.providers_agree && !x.ownership_verified));
  assert.equal(data.transactions_sent, 0);
  assert.equal(observed.length, 12);
  assert.ok(observed.every(({method}) =>
    ['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getBalance'].includes(method)));
  assert.ok(observed.filter(x => x.method === 'eth_getBalance').every(x => x.params[1] === '0xff'));
});
test('wrong network, stale RPC, divergent block or balance must fail closed', async () => {
  for (const change of [
    [{ wrongChain: true }, /Wrong Chain ID/],
    [{ stagnant: true }, /did not advance/],
    [{ badBlock: true }, /block hash or parent mismatch/],
    [{ badBalance: true }, /balances disagree/],
  ]) {
    const { rpc } = fixture(change[0]);
    await assert.rejects(verify({ rpc, sleep: async () => {} }), change[1]);
  }
});
test('only allowlisted public endpoints and read-only JSON-RPC methods may be called', async () => {
  const calls = [];
  const rpc = createRpc(async (url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body), method: opts.method });
    return { ok: true, json: async () => ({ jsonrpc:'2.0', result:'0x560c' }) };
  });
  assert.equal(await rpc(RPCS[0], 'eth_chainId'), '0x560c');
  await assert.rejects(rpc('https://unknown.example', 'eth_chainId'), /Unapproved/);
  await assert.rejects(rpc(RPCS[0], 'eth_sendRawTransaction'), /Non-read/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].body.method, 'eth_chainId');
});
test('big-integer formatting and malformed block evidence', () => {
  assert.equal(format18(1n), '0.000000000000000001');
  assert.equal(format18(1234567890123456789n), '1.234567890123456789');
  assert.throws(() => compareBlock({ number:'0x1', hash:H, parentHash:P },
      { number:'0x1', hash:'0x'+'e'.repeat(64), parentHash:P }, 1n), /mismatch/);
});

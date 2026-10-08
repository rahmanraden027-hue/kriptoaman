import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  verify, parsePublicAddress, makeRpc, RPCS, LEGACY,
} from '../scripts/probe-zvq-genesis-continuity-readonly.mjs';

const H0 = '0x' + 'a'.repeat(64);
const H240 = '0x' + 'b'.repeat(64);
const TX = LEGACY.recordedTx;
const ADDRESS = '0x9d4b034758202ce555504d038f92a344540d47b0';

function mocked(overrides = {}) {
  const calls = [];
  const rpc = async (endpoint, method, params = []) => {
    calls.push({ endpoint, method, params });
    const index = RPCS.indexOf(endpoint);
    const defaults = {
      eth_chainId: '0x560c',
      eth_blockNumber: index === 0 ? '0x93000' : '0x93002',
      eth_getBlockByNumber: params[0] === '0x0'
        ? { number: '0x0', hash: H0 } : { number: '0x3a998', hash: H240 },
      eth_getTransactionReceipt: {
        transactionHash: TX, blockNumber: '0x3a998', blockHash: H240, status: '0x1',
      },
      eth_getCode: '0x',
      eth_getBalance: '0xde0b6b3a7640000',
      eth_getTransactionCount: '0x1',
    };
    const value = overrides[method];
    return typeof value === 'function' ? value({ endpoint, index, method, params }) : value !== undefined ? value : defaults[method];
  };
  return { rpc, calls };
}

test('read-only historical anchors agree, but original KAM archive proof remains pending', async () => {
  const { rpc, calls } = mocked();
  const result = await verify({ rpc });
  assert.equal(result.genesisHash, H0);
  assert.equal(result.legacyBlockHash, H240);
  assert.equal(result.legacyWkamReceiptStatus, 'PRESENT_AT_RECORDED_BLOCK');
  assert.equal(result.authoritativeContinuity, 'NOT_YET_PROVEN');
  assert.equal(result.walletOwnershipVerified, false);
  assert.equal(result.transactionBroadcasts, 0);
  assert.equal(result.genesisWalletEvidence, 'AWAITING_CONFIRMED_PUBLIC_ADDRESS');
  assert.equal(calls.length, 12);
  assert(calls.every(c => !/send|sign|personal|admin|debug/i.test(c.method)));
});

test('public wallet input measures balances/nonce without claiming ownership', async () => {
  const { rpc, calls } = mocked();
  const result = await verify({ rpc, genesisPublicAddress: ADDRESS });
  assert.equal(result.genesisWalletPublicAddress, ADDRESS);
  assert.equal(result.endpointReadings[0].walletBalanceWei, '1000000000000000000');
  assert.equal(result.endpointReadings[1].walletNonce, '1');
  assert.equal(result.walletOwnershipVerified, false);
  assert(calls.some(c => c.method === 'eth_getBalance'));
  assert(calls.some(c => c.method === 'eth_getTransactionCount'));
  assert.equal(calls.length, 16);
});

test('historic receipt missing is a gap, not evidence that chain was reset', async () => {
  const { rpc } = mocked({ eth_getTransactionReceipt: null });
  const result = await verify({ rpc });
  assert.equal(result.legacyWkamReceiptStatus, 'MISSING');
  assert.equal(result.authoritativeContinuity, 'NOT_YET_PROVEN');
});

test('different block zero hashes fail closed', async () => {
  const { rpc } = mocked({ eth_getBlockByNumber: ({ index, params }) => (
    params[0] === '0x0'
      ? { number: '0x0', hash: index === 0 ? H0 : '0x' + 'c'.repeat(64) }
      : { number: '0x3a998', hash: H240 }
  ) });
  await assert.rejects(() => verify({ rpc }), /Genesis hash.*disagree/);
});

test('wrong chain ID fails before historical reading', async () => {
  const { rpc, calls } = mocked({ eth_chainId: '0x1' });
  await assert.rejects(() => verify({ rpc }), /Chain ID mismatch/);
  assert.equal(calls.length, 1);
});

test('receipt cannot contradict recorded historical block', async () => {
  const { rpc } = mocked({ eth_getTransactionReceipt: {
    transactionHash: TX, blockNumber: '0x3a998', blockHash: H0,
  } });
  await assert.rejects(() => verify({ rpc }), /receipt does not match/);
});

test('public address validation rejects a malformed address or secret-shaped input', () => {
  assert.equal(parsePublicAddress(null), null);
  assert.equal(parsePublicAddress(ADDRESS.toUpperCase().replace('0X', '0x')), ADDRESS);
  assert.throws(() => parsePublicAddress('seed phrase'), /Invalid public genesis address/);
  assert.throws(() => parsePublicAddress('0xd74ea7d92bbb40d475bcea170367b85971acb0f'), /Invalid public genesis address/);
});

test('RPC allowlist rejects writes and unexpected endpoints with no fetch call', async () => {
  let called = false;
  const rpc = makeRpc(async () => { called = true; throw new Error('unexpected fetch'); });
  await assert.rejects(() => rpc(RPCS[0], 'eth_sendRawTransaction', ['0xdead']), /Non-read-only/);
  await assert.rejects(() => rpc('https://evil.example/', 'eth_getBalance', [ADDRESS, 'latest']), /allowlisted/);
  assert.equal(called, false);
});

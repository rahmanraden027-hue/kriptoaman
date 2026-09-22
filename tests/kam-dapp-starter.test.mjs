import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ZEVARYQ_NETWORK,
  KAM_NETWORK,
  explorerAddressUrl,
  explorerTxUrl,
} from '../examples/kam-dapp-starter/kam-network.js';

test('ZEVARYQ dApp starter uses canonical public network parameters', () => {
  assert.equal(ZEVARYQ_NETWORK.name, 'ZEVARYQ Mainnet');
  assert.equal(ZEVARYQ_NETWORK.chainId, 22028);
  assert.equal(ZEVARYQ_NETWORK.chainIdHex, '0x560c');
  assert.equal(ZEVARYQ_NETWORK.nativeCurrency.symbol, 'ZVQ');
  assert.equal(ZEVARYQ_NETWORK.nativeCurrency.decimals, 18);
  assert.equal(new URL(ZEVARYQ_NETWORK.rpcUrl).hostname, 'rpc.kriptoaman.com');
  assert.equal(new URL(ZEVARYQ_NETWORK.explorerUrl).hostname, 'explorer.kriptoaman.com');
  assert.equal(KAM_NETWORK, ZEVARYQ_NETWORK);
});

test('KAM dApp starter validates Explorer transaction and address identifiers', () => {
  const tx = `0x${'a'.repeat(64)}`;
  const address = `0x${'b'.repeat(40)}`;
  assert.equal(new URL(explorerTxUrl(tx)).pathname, `/tx/${tx}`);
  assert.equal(new URL(explorerAddressUrl(address)).pathname, `/address/${address}`);
  assert.throws(() => explorerTxUrl('0x1234'), /Invalid transaction hash/);
  assert.throws(() => explorerAddressUrl('0x1234'), /Invalid address/);
});
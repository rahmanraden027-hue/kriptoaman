import assert from 'node:assert/strict';
import test from 'node:test';
import {
  KAM_NETWORK,
  explorerAddressUrl,
  explorerTxUrl,
} from '../examples/kam-dapp-starter/kam-network.js';

test('KAM dApp starter uses canonical public network parameters', () => {
  assert.equal(KAM_NETWORK.name, 'KriptoAman Mainnet');
  assert.equal(KAM_NETWORK.chainId, 22028);
  assert.equal(KAM_NETWORK.chainIdHex, '0x560c');
  assert.equal(KAM_NETWORK.nativeCurrency.symbol, 'KAM');
  assert.equal(KAM_NETWORK.nativeCurrency.decimals, 18);
  assert.equal(new URL(KAM_NETWORK.rpcUrl).hostname, 'rpc.kriptoaman.com');
  assert.equal(new URL(KAM_NETWORK.explorerUrl).hostname, 'explorer.kriptoaman.com');
});

test('KAM dApp starter validates Explorer transaction and address identifiers', () => {
  const tx = `0x${'a'.repeat(64)}`;
  const address = `0x${'b'.repeat(40)}`;
  assert.equal(new URL(explorerTxUrl(tx)).pathname, `/tx/${tx}`);
  assert.equal(new URL(explorerAddressUrl(address)).pathname, `/address/${address}`);
  assert.throws(() => explorerTxUrl('0x1234'), /Invalid transaction hash/);
  assert.throws(() => explorerAddressUrl('0x1234'), /Invalid address/);
});

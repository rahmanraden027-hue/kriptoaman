import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ZEVARYQ wallet retains all wallet-authorized public addresses', async () => {
  const [provider, connector] = await Promise.all([
    read('src/components/web3/Web3Provider.jsx'),
    read('src/components/zevaryq-wallet/ZevaryqWalletConnector.jsx'),
  ]);
  assert.match(provider, /const \[accounts, setAccounts\] = useState\(\[\]\)/);
  assert.match(provider, /setAccounts\(accounts\)/);
  assert.match(provider, /selectAccount/);
  assert.match(provider, /Address is not authorized by the connected wallet/);
  assert.match(provider, /account, accounts, chainId/);
  assert.match(connector, /Authorized Addresses/);
  assert.match(connector, /accounts\.map/);
  assert.match(connector, /selectAccount/);
});

test('ZEVARYQ asset list comes from the real Explorer address holdings endpoint', async () => {
  const [assets, wallet] = await Promise.all([
    read('src/services/zevaryqAssets.js'),
    read('src/pages/Wallet.jsx'),
  ]);
  assert.match(assets, /\/api\/v2\/addresses\/\$\{address\}\/token-balances/);
  assert.match(assets, /cache: 'no-store'/);
  assert.match(assets, /BigInt\(raw\)/);
  assert.match(assets, /BigInt\(raw\) === 0n/);
  assert.match(wallet, /fetchZevaryqTokenAssets/);
  assert.match(wallet, /tokenAssets\.map/);
  assert.match(wallet, /Only balances returned by ZEVARYQ RPC and Explorer indexing are shown/);
  assert.doesNotMatch(assets, /mock|fake|simulated/i);
});

test('token holdings refresh when the active address or ZEVARYQ chain changes', async () => {
  const wallet = await read('src/pages/Wallet.jsx');
  assert.match(wallet, /web3\?\.account,web3\?\.chainId,network\.data\?\.checkedAt/);
  assert.match(wallet, /web3\?\.chainId!==ZEVARYQ\.chainId/);
  assert.match(wallet, /setTokenAssets\(\[\]\)/);
  assert.match(wallet, /assetPhase/);
});

test('native ZVQ stays separate from indexed token assets', async () => {
  const wallet = await read('src/pages/Wallet.jsx');
  assert.match(wallet, /ZVQ · Chain 22028 · Native/);
  assert.match(wallet, /Native balance/);
  assert.match(wallet, /No indexed token holdings/);
});

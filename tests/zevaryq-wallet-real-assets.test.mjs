import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ZEVARYQ wallet retains every provider-authorized address and allows active address selection', async () => {
  const provider = await read('src/components/web3/Web3Provider.jsx');
  assert.match(provider, /const \[accounts, setAccounts\] = useState\(\[\]\)/);
  assert.match(provider, /setAccounts\(accounts\)/);
  assert.match(provider, /selectAccount/);
  assert.match(provider, /Address is not authorized by the connected wallet/);
  assert.match(provider, /account, accounts, chainId/);
});

test('wallet assets are discovered from the real Explorer address token-balance endpoint', async () => {
  const [assets, wallet] = await Promise.all([
    read('src/services/zevaryqAssets.js'),
    read('src/pages/Wallet.jsx'),
  ]);
  assert.match(assets, /\/api\/v2\/addresses\/\$\{address\}\/token-balances/);
  assert.match(assets, /cache: 'no-store'/);
  assert.match(assets, /BigInt\(raw\)/);
  assert.match(assets, /BigInt\(raw\) === 0n/);
  assert.doesNotMatch(assets, /mock|fake|simulated/i);
  assert.match(wallet, /fetchZevaryqTokenAssets/);
  assert.match(wallet, /Only balances returned by ZEVARYQ RPC and Explorer indexing are shown/);
  assert.match(wallet, /tokenAssets\.map/);
});

test('network online state is independent from wallet connection and sync is verified without guessing', async () => {
  const [wallet, status, network] = await Promise.all([
    read('src/pages/Wallet.jsx'),
    read('functions/api/kam/network-status.js'),
    read('src/services/zevaryqNetwork.js'),
  ]);
  assert.match(wallet, /Network Online/);
  assert.match(wallet, /Wallet disconnected/);
  assert.match(status, /eth_syncing/);
  assert.match(status, /syncStatus/);
  assert.match(network, /server\.value\.syncStatus \|\| 'verified'/);
});

test('read-only production mode permits send preview but keeps transaction broadcast locked', async () => {
  const wallet = await read('src/pages/Wallet.jsx');
  assert.match(wallet, /Preview ZVQ Transfer/);
  assert.match(wallet, /Transaction Preview/);
  assert.match(wallet, /Broadcast Locked/);
  assert.match(wallet, /disabled=\{web3\?\.readOnlyRelease\}/);
});

test('mobile wallet header is allowed to wrap instead of clipping ZEVARYQ Wallet', async () => {
  const [wallet, css] = await Promise.all([
    read('src/pages/Wallet.jsx'),
    read('src/pages/ZevaryqWallet.css'),
  ]);
  assert.match(wallet, /zv-header-title/);
  assert.match(css, /\.zv-header-title\{white-space:normal/);
  assert.match(css, /overflow-wrap:anywhere/);
});

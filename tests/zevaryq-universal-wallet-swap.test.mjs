import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('ZEVARYQ wallet exposes universal EVM discovery and custom-chain onboarding', async () => {
  const [provider, connector, wallet] = await Promise.all([
    read('src/components/web3/Web3Provider.jsx'),
    read('src/components/zevaryq-wallet/ZevaryqWalletConnector.jsx'),
    read('src/pages/Wallet.jsx'),
  ]);

  assert.match(provider, /eip6963:requestProvider/);
  assert.match(provider, /wallet_switchEthereumChain/);
  assert.match(provider, /wallet_addEthereumChain/);
  assert.match(provider, /22028/);
  assert.match(provider, /name:\s*'ZEVARYQ Wallet'/);
  assert.match(provider, /optionalChains:\s*\[22028/);
  assert.match(provider, /addZevaryqNetwork/);

  assert.match(connector, /availableWallets/);
  assert.match(connector, /connectWallet\(wallet\)/);
  assert.match(connector, /connectWalletConnect/);
  assert.match(connector, /Add \/ Switch to ZEVARYQ Mainnet/);
  assert.match(wallet, /setScreen\('connect'\)/);
  assert.match(wallet, /setScreen\('swap'\)/);
});

test('ZEVARYQ native swap is fail-closed and uses verified Chain 22028 contracts only', async () => {
  const [service, ui] = await Promise.all([
    read('src/services/zevaryqSwap.js'),
    read('src/components/zevaryq-wallet/ZevaryqSwap.jsx'),
  ]);

  assert.match(service, /VITE_ZEVARYQ_SWAP_ROUTER/);
  assert.match(service, /VITE_ZEVARYQ_WZVQ/);
  assert.match(service, /VITE_ZEVARYQ_SWAP_TOKENS_JSON/);
  assert.match(service, /getBytecode/);
  assert.match(service, /getAmountsOut/);
  assert.match(service, /swapExactETHForTokens/);
  assert.match(service, /swapExactTokensForETH/);
  assert.match(service, /waitForTransactionReceipt/);
  assert.match(service, /Quote expired/);
  assert.match(ui, /No fallback or simulated price is shown/);
  assert.match(ui, /readOnlyRelease/);
  assert.match(ui, /Confirm Swap in Wallet/);

  assert.doesNotMatch(service, /mockRate|Simulated|simulation/i);
  assert.doesNotMatch(service, /dAC17F958D2ee523a2206206994597C13D831ec7|55d398326f99059fF775485246999027B3197955/);
});

test('legacy swap surfaces never fabricate quotes or destination addresses', async () => {
  const [dex, thor] = await Promise.all([
    read('src/components/web3/Web3DEXSwap.jsx'),
    read('src/components/wallet/swapApi.jsx'),
  ]);

  assert.doesNotMatch(dex, /mockRate|Uniswap V3 \(sim\)|protocol:\s*'Simulated'/);
  assert.match(dex, /No simulated quote will be shown/);
  assert.doesNotMatch(thor, /bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh/);
  assert.match(thor, /Alamat tujuan asli wajib diisi/);
});


test('ZEVARYQ swap catalog exposes native and planned first-party assets without impersonating issuers', async () => {
  const ui = await read('src/components/zevaryq-wallet/ZevaryqSwap.jsx');

  assert.match(ui, /ZEVARYQ Asset Universe/);
  assert.match(ui, /ZEVARYQ_FIRST_PARTY_ASSETS/);
  assert.match(ui, /state: asset\.status/);
  assert.match(ui, /detail: asset\.provenance/);
  assert.match(ui, /icon: asset\.icon/);
  assert.match(ui, /USDT\/USDC issuer assets are not created or imitated by ZEVARYQ/);
  assert.match(ui, /Additional ERC-20 assets appear automatically only from the verified swap registry/);
  assert.doesNotMatch(ui, /symbol: 'ZUSD'/);
  assert.doesNotMatch(ui, /symbol: 'zUSDT'/);
  assert.doesNotMatch(ui, /symbol: 'zUSDC'/);
});


test('ZEVARYQ Assets page renders production ecosystem token icons even before balances are available', async () => {
  const wallet = await read('src/pages/Wallet.jsx');

  assert.match(wallet, /ZEVARYQ Ecosystem Assets/);
  assert.match(wallet, /ZEVARYQ_PLANNED_ASSETS/);
  assert.match(wallet, /ZEVARYQ_ASSET_REGISTRY_VERSION/);
  assert.match(wallet, /data-zvq-production-token-icons=\{ecosystemAssets\.map/);
  assert.match(wallet, /data-token-identity-version=\{ZEVARYQ_ASSET_REGISTRY_VERSION\}/);
  assert.match(wallet, /Planned ecosystem assets/);
  assert.match(wallet, /Identity preview only · not wallet holdings/);
  assert.match(wallet, /PLANNED/);
  assert.match(wallet, /does not imply deployment, backing, liquidity, or issuer affiliation/);
});


test('ZEVARYQ device connection state completes before asynchronous balance refresh', async () => {
  const [provider, wallet] = await Promise.all([
    read('src/components/web3/Web3Provider.jsx'),
    read('src/pages/Wallet.jsx'),
  ]);

  assert.match(provider, /setConnecting\(false\);\s*void refreshBalance\(accounts\[0\], cId\);/);
  assert.match(wallet, /const walletLabel = web3\?\.isConnected[\s\S]*Wallet connected[\s\S]*web3\?\.connecting \? 'Wallet connecting…'/);
});

test('ZEVARYQ Send screen keeps the full source address readable on small devices', async () => {
  const wallet = await read('src/pages/Wallet.jsx');

  assert.match(wallet, /<span>From account<\/span>/);
  assert.match(wallet, /break-all font-mono text-xs leading-5/);
  assert.match(wallet, /aria-label="Copy from account"/);
  assert.doesNotMatch(wallet, /<input readOnly value=\{web3\?\.account\|\|'Wallet not connected'\}/);
});

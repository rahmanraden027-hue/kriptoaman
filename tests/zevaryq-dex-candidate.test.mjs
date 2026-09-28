import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(path, 'utf8');

test('ZEVARYQ DEX candidate matches the wallet real-swap ABI', () => {
  const router = read('chain/zevaryq-mainnet/trading/contracts/ZVQRouter.sol');
  const wallet = read('src/services/zevaryqSwap.js');

  for (const marker of [
    'function WETH()',
    'function getAmountsOut',
    'function swapExactETHForTokens',
    'function swapExactTokensForETH',
  ]) {
    assert.ok(router.includes(marker), `router ABI marker missing: ${marker}`);
  }

  assert.match(router, /address public immutable WZVQ/);
  assert.match(router, /SINGLE_HOP_ONLY/);
  assert.match(router, /amountIn \* 997/);

  assert.match(wallet, /name: 'WETH'/);
  assert.match(wallet, /name: 'getAmountsOut'/);
  assert.match(wallet, /name: 'swapExactETHForTokens'/);
  assert.match(wallet, /name: 'swapExactTokensForETH'/);
});

test('ZEVARYQ candidate is source-only and contains no deployment signer path', () => {
  const files = [
    'chain/zevaryq-mainnet/trading/contracts/WZVQ.sol',
    'chain/zevaryq-mainnet/trading/contracts/ZVQFactory.sol',
    'chain/zevaryq-mainnet/trading/contracts/ZVQPair.sol',
    'chain/zevaryq-mainnet/trading/contracts/ZVQRouter.sol',
    'chain/zevaryq-mainnet/trading/README.md',
  ];
  const combined = files.map(read).join('\n');

  assert.doesNotMatch(combined, /startBroadcast|DEPLOYER_PRIVATE_KEY|LIQUIDITY_PRIVATE_KEY/);
  assert.match(combined, /PUBLIC_SWAP_AUTHORIZED = false/);
  assert.match(combined, /LIQUIDITY_AUTHORIZED = false/);
});

test('candidate never hardcodes issuer stablecoin contracts or claims quote-asset approval', () => {
  const source = [
    read('chain/zevaryq-mainnet/trading/contracts/WZVQ.sol'),
    read('chain/zevaryq-mainnet/trading/contracts/ZVQFactory.sol'),
    read('chain/zevaryq-mainnet/trading/contracts/ZVQPair.sol'),
    read('chain/zevaryq-mainnet/trading/contracts/ZVQRouter.sol'),
  ].join('\n');
  const readiness = read('chain/zevaryq-mainnet/trading/README.md');

  assert.doesNotMatch(source, /USDT|USDt|USDC|0xdAC17F|0x55d3983/i);
  assert.match(readiness, /QUOTE_ASSET_APPROVED = false/);
  assert.match(readiness, /do not create an imitation token/i);
});

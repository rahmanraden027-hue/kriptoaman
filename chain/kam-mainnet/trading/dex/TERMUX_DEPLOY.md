# KAM DEX — guarded Termux deployment

This procedure prepares a Uniswap V2-compatible Factory/Router deployment on KriptoAman Mainnet without committing wallet secrets.

## Fixed network inputs

```sh
export KAM_RPC=https://rpc.kriptoaman.com
export KAM_CHAIN_ID=22028
export WKAM=0x0d8848CE88BB09a81a4248Efdd574d50B98b544A
export DEPLOYER=0x9D4b034758202cE555504d038F92A344540D47B0
```

## Preflight — mandatory

```sh
cast chain-id --rpc-url "$KAM_RPC"
cast code "$WKAM" --rpc-url "$KAM_RPC"
cast call "$WKAM" 'symbol()(string)' --rpc-url "$KAM_RPC"
cast balance "$DEPLOYER" --rpc-url "$KAM_RPC"
```

Expected chain ID is `22028`, WKAM runtime code must be non-empty, and symbol must be `WKAM`.

## Contract compatibility

Use the canonical Uniswap V2 core/periphery source/artifacts. Factory is Solidity 0.5.16 and Router02 is Solidity 0.6.6. Do not casually recompile or edit Pair while keeping a stale hard-coded init-code hash: Router pair-address derivation must match the exact Factory Pair creation bytecode.

Before broadcasting:

1. compile/test the exact source/artifacts;
2. verify the Pair init-code hash used by the router/library matches Factory Pair creation bytecode;
3. simulate/estimate Factory creation;
4. simulate/estimate Router02 creation with `(FACTORY, WKAM)`;
5. use the local `kam-deployer` keystore; never paste a private key into chat, shell history, source files, CI, or Git;
6. KriptoAman currently requires legacy transactions with gas price 0 for this deployment path; verify estimation immediately before broadcast.

## After Factory broadcast

Record and verify all of:

```text
factory address
transaction hash
receipt status == 1
runtime code != 0x
feeToSetter == intended governance/deployer address
```

## After Router02 broadcast

Record and verify all of:

```text
router address
transaction hash
receipt status == 1
runtime code != 0x
router.factory() == deployed factory
router.WETH() == WKAM
```

## Liquidity gate

Do **not** create a production token called USDT, USDC, USD or similar merely to create a market. A production pool requires a genuine ERC-20 quote asset that exists on Chain ID 22028 through a legitimate issuer/bridge or another clearly identified non-stable quote asset.

Do not transfer KAM directly to a pair contract. Once a legitimate quote asset exists, the intended user flow is Router02 `addLiquidityETH`: approve the quote ERC-20 to Router, provide the quote amount plus native KAM value, let Router wrap KAM to WKAM, and receive LP tokens.

The first liquidity ratio establishes the initial AMM price and therefore requires explicit amount/price approval before broadcast.

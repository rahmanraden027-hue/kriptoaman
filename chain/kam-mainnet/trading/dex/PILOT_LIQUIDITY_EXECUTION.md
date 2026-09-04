# KAM Pilot Liquidity Execution

Status: **PREPARED — NOT FUNDED / NOT BROADCAST**

This document defines the final guarded path to create the first real KAM liquidity pool. It does not authorize a fake quote asset, fabricate a market price, or expose any wallet secret.

## Current prerequisites

- KriptoAman Mainnet Chain ID: `22028`
- RPC: `https://rpc.kriptoaman.com`
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- KAM DEX Rev4 internal hardening merged to `main`
- Quote-asset provenance gate merged to `main`
- Factory and Router must be deployed and independently verified before liquidity seeding
- Quote asset must have verified provenance/backing on KAM Mainnet

## Pilot sizing policy

Use a deliberately small first pool. The exact KAM and quote-token amounts must be explicitly chosen before signing. The initial pool ratio becomes the initial AMM price; therefore the repository must not invent or silently choose that ratio.

Do not claim the resulting pool price is an independently discovered market price until real third-party trading exists.

## Required local environment variables

Set these only in the signing environment. Never commit values for private keys or seed phrases.

```bash
export LIQUIDITY_PRIVATE_KEY='SET_LOCALLY_ONLY'
export KAM_ROUTER_ADDRESS='0x...VERIFIED_ROUTER'
export QUOTE_TOKEN_ADDRESS='0x...VERIFIED_QUOTE_ASSET_ON_KAM'
export LIQUIDITY_RECIPIENT='0x...LP_RECIPIENT'
export QUOTE_AMOUNT_UNITS='...'
export KAM_AMOUNT_WEI='...'
export QUOTE_MIN_UNITS='...'
export KAM_MIN_WEI='...'
export LIQUIDITY_DEADLINE_UNIX='...'
```

## Broadcast command

Only after Factory/Router and quote-asset provenance are verified:

```bash
cd chain/kam-mainnet/trading
forge script script/SeedPilotLiquidity.s.sol:SeedPilotLiquidity \
  --rpc-url https://rpc.kriptoaman.com \
  --evm-version paris \
  --broadcast \
  -vvvv
```

Immediately clear the private key variable after the transaction:

```bash
unset LIQUIDITY_PRIVATE_KEY
```

## Mandatory post-transaction evidence

Record only confirmed on-chain facts:

- Factory address
- Router address
- Quote-token contract and provenance source
- Pair address
- Liquidity transaction hash and block
- Actual KAM reserve
- Actual quote-token reserve
- LP recipient and LP token amount
- Router `factory()` and `WKAM()` bindings
- Explorer links
- Small real buy and sell smoke tests

## Hard safety rules

- Never create an imitation USDC/USDT token.
- Never paste a private key or seed phrase into chat, GitHub, logs, CI, screenshots, or documentation.
- Never fabricate volume, circular trades, or fake market activity.
- Do not scale liquidity until wrap/unwrap, add/remove liquidity, buy/sell and reserve accounting are verified with a small pilot.

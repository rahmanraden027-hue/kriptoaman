# KAM DEX / AMM Readiness

This directory contains an **audit candidate**, not a production-approved exchange deployment.

Components:
- `KAMFactory.sol`: creates one pair per token combination.
- `KAMPair.sol`: constant-product AMM pair with LP shares, reentrancy lock, 0.30% swap fee, mint/burn and reserve accounting.
- `KAMRouter.sol`: add/remove liquidity and exact-input single-hop swaps with explicit slippage bounds.

## Production gates

Do not deploy or seed liquidity until all gates pass:
1. Foundry format/build/tests pass with Solidity 0.8.24 and Paris-compatible bytecode.
2. Independent smart-contract review/audit is completed; CI is not a substitute for an external audit.
3. KAM RPC reports Chain ID 22028 and increasing blocks; explorer is synchronized.
4. WKAM contract address is verified from the deployment receipt.
5. Quote asset is a legitimate externally backed/bridged asset. Do **not** create a token named USDT/USDC and represent it as the real stablecoin.
6. Liquidity amounts, treasury authorization, slippage policy and market disclosures are explicitly approved before any funds move.
7. No wash trading, self-dealing volume, fake orders or fabricated market price.

## Current scope limitations

- Single-hop swaps only.
- Standard ERC-20 behavior only; fee-on-transfer/rebasing tokens are unsupported.
- No oracle. Spot pool ratios must not be treated as a secure price oracle.
- No protocol fee switch or privileged admin controls.
- No upgradeability.

The first production pool must remain blocked until a real quote asset and liquidity policy are approved.

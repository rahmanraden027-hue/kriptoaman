# Canonical WKAM for KAM DEX

Status: canonicalization record for audit/readiness. This file does not declare the DEX production-ready and does not authorize treasury movement or liquidity seeding.

## Canonical source

For the KAM DEX and trading stack, the canonical WKAM source is:

`chain/kam-mainnet/trading/contracts/WKAM.sol`

Reason: the recorded Termux deployment script `chain/kam-mainnet/trading/deploy-wkam-termux.mjs` reads `./contracts/WKAM.sol` when executed from the trading directory, and the deployment registry records the corresponding WKAM deployment on KAM Mainnet.

The separate source at `chain/kam-mainnet/contracts/WKAM.sol` must be treated as legacy/reference-only until bytecode equivalence is independently proven. It must not be used for a new router/factory deployment by accident.

## Recorded deployment

- Network: KriptoAman Mainnet
- Chain ID: 22028 (`0x560c`)
- Canonical symbol: WKAM
- Canonical decimals: 18
- Recorded address: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Recorded deployment block: `240024`
- Recorded deployment transaction: `0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf`
- Deployment registry: `chain/kam-mainnet/deployments/wkam.json`

The registry currently records status `deployed-and-wrap-unwrap-tested`. This is repository evidence only; production DEX activation still requires independent explorer/runtime-code verification and smart-contract review.

## DEX binding rule

Every KAM DEX deployment or verification script must bind the router to the canonical WKAM address above only after:

1. RPC confirms Chain ID 22028.
2. Runtime bytecode at the recorded address is non-empty.
3. `symbol()` returns `WKAM` and `decimals()` returns `18`.
4. Wrap and unwrap smoke checks use a deliberately small amount.
5. The deployed runtime/source relationship is independently reviewed.

## Remaining hard gates

- Independent source/security review of WKAM, Factory, Pair and Router.
- Automated DEX tests for pair creation, LP mint/burn, swaps, slippage, refund paths and failure cases.
- Factory/router deployment simulation against Chain ID 22028.
- Legitimate quote-asset provenance.
- Explicit treasury authorization for any liquidity amount and source wallet.
- Real pool creation and small real buy/sell smoke tests only after all previous gates pass.

No fake stablecoin, wash trading, fabricated volume, guaranteed price, guaranteed liquidity, or implied external listing is permitted.

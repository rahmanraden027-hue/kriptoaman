# Canonical WKAM for KAM DEX

Status: source/provenance record for audit and release readiness. This file does not declare the DEX production-ready and does not authorize treasury movement, pair creation, or liquidity seeding.

## Canonical deployed source

The WKAM runtime currently deployed on KriptoAman Mainnet at:

`0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`

was reproduced exactly from:

`chain/kam-mainnet/contracts/WKAM.sol`

The historical deployment script uses the Standard JSON source key `WKAM.sol` with Solidity `0.8.24`, optimizer enabled with `200` runs, and EVM version `paris`. Recompiling that source with those exact inputs produces an exact byte-for-byte deployed runtime match to the live WKAM contract.

The separate file:

`chain/kam-mainnet/trading/contracts/WKAM.sol`

is a later trading-stack variant and does **not** reproduce the currently deployed WKAM runtime. It must not be represented as the source of the live WKAM deployment.

## Reproduction evidence

Read-only source reproduction performed on 2026-09-03 established:

- Compiler: `0.8.24+commit.e11b9ed9.Emscripten.clang`
- Optimizer: enabled, `200` runs
- EVM version: `paris`
- Standard JSON source key: `WKAM.sol`
- Compiled runtime length: `2232` bytes
- On-chain runtime length: `2232` bytes
- Exact runtime match: `true`
- Compiled/on-chain runtime SHA-256: `739d764da5216881769312e6b80f5bbe856b9ded889635a51ac0935e90717c30`
- Compiled/on-chain logic SHA-256: `464d7acacb04d95fc5544cfbc6ba8c6053a551470e9f0df743550335a456140f`

Reproduction helper:

`chain/kam-mainnet/trading/scripts/reproduce-wkam-standard-json.mjs`

## Recorded deployment

- Network: KriptoAman Mainnet
- Chain ID: 22028 (`0x560c`)
- Symbol: WKAM
- Decimals: 18
- Address: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Deployment block: `240024`
- Deployment transaction: `0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf`
- Deployment registry: `chain/kam-mainnet/deployments/wkam.json`

The deployment receipt is present and successful, and its contract address matches the recorded WKAM address.

## DEX binding rule

The KAM Router may only be treated as correctly bound when read-only RPC verification confirms all of the following:

1. Chain ID is `22028`.
2. Runtime bytecode at the WKAM address is non-empty.
3. The deployed WKAM source/runtime reproduction passes with the exact compiler inputs above.
4. Router `WKAM()` resolves to the canonical WKAM address.
5. Router `factory()` resolves to the verified live Factory address.
6. Factory runtime code is present and its source/runtime reproduction passes.

The verified live Factory address is:

`0x5024017B0496113269E80817d9b0F11733AE6de2`

## Current release gates

Completed technical evidence:

- WKAM exact source/runtime reproduction.
- Factory exact source/runtime reproduction with Solidity 0.8.36, optimizer 200, EVM Paris.
- Router exact source/runtime reproduction with Solidity 0.8.36, optimizer 200, EVM Paris.
- Router → Factory binding verified read-only.
- Router → WKAM binding verified read-only.
- Factory pair count observed at `0` during the 2026-09-03 audit pass.
- Deployment provenance for Factory and Router recovered from block `384625`.

Still required before production liquidity activation:

- Independent external smart-contract review of WKAM, Factory, Pair, and Router.
- Legitimate quote-asset provenance and network compatibility verification.
- Explicit treasury authorization for the exact assets, amounts, and source wallet.
- Pair creation and deliberately small liquidity seed only after the previous gates pass.
- Small real buy/sell smoke test only after verified liquidity exists.
- Monitoring and rollback/incident procedures before wider activation.

No fake stablecoin, wash trading, fabricated volume, guaranteed price, guaranteed liquidity, or implied external listing is permitted.

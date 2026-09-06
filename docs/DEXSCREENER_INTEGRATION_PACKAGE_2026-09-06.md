# KAM Network — DEX Screener Integration Package

Date: 2026-09-06
Project: KriptoAman
Operator: PT Kripto Aman Indonesia
Contact: Raden Abdul Rahman, Founder & CEO

## Purpose

This package is prepared to accelerate technical onboarding of **KAM Network / KriptoAman Mainnet** into DEX Screener's blockchain indexer and to provide a single, evidence-oriented reference for the network and the deployed KAM DEX contracts.

This document does **not** claim that DEX Screener has approved or listed KAM Network. It is an integration-readiness package for review.

## Canonical network identity

- Network name: **KriptoAman Mainnet**
- Ecosystem name: **KAM Network**
- EVM-compatible: **Yes**
- Chain ID: **22028**
- Chain ID hex: **0x560c**
- Native asset: **KAM**
- Native decimals: **18**
- Public RPC: `https://rpc.kriptoaman.com`
- Public explorer: `https://explorer.kriptoaman.com`
- Website: `https://kriptoaman.com`
- GitHub: `https://github.com/rahmanraden027-hue/kriptoaman`

The 2026-09-06 production readiness checkpoint verified the RPC identity as Chain ID 22028 and observed progressing blocks. The same checkpoint records a healthy Blockscout core with the explorer indexed within one block of the RPC head at probe time.

Evidence:
- `docs/ECOSYSTEM_CHECKPOINT_2026-09-06.md`
- `chain/kam-mainnet/registry/chainlist-22028.draft.json`
- `chain/kam-mainnet/registry/submissions/ethereum-lists/eip155-22028.json`
- `docs/PRODUCTION_SMOKE.md`

## KAM DEX — deployed mainnet contracts

Observed deployment record:

- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Factory: `0x5024017B0496113269E80817d9b0F11733AE6de2`
- Router: `0x4a413674245EE0959183604C153e386C00409122`
- Factory deployment block: `384625`
- Router deployment block: `384625`
- Factory deployment transaction: `0xddbe3f7265194a068b369d954277f360fcabd2753175c03929d5bebedeb5c0e4`
- Router deployment transaction: `0x83dd3be8629483b2db730c86437128fb39f8b7ceb0738e970bba9c7a9bf98053`

Read-only post-deployment checks recorded runtime bytecode for both Factory and Router and matched the Router bindings to the Factory and WKAM addresses.

Deployment evidence:
- `chain/kam-mainnet/deployments/dex.mainnet.deployment.json`

## Indexer-relevant event model

KAM DEX uses a Uniswap-V2-style constant-product AMM event model.

Factory event:

```solidity
event PairCreated(address indexed token0, address indexed token1, address pair, uint256 index);
```

Pair events:

```solidity
event Mint(address indexed sender, uint256 amount0, uint256 amount1);
event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
event Swap(
    address indexed sender,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out,
    address indexed to
);
event Sync(uint112 reserve0, uint112 reserve1);
```

Source references:
- `chain/kam-mainnet/trading/dex/KAMFactory.sol`
- `chain/kam-mainnet/trading/dex/KAMPair.sol`

The pair contract applies a 0.30% swap fee through the standard constant-product adjusted-balance invariant.

## Current liquidity state

The current deployment record intentionally reports:

- Pair created: **false**
- Liquidity seeded: **false**
- Liquidity status: **NOT_AUTHORIZED**

This is a controlled security posture, not a technical failure. Public liquidity will only be activated after the project's security and treasury authorization gates are satisfied.

DEX Screener documents that, on supported chains/DEXes, tokens become visible automatically after a liquidity pool exists and has at least one transaction. Accordingly, KriptoAman is requesting **chain/indexer onboarding to begin now in parallel**, so that the final controlled pool activation can be indexed without unnecessary delay once authorization is complete.

## Requested DEX Screener onboarding scope

KriptoAman requests review for:

1. KAM Network / KriptoAman Mainnet as a new EVM chain.
2. Public JSON-RPC indexing from `https://rpc.kriptoaman.com`.
3. Block explorer linking through `https://explorer.kriptoaman.com`.
4. KAM DEX Factory indexing using `PairCreated`.
5. KAM Pair indexing using `Mint`, `Burn`, `Swap`, and `Sync`.
6. Recognition of native KAM and canonical WKAM.
7. Confirmation of any additional requirements DEX Screener needs before production indexing can be enabled.

## Security and operational boundaries

- No seed phrase, private key, treasury secret, API credential, or signer secret is part of this package.
- No artificial volume, self-trading, or manufactured market activity is authorized.
- Liquidity activation and trading smoke tests are separate, explicit on-chain actions and will only occur after the relevant internal/external security gates and wallet approvals.
- A submission or support acknowledgement must not be represented publicly as a DEX Screener listing until DEX Screener itself is verifiably indexing the network/pool.

## Technical contact package

For onboarding questions, the KriptoAman team can provide on request:

- Factory and Pair ABI files
- Runtime bytecode/hash attestations
- Example raw RPC calls and expected responses
- Known successful transaction receipt for explorer/indexer validation
- Blockscout API examples
- Test pair/pool identifiers after controlled activation
- Additional event topic hashes and contract source references

## Integration status

**READY FOR DEX SCREENER TECHNICAL REVIEW / INDEXER ONBOARDING REQUEST**

The chain identity is canonicalized at **22028 / 0x560c** across the current production checkpoint and registry metadata. Public liquidity remains intentionally gated until authorization; chain/indexer review can proceed in parallel.
# KAM ↔ Base USDC Liquidity Pilot — Pre-Deployment Plan

Status: **PREPARATION ONLY — NO PRIVATE KEY, NO DEPLOYMENT, NO USDC MOVEMENT**

## Why Base is the current source-chain candidate

Base is EVM-compatible, Hyperlane already supports Base, and Circle currently lists native USDC on Base.

Candidate source asset:
- Network: Base mainnet
- Chain ID: `8453`
- Asset: native Circle USDC
- Canonical address: `0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913`
- Decimals: `6`
- Circle verification: https://help.circle.com/support/en/usdc-supported-blockchains-minting-redemption-faqs?id=kb_article_view&sysparm_article=KB0010590

Destination:
- Network: KriptoAman Mainnet
- Chain ID / proposed Hyperlane domain ID: `22028`
- RPC: `https://rpc.kriptoaman.com`
- Native gas asset: `KAM`

## Important naming rule

Until Circle itself lists Chain ID 22028 as a native USDC network, any destination representation must be clearly disclosed as **bridged USDC**, not native Circle-issued USDC.

No contract may be created merely with the ticker `USDC` and presented as Circle-issued without provenance and bridge backing.

## Target architecture to evaluate

Preferred economic model:

`Base native USDC -> collateral/bridge contract -> Hyperlane messaging/security -> bridged USDC representation on KAM Mainnet`

The implementation should be assessed against Circle's Bridged USDC Standard. Hyperlane has fiat/collateral token route primitives, but their presence does not by itself prove that a particular deployment satisfies every Circle bridge-to-native requirement.

## Stage A — KAM Hyperlane core preflight

Before signing any deployment transaction:

- [ ] KAM RPC returns `eth_chainId = 0x560c`.
- [ ] blocks are progressing.
- [ ] `eth_getStorageAt` works on KAM RPC because Hyperlane deployment tooling may require it.
- [ ] proposed Hyperlane domain ID `22028` is checked for uniqueness at deployment time.
- [ ] deployer address is identified without exposing its private key.
- [ ] deployer has only the minimum KAM needed for deployment/testing.
- [ ] core security configuration is reviewed; production must not rely blindly on a quickstart/default trust model.

Official Hyperlane flow after those checks is conceptually:

```sh
hyperlane registry init
hyperlane core init
hyperlane core deploy
hyperlane send message --relay
```

Keys must be supplied locally by the wallet owner and must never be committed or pasted into repository files, issues, chat, CI logs, or screenshots.

## Stage B — bridge/USDC compatibility review

Before creating a Base ↔ KAM route:

- [ ] verify Base native-USDC bytecode/address against Circle's current documentation;
- [ ] identify the exact Hyperlane collateral/fiat route contracts/version;
- [ ] verify destination token implementation and mint/burn authority model;
- [ ] determine whether the chosen route satisfies Circle Bridged USDC Standard requirements;
- [ ] define pause, rate-limit, ownership and recovery controls;
- [ ] document validator/ISM trust assumptions;
- [ ] reproduce lock/mint and burn/unlock accounting locally/test environment;
- [ ] demonstrate that destination supply cannot exceed source collateral under the reviewed model.

## Stage C — tiny bridge smoke test

Only after Stage A/B pass and treasury explicitly approves a test amount:

1. bridge a tiny amount from Base;
2. verify source collateral increased by the intended amount;
3. verify destination bridged-USDC supply/balance increased by the intended amount;
4. bridge back;
5. verify destination supply was burned/reduced correctly;
6. verify source asset became withdrawable/released correctly;
7. record both-chain transaction hashes and contract addresses.

This smoke test is **bridge verification**, not KAM market liquidity yet.

## Stage D — KAM DEX pilot liquidity

After a legitimate bridged quote asset exists and DEX deployment gates pass:

1. deploy/verify KAMFactory;
2. deploy/verify KAMRouter bound to canonical WKAM;
3. treasury explicitly approves a small KAM + bridged-USDC pilot budget;
4. create the WKAM / bridged-USDC pair;
5. add small reserves;
6. remove a small portion of liquidity to test LP redemption;
7. perform a small KAM -> quote swap;
8. perform a small quote -> KAM swap;
9. verify reserve accounting and explorer events;
10. publish accurate pool/reserve disclosures before enabling public swap.

## What still requires the wallet owner's explicit action

The repository can prepare and verify code/configuration, but the following require a locally controlled wallet signature:

- Hyperlane core deployment transactions;
- bridge/route deployment transactions;
- source-chain USDC approval/locking;
- KAM DEX Factory/Router deployment;
- treasury liquidity deposit.

No private key or seed phrase is required by this repository plan.

## Current state

`SOURCE_CHAIN_CANDIDATE = Base`

`SOURCE_NATIVE_USDC_VERIFIED_BY_ISSUER_DOC = true`

`KAM_HYPERLANE_CORE_DEPLOYED = false`

`BRIDGED_USDC_DEPLOYED = false`

`ROUND_TRIP_BRIDGE_TESTED = false`

`REAL_KAM_DEX_RESERVES = false`

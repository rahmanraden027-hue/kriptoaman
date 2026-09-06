# KAM ↔ Base USDC Bridge Review — 2026-09-06

Status: **SOURCE ASSET VERIFIED / BRIDGE PRE-DEPLOYMENT ONLY / NO TREASURY MOVEMENT AUTHORIZED**

## Decision

Base remains the preferred source-chain candidate for the first externally backed quote-asset pilot on KriptoAman Mainnet.

This decision is based on current issuer documentation confirming that Base has native Circle-issued USDC and on Hyperlane documentation supporting permissionless deployment to new EVM-compatible chains and ERC-20 collateral Warp Routes.

This document does **not** authorize deployment, bridging, liquidity seeding, or any public representation that KAM Mainnet has native Circle-issued USDC.

## Verified source asset

- Source network: Base mainnet
- Chain ID: 8453
- Asset: native Circle-issued USDC
- Contract: `0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913`
- Decimals: 6
- Destination network: KriptoAman Mainnet
- Destination Chain ID: 22028 (`0x560c`)
- Destination RPC: `https://rpc.kriptoaman.com`
- Destination gas asset: KAM

Circle currently lists Base as a native USDC network and identifies the address above as the supported Base USDC contract. Circle does not currently list KriptoAman Mainnet / Chain ID 22028 as a native USDC network.

## Required naming and disclosure

Any destination-chain representation created before Circle independently adds Chain ID 22028 must be clearly described as **bridged USDC** or another unambiguous bridged representation.

It must not be presented as native Circle-issued USDC, and no project-created token may use USDC branding in a way that implies Circle issuance or endorsement.

## Architecture under review

Target economic model:

`Base native USDC -> collateral contract on Base -> Hyperlane messaging/security -> bridged USDC representation on KAM Mainnet`

Hyperlane's current EVM Warp Route flow supports a `collateral` route type for an existing ERC-20 token and requires explicit chain metadata, Mailbox/security configuration, deployment configuration and transaction signatures.

The quickstart flow is suitable for testing; production security must be reviewed separately. Hyperlane's own new-chain documentation describes the fast deployment path as intended for testing, not production.

## Stage A — KAM Hyperlane core preflight

All of the following must pass before any contract deployment is signed:

- [ ] `eth_chainId` returns `0x560c`.
- [ ] block height progresses over repeated probes.
- [ ] `eth_getStorageAt` works on the KAM RPC.
- [ ] gas estimation and transaction receipt APIs work reliably.
- [ ] proposed Hyperlane domain ID 22028 is checked against the current registry at deployment time.
- [ ] KAM chain metadata is prepared for the Hyperlane registry format.
- [ ] deployer public address is recorded without exposing private keys or seed phrases.
- [ ] deployer is funded only with the minimum KAM needed for controlled deployment/testing.
- [ ] Mailbox owner, ProxyAdmin/upgrade authority, ISM, hooks, validator and relayer assumptions are explicitly reviewed.
- [ ] production does not rely on an unreviewed quickstart/default security configuration.

## Stage B — bridged-USDC compatibility review

Before deploying a Base ↔ KAM Warp Route:

- [ ] independently verify the Base USDC contract address against current Circle documentation again on deployment day.
- [ ] freeze the exact Hyperlane CLI/contracts version.
- [ ] identify the exact collateral Warp Route implementation and bytecode.
- [ ] document Base collateral custody/locking semantics.
- [ ] document KAM destination mint/burn authority.
- [ ] define owner/admin, pause, recovery and upgrade authorities.
- [ ] define the Interchain Security Module used for Base ↔ KAM messages.
- [ ] define validator set, thresholds and trust assumptions.
- [ ] define relayer requirements and failure handling.
- [ ] set pilot rate/amount limits before treasury approval.
- [ ] verify that destination circulating supply cannot exceed verifiable source collateral under the reviewed design.
- [ ] compare the proposed token/bridge architecture against Circle's current Bridged USDC Standard.

## Stage C — tiny reversible bridge test

Only after Stages A/B pass and the wallet owner explicitly authorizes a small test budget:

1. deploy the reviewed Hyperlane core/route contracts;
2. verify all deployed contracts on the relevant explorers;
3. approve only a tiny amount of Base USDC;
4. bridge Base -> KAM;
5. record source collateral delta and destination supply/balance delta;
6. bridge KAM -> Base;
7. confirm destination burn/reduction and source release;
8. reconcile accounting exactly;
9. record transaction hashes and deployed addresses;
10. stop and investigate any mismatch before proceeding.

## Stage D — KAM DEX pilot

Only after a legitimate bridged quote asset is proven by a successful round trip:

1. re-verify canonical WKAM;
2. re-verify deployed KAM Factory and Router bindings;
3. explicitly authorize a small treasury pilot amount;
4. create `WKAM / bridged-USDC` pair;
5. seed small real reserves;
6. test LP mint and partial burn/removal;
7. test small KAM -> quote swap;
8. test small quote -> KAM swap;
9. verify `PairCreated`, `Mint`, `Burn`, `Swap`, and `Sync` events;
10. publish accurate pair/reserve/contract disclosures;
11. provide the final pair evidence to DEX Screener for indexer onboarding.

## Security boundaries

- No seed phrase or private key belongs in GitHub, chat, screenshots, tickets, CI, or logs.
- No artificial volume, wash trading, self-trading, or manufactured market activity is authorized.
- No liquidity ratio may be marketed as a guaranteed or official price.
- No public swap UI should be enabled until the quote asset, bridge, pool and smoke tests pass.
- No irreversible authority changes should be made merely to accelerate listing or indexing.

## Current gate state

`SOURCE_CHAIN = Base`

`SOURCE_NATIVE_USDC_ADDRESS_VERIFIED = true`

`DESTINATION_CHAIN = KAM Mainnet / 22028`

`KAM_HYPERLANE_CORE_DEPLOYED = false`

`WARP_ROUTE_DEPLOYED = false`

`ROUND_TRIP_BRIDGE_TESTED = false`

`QUOTE_ASSET_PROVENANCE_VERIFIED = false`

`DEX_LIQUIDITY_AUTHORIZED = false`

`PUBLIC_SWAP_AUTHORIZED = false`

## Next executable step

Proceed with **read-only Stage A RPC compatibility checks and Hyperlane registry/domain review only**. Do not request wallet signatures or move USDC/KAM until Stage A and Stage B are documented as PASS.

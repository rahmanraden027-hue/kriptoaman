# KAM Public Liquidity — Quote Asset Provenance Gate

Status: **PRE-LIQUIDITY REVIEW — NO TREASURY MOVEMENT AUTHORIZED**

This document defines the minimum provenance and security requirements for the counter-asset used in the first public KAM liquidity pool. It does not deploy a bridge, mint a token, authorize treasury funds, seed a pool, or declare any market price.

## Objective

Establish a real, externally backed quote asset on KriptoAman Mainnet before creating a KAM/WKAM public pool.

A quote asset must have verifiable economic backing outside the KAM ecosystem. A project-created token that merely uses the name, ticker, or branding of USDC/USDT is prohibited.

## Current issuer-native status — 2026-09-04

### Circle USDC

Circle's current public supported-blockchain list does not include KriptoAman Mainnet / Chain ID 22028 as a native USDC network.

Official references:
- https://www.circle.com/usdc
- https://help.circle.com/support/en/usdc-supported-blockchains-minting-redemption-faqs?id=kb_article_view&sysparm_article=KB0010590

Therefore no token on Chain ID 22028 may currently be represented as **native Circle-issued USDC** unless Circle later publishes support for the network.

### Tether USDt

Tether's current public supported-protocol list does not include KriptoAman Mainnet / Chain ID 22028.

Official reference:
- https://tether.to/en/supported-protocols/

Therefore no token on Chain ID 22028 may currently be represented as **issuer-native Tether USDt** unless Tether later publishes support for the network.

## Preferred path: standardized bridged USDC

Circle publishes a **Bridged USDC Standard** for EVM blockchains. It is specifically intended to let third-party blockchain teams deploy a bridged form of USDC backed by native USDC locked on another blockchain, with optionality for a future Circle-approved upgrade to native issuance.

Official references:
- https://www.circle.com/bridged-usdc
- https://github.com/circlefin/stablecoin-evm/blob/master/doc/bridged_USDC_standard.md

Important distinctions:
- bridged USDC is created/operated by a third party and is **not native USDC issued by Circle**;
- backing must be traceable to native USDC held/locked on the source chain;
- bridge and token contracts must follow the required security/upgrade design if future bridge-to-native eligibility is desired;
- Circle is not obligated to upgrade a bridged deployment to native USDC;
- branding and user disclosures must clearly distinguish bridged from native USDC.

## Bridge transport candidate: Hyperlane

Hyperlane documents permissionless deployment to a new EVM chain and Warp Routes for moving collateral-backed/synthetic assets between EVM chains.

Official references:
- https://docs.hyperlane.xyz/docs/guides/chains/deploy-hyperlane
- https://docs.hyperlane.xyz/docs/guides/quickstart/deploy-warp-route
- https://docs.hyperlane.xyz/docs/protocol/warp-routes/warp-routes-overview

Hyperlane is a **candidate transport/security framework**, not automatically evidence that a default Warp Route satisfies Circle's Bridged USDC Standard. Compatibility with Circle's token/bridge requirements must be reviewed before any production deployment.

## Required provenance evidence

Before a quote asset can be approved for the first KAM pool, record all of the following:

1. Source-chain network and chain ID.
2. Canonical source token address.
3. Issuer's official page proving that source token is issuer-native.
4. Source-chain collateral/lock contract address.
5. Destination-chain bridged token address.
6. Bridge protocol and exact deployed contract addresses.
7. Bridge security model / ISM / validator assumptions.
8. Pause/emergency and upgrade authorities.
9. Mint/burn or lock/mint accounting model.
10. A reproducible proof that destination circulating supply cannot exceed verifiable backing under the intended bridge model.
11. Explorer verification for every source/destination contract.
12. Clear public naming such as `Bridged USDC` / `USDC.e` or another unambiguous identifier until issuer-native status exists.

## Security gate

Production quote-asset deployment remains blocked until:

- [ ] bridge architecture is selected and documented;
- [ ] Circle Bridged USDC Standard compatibility is either demonstrated or the asset is explicitly disclosed as a non-standard third-party bridged representation;
- [ ] source native-USDC contract is independently verified against Circle's official network documentation;
- [ ] source collateral custody design is reviewed;
- [ ] destination mint authority and bridge message-verification assumptions are reviewed;
- [ ] rate limits / pausing / emergency controls are defined;
- [ ] two-way test transfers succeed with tiny amounts;
- [ ] locked collateral equals or exceeds destination circulating supply in the tested state;
- [ ] recovery procedure for relay/bridge failure is documented;
- [ ] no unresolved Critical/High findings remain from the internal bridge review;
- [ ] treasury owner explicitly authorizes the maximum pilot collateral amount.

## DEX integration gate

Only after quote-asset provenance passes:

1. Re-freeze exact KAM DEX Factory/Pair/Router commit.
2. Re-verify Chain ID `22028` and canonical WKAM.
3. Deploy and source-verify Factory.
4. Deploy and source-verify Router bound to verified Factory + canonical WKAM.
5. Approve a **small pilot** treasury amount.
6. Create the WKAM / approved quote-asset pair.
7. Add small real reserves.
8. Run add/remove-liquidity smoke tests.
9. Run native KAM wrap/unwrap smoke tests.
10. Run small real buy and sell smoke tests from separate test wallets without fabricating volume.
11. Publish pool, token, bridge, reserve, and liquidity-wallet addresses.
12. Only then enable public swap UI and describe KAM as having live DEX liquidity.

## Price integrity

The initial AMM reserve ratio creates an **implied pool price**. It is not an independently discovered or guaranteed market value. No internal scenario price may be advertised as a live market price before real public reserves and real third-party trading exist.

## Authorization state

`QUOTE_ASSET_SELECTED = false`

`QUOTE_ASSET_PROVENANCE_VERIFIED = false`

`BRIDGE_DEPLOYMENT_AUTHORIZED = false`

`TREASURY_COLLATERAL_AUTHORIZED = false`

`DEX_LIQUIDITY_AUTHORIZED = false`

`PUBLIC_SWAP_AUTHORIZED = false`

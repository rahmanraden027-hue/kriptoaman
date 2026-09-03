# KAM DEX Quote-Asset Fallback Research — 2026-09-03

Status: **RESEARCH ONLY / NO BRIDGE OR TOKEN DEPLOYMENT AUTHORIZED**

## Primary path

The preferred first quote asset remains legitimate externally-backed USDC through an officially supported Circle/CCTP route for KAM Mainnet Chain ID 22028.

Circle has been contacted for network-integration requirements. Until Circle confirms support and a destination asset contract/provenance, native USDC/CCTP on KAM Mainnet is not considered available.

## Wormhole observation

Current Wormhole documentation describes Connect routes including Wrapped Token Transfers, CCTP and NTT, and provides a formal supported-network matrix. KAM Mainnet is not presently verified as an active Wormhole-supported network.

Wormhole also documents active new-chain expansion through its newer Executor framework and provides a public integration outreach route. This makes Wormhole a potential provider to evaluate, but **not** a current approved quote-asset route for KAM Mainnet.

Requirements before any Wormhole-backed candidate could pass:

- attributable confirmation that KAM Mainnet is supported by the required Wormhole product(s);
- canonical Wormhole contract addresses/deployment provenance on KAM Mainnet;
- explicit origin/destination asset mapping;
- withdrawal/redemption back to origin demonstrated;
- security model and Guardian/Executor dependencies documented;
- external auditor acceptance for the exact route.

## Hyperlane observation

Hyperlane documents permissionless Warp Routes for ERC-20 movement across chains. This could technically support a bridge-backed asset route on a custom EVM chain, but a self-deployed Warp Route would **not** by itself make the destination asset issuer-canonical USDC/WETH.

Therefore Hyperlane is only a fallback research path. It must not be represented as Circle-native USDC or canonical WETH without the relevant issuer/provider provenance.

A Hyperlane-backed candidate would require:

- exact origin collateral asset and custody model;
- exact destination token contract;
- Interchain Security Module configuration and validator/security assumptions;
- relayer availability and liveness assumptions;
- demonstrated round-trip withdrawal/redemption;
- independent review of the route and contracts;
- explicit naming in UI/docs as bridge-backed rather than issuer-native where applicable.

## Decision rule

Do not select a fallback merely because it is deployable quickly.

The first KAM DEX quote asset must have:

1. attributable provenance;
2. reproducible on-chain contract identity;
3. a working withdrawal path;
4. a security model acceptable to the independent auditor;
5. factual user-facing naming that does not imply issuer-native status unless true.

Until one candidate satisfies all five, Gate D remains **HOLD**.

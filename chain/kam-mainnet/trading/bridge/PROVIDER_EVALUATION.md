# KAM Mainnet Bridge Provider Evaluation

Status: **EVALUATION ONLY — NO BRIDGE DEPLOYMENT OR ASSET MOVEMENT AUTHORIZED**

## Objective
Select a legitimate, externally verifiable path to bring an independent counter-asset to KriptoAman Mainnet (Chain ID `22028`) for the first KAM DEX liquidity pool.

## Current DEX anchors
- KAMFactory: `0x5024017B0496113269E80B17d9b0F11733AE6de2`
- KAMRouter: `0x4a413674245EE0959183604C153e386C00409122`
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Preferred first counter-asset: officially supported USDC; alternative: WETH with explicit bridge provenance.

## Provider assessment

### 1. Hyperlane — preferred technical evaluation path
Hyperlane documents permissionless deployment to new EVM-compatible chains. Its process supports deploying core Mailbox/ISM infrastructure and Warp Routes for token bridging, followed by submission to the canonical registry for wider discoverability.

Why it is the current preferred candidate:
- Explicit documentation for custom/new EVM chains.
- Can use Chain ID / RPC metadata for a new network.
- Warp Routes provide a documented token-bridge pattern.
- Registry submission creates an external verification path.

Production cautions:
- Permissionless deployment is not the same as a managed/provider-supported production integration.
- Security model, validator/ISM configuration, relayer availability, ownership, upgrade authority and monitoring must be independently reviewed.
- Do not call any bridged asset `USDC`, `USDT` or `WETH` as canonical unless its issuer/bridge provenance supports that exact representation.

### 2. Across — not currently eligible for KAM
Across exposes a fixed live supported-chain list through its Swap API and published contracts. KAM Mainnet / Chain ID 22028 is not currently documented as a supported production chain. Treat Across as a future provider-outreach candidate, not an executable route today.

### 3. Wormhole — future provider/integration candidate
Wormhole publishes a defined supported-network set and token-transfer tooling. KAM Mainnet is not currently documented in its supported-network list. Integration would require explicit network onboarding/support before any KAM route is considered production-ready.

### 4. LayerZero — future onboarding candidate
LayerZero supports adding networks to applications when a valid LayerZero Endpoint/EID and pathway infrastructure exist. No KAM Mainnet Endpoint/EID has been verified. Therefore no LayerZero bridge route is authorized at this stage.

## Recommended path
1. Evaluate Hyperlane first in an isolated, non-production integration track.
2. Prepare KAM chain metadata and security architecture without broadcasting contracts.
3. Decide target origin network (Ethereum Mainnet preferred for WETH-style path).
4. Define the representation model: lock/mint, burn/mint, collateralized synthetic, or other documented mechanism.
5. Perform independent security review of Mailbox/ISM/validator/relayer ownership and recovery controls.
6. Only after the security model is approved, deploy a minimal bridge test path using a clearly named non-canonical test asset.
7. Verify round-trip deposit and withdrawal with a very small amount.
8. Submit KAM metadata/deployments to the relevant external registry when appropriate.
9. Only after external provenance is established, select the production counter-asset and create a small WKAM/counter-asset pool.

## Hard stops
- No ETH/USDC may be sent to WKAM, Factory or Router as a substitute for bridging.
- No token may be branded as official USDC/USDT/WETH without issuer/bridge provenance.
- No production bridge deployment from CI.
- No bridge private keys, validator keys or treasury keys in source control or chat.
- No DEX liquidity seeding before round-trip bridge withdrawal is demonstrated and treasury authorization is recorded.

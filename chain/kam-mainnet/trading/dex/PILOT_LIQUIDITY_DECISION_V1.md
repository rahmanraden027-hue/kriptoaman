# KAM DEX Pilot Liquidity Decision V1

Status: **APPROVED FOR PILOT PREPARATION — NOT YET FUNDED ON-CHAIN**

## Pilot objective

Create the smallest practical, fully documented KAM liquidity pilot after all prerequisite deployments and provenance checks pass. This is a technical liquidity bootstrap and must not be represented as independently discovered market price or organic trading volume.

## Approved pilot target

- KAM side: **100 KAM**
- Quote side: **20 bridged USDC** sourced from issuer-verified native USDC on Base through the reviewed bridge route
- Quote token decimals: expected **6**
- KAM decimals: **18**
- Pool: **WKAM / bridged USDC**
- LP recipient: wallet owner to provide locally at signing time

The reserve ratio above is only the initial pilot pool ratio. It is not a valuation opinion, exchange listing price, guaranteed price, or independently discovered market price.

## Hard prerequisites before any deposit

1. Hyperlane core for KAM Mainnet deployed and verified.
2. Base native-USDC source address re-verified against current Circle documentation immediately before bridge deployment.
3. Exact bridge/route implementation, security model, ownership, rate limits and recovery controls documented.
4. Tiny bridge round-trip test passes before the full 20-USDC pilot quote amount is used.
5. Destination bridged-USDC contract address and backing evidence recorded.
6. KAMFactory deployed and verified on Chain ID 22028.
7. KAMRouter deployed and verified with canonical WKAM `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`.
8. Wallet owner confirms public LP-recipient address and signs transactions locally.
9. No private key, seed phrase or mnemonic is pasted into chat, repository, issue, PR, screenshot or CI logs.

## Execution sequence

1. Bridge a tiny test amount Base -> KAM.
2. Verify collateral and destination supply/balance.
3. Bridge the tiny amount back and verify burn/unlock accounting.
4. Bridge the quote amount required for the pilot.
5. Deploy/verify KAMFactory and KAMRouter if not already deployed.
6. Re-check KAM RPC chain ID and canonical WKAM runtime.
7. Run `SeedPilotLiquidity.s.sol` with values supplied locally.
8. Record pair address, transaction hash, LP tokens, reserves and explorer links.
9. Remove a small portion of LP and verify redemption.
10. Execute one small KAM -> quote smoke swap and one quote -> KAM smoke swap.
11. Publish accurate reserve disclosures before any public swap UI is enabled.

## No-manipulation rule

Do not self-trade merely to manufacture volume, transaction count or an appearance of organic price discovery. Any project-funded pilot liquidity must be disclosed as such.

## Current authorization state

- `PILOT_TARGET_DEFINED = true`
- `KAM_AMOUNT = 100 KAM`
- `QUOTE_AMOUNT = 20 bridged USDC`
- `BRIDGE_DEPLOYMENT_COMPLETE = false`
- `ROUND_TRIP_BRIDGE_TESTED = false`
- `DEX_FACTORY_DEPLOYED = false`
- `DEX_ROUTER_DEPLOYED = false`
- `LIQUIDITY_DEPOSIT_BROADCAST = false`
- `PUBLIC_SWAP_AUTHORIZED = false`

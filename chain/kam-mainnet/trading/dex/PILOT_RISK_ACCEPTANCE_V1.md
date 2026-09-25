# KAM DEX Pilot Risk Acceptance V1

Status: **LIMITED PILOT RISK ACCEPTANCE — CONTRACT DEPLOYMENT PREPARATION ONLY**

## Context

The project is proceeding without a paid independent external audit at this stage because the current priority is a small, controlled liquidity pilot. Internal security hardening, Foundry tests, fuzz/invariant tests, deployment simulation, CodeQL, CI and security workflows have passed for the reviewed KAM DEX revision, but these controls do not provide the same assurance as an independent external audit.

## Accepted scope

This risk acceptance applies only to:

- deploying `KAMFactory` on KriptoAman Mainnet;
- verifying its receipt, runtime code and explorer record;
- deploying `KAMRouter` bound to the deployed Factory and canonical WKAM;
- verifying Router bindings and runtime code;
- preparing a very small pilot liquidity pool after all quote-asset provenance and bridge checks pass.

It does **not** authorize unrestricted public trading, large treasury deposits, fabricated volume, fake liquidity claims, or representation that the protocol has completed an independent audit.

## Known residual risks

- independent external audit remains incomplete;
- AMM smart-contract defects may remain despite internal testing;
- bridge/counter-asset risks are separate and must be verified before liquidity;
- MEV, front-running, slippage and price manipulation risks remain for thin pools;
- a project-funded initial reserve ratio is not independently discovered market price;
- pilot liquidity may be removed if security or accounting checks fail.

## Required controls

1. Chain ID must be `22028` immediately before every signing operation.
2. Canonical WKAM must remain deployed at `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`.
3. Deployment source must match the reviewed repository revision.
4. Private key, mnemonic and seed phrase remain local to the wallet owner and are never pasted into chat, GitHub, CI or screenshots.
5. Factory and Router receipts and runtime code must be independently checked after deployment.
6. Liquidity remains blocked until a legitimate bridged quote asset exists and backing/provenance evidence is recorded.
7. The first pool remains a small pilot with exact reserves recorded before signing.
8. Public communications must clearly disclose project-funded pilot liquidity and must not portray self-funded transactions as organic market volume.

## Current decisions

- `INDEPENDENT_EXTERNAL_AUDIT_COMPLETE = false`
- `INTERNAL_SECURITY_GATES_PASSED = true`
- `LIMITED_PILOT_RISK_ACCEPTED = true`
- `FACTORY_ROUTER_DEPLOYMENT_PREPARATION_AUTHORIZED = true`
- `TREASURY_LIQUIDITY_MOVEMENT_AUTHORIZED = false`
- `PUBLIC_SWAP_AUTHORIZED = false`

The next irreversible step is an on-chain wallet signature by the wallet owner. This document contains no key material and does not itself broadcast a transaction.

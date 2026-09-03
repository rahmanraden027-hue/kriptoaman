# KAM DEX Release-Gate Review — 2026-09-03

Status: **HOLD — do not seed production liquidity or enable public Swap/Connect Wallet yet.**

This document records an internal technical review of the current KAM DEX source and deployment records. It is **not** a substitute for an independent external smart-contract audit.

## Scope reviewed

- `KAMFactory.sol`
- `KAMPair.sol`
- `KAMRouter.sol`
- canonical `WKAM.sol`
- `deployments/wkam.json`
- `deployments/dex.mainnet.deployment.json`
- DEX readiness documentation and current KAM DEX UI gating

## Deployment state recorded in repository

- Network: KriptoAman Mainnet
- Chain ID: `22028`
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- KAMFactory: `0x5024017B0496113269E80B17d9b0F11733AE6de2`
- KAMRouter: `0x4a413674245EE0959183604C153e386C00409122`
- WKAM deployment block: `240024`
- DEX Factory/Router deployment block: `384625`
- Deployment manifest status: `DEPLOYED_ONCHAIN_PENDING_SOURCE_VERIFICATION`
- Pair created: `false`
- Liquidity seeded: `false`
- Liquidity authorization: `NOT_AUTHORIZED`

## Positive findings

1. WKAM is minimal and follows checks-effects-interactions on withdrawal.
2. WKAM contains no owner, privileged mint, tax, blacklist or upgradeability.
3. KAMPair contains a reentrancy lock around `mint`, `burn` and `swap`.
4. KAMPair enforces the constant-product invariant with a 0.30% swap fee model.
5. Router constructor binds immutable Factory and WKAM addresses.
6. Router supports explicit minimum-output / minimum-liquidity parameters.
7. Current public DEX UI correctly keeps liquidity, Connect Wallet and Swap disabled while production gates remain incomplete.
8. Repository documentation explicitly prohibits fabricated quote assets, fake price, wash trading and unauthorized treasury movement.

## Findings requiring action before first production pool

### F-01 — Pool creation is permissionless
Severity: **Medium / Launch-integrity risk**

`KAMFactory.createPair()` is callable by any address. `KAMRouter._pairFor()` will also create a pair automatically when none exists.

Impact:
- The first intended WKAM/counter-asset pair is not reserved for an authorized launch transaction.
- A third party can create the pair before treasury execution.
- A third party can become the first liquidity provider and establish an arbitrary initial reserve ratio.
- This behavior conflicts with the present product wording that a KAMPair is created only when a pool is authorized.

Required resolution before launch:
- Decide explicitly whether KAM DEX is intended to be permissionless like Uniswap V2 or controlled for the first-production-pool phase.
- If controlled launch is required, deploy a reviewed replacement Factory/Router with an authorization mechanism or another reviewed launch-control design.
- Do not silently change source while continuing to reference already-deployed addresses; any replacement must receive new addresses and a new deployment manifest.

### F-02 — Source/runtime bytecode attestation remains incomplete
Severity: **High release-gate blocker**

The deployment manifest itself records `DEPLOYED_ONCHAIN_PENDING_SOURCE_VERIFICATION` and states that runtime code hash attestation is still required.

Required resolution:
- Rebuild with the exact compiler version/settings used for deployment.
- Retrieve deployed runtime bytecode for WKAM, Factory and Router from KAM Mainnet.
- Normalize immutable/metadata sections as appropriate for the chosen verification method.
- Compare compiled runtime against deployed runtime and record reproducible hashes.
- Publish explorer source verification where supported.

### F-03 — Independent external smart-contract review is not evidenced
Severity: **High release-gate blocker**

Repository documentation correctly requires independent review and states that CI is not a substitute for an external audit. No completed external audit artifact was identified in this review.

Required resolution:
- Independent reviewer/auditor must review WKAM, Factory, Pair and Router at the exact commit intended for production.
- Findings must be triaged and resolved or formally accepted before liquidity movement.

### F-04 — Router has no transaction deadline parameter
Severity: **Low / Medium UX-risk**

Swap and liquidity functions rely on amount-minimum parameters but do not include a transaction deadline. A transaction can remain executable while pending as long as its min-output/min-amount conditions remain satisfied.

Required resolution:
- External reviewer should determine whether deadline protection should be added to the production Router.
- If Router is replaced, use a new deployment address and manifest; do not mutate the source-to-address relationship.

### F-05 — Liquidity minimum checks are asymmetric in `_optimalAmounts`
Severity: **Low**

When one desired side is used in full, the corresponding `amountMin` is not explicitly checked against that full desired amount. Normal callers should set sane values, but the minimum-amount semantics should be made explicit and covered by tests.

Required resolution:
- Add tests for `amountADesired < amountAMin` and `amountBDesired < amountBMin` edge cases.
- Decide whether to add explicit precondition checks in a replacement Router.

### F-06 — Standard ERC-20 behavior only
Severity: **Informational but mandatory quote-asset constraint**

Pair/Router token transfers expect standard `transfer`/`transferFrom` boolean behavior and exact transferred amounts. Fee-on-transfer, rebasing and unusual ERC-20 implementations are unsupported.

Required resolution:
- First quote asset must be independently verified as compatible with this behavior.

## Quote-asset gate

Current decision remains:
1. Prefer a legitimate, externally-backed **officially supported USDC** on KriptoAman Mainnet.
2. Use **WETH** only as a fallback when a legitimate bridge/provider explicitly supports Chain ID 22028.
3. Do not deploy a locally-created token named USDC/USDT/WETH and present it as canonical.
4. Verify issuer/bridge provenance, destination contract, bytecode, symbol, decimals, mint/burn or escrow model, and withdrawal path before recording the asset as approved.

Until a legitimate supported destination asset is independently proven, **no production pair should be created and no production liquidity should be seeded.**

## Treasury and liquidity gate

Before any funds move, record:
- authorized treasury/liquidity wallet(s);
- approval authority and required signers;
- exact WKAM amount;
- exact counter-asset amount;
- implied initial pool ratio;
- maximum slippage / price-impact policy;
- LP-token custody policy;
- transaction hashes and approvals;
- rollback / incident procedure.

## Required execution order

1. Complete reproducible source/runtime verification.
2. Obtain independent external contract review.
3. Resolve F-01 launch-control decision and any auditor findings.
4. Verify legitimate quote-asset provenance and bridge/withdrawal path.
5. Record treasury/liquidity authorization.
6. Create exactly one small controlled pool.
7. Seed only a small controlled liquidity amount.
8. Verify pair address and reserves on-chain.
9. Execute WKAM wrap/unwrap smoke test.
10. Execute small buy and sell smoke tests in both directions.
11. Remove a small portion of liquidity to validate LP redemption.
12. Confirm RPC/explorer agreement and archive transaction receipts.
13. Only then enable Connect Wallet.
14. Only after all previous gates pass enable Swap and describe KAM DEX as live.

## Current decision

**HOLD.**

The architecture is sufficiently developed for the next verification/audit phase, but the technical evidence does not yet justify production liquidity or a public `KAM DEX live` claim.

# KAM DEX V2 Revision 3 — Controlled Canary Liquidity Plan

Date: 2026-09-05
Status: **PREPARED / NOT AUTHORIZED**
Parent security gate: #388
Candidate: KAM DEX V2 Revision 3
Frozen contract commit: `dc5b27185b0029f83c8d1ee8848c851b187d32d6`

## Purpose

Prepare the exact operational sequence for a deliberately small first-liquidity canary after, and only after, an attributable independent auditor issues an explicit GO for the reviewed frozen scope and all other release gates are satisfied.

This document is a runbook only. It does not authorize deployment, treasury movement, pair creation, liquidity, Connect Wallet, Swap, token sale, market making, or any public `KAM DEX live` claim.

## Hard prerequisites

All items below must be complete before any on-chain canary action:

- [ ] independent external report identifies reviewer/auditor and exact frozen scope;
- [ ] external disposition is explicit GO for a deliberately small controlled canary;
- [ ] all Critical/High findings are fixed and re-reviewed;
- [ ] fund-safety/launch-integrity Medium findings are fixed or explicitly accepted with documented controls;
- [ ] Foundry CI evidence exists for V2 regression, ERC-20 adversarial, and native KAM/WKAM adversarial suites;
- [ ] exact `pairCreator` public address and custody model are approved;
- [ ] quote asset provenance, destination contract, bridge/escrow model, withdrawal path, roles and upgrade controls are verified;
- [ ] Factory V2 and Router V2 deployment bytecode/runtime correspond to the reviewed frozen source;
- [ ] Router binding to Factory V2 and canonical WKAM is verified;
- [ ] `permissionlessPairCreation()` is false;
- [ ] `allPairsLength()` is zero before the intended first official pair;
- [ ] treasury authorization identifies exact assets, exact maximum amounts and LP recipient;
- [ ] no private key, seed phrase or signing secret is stored in repository/chat/CI.

Any failed prerequisite => **HOLD / ABORT**.

## Quote asset rule

The canary quote asset must be a legitimate, externally-backed asset with verified provenance. If using Bridged USDC Standard, the implementation must have documented origin USDC backing/lock or escrow model, destination token contract, minter/bridge roles, upgrade authority, withdrawal route and incident controls.

A locally-created token must never be represented as USDC.

## Canary sizing rule

The canary must be deliberately small relative to treasury holdings and designed only to verify technical operation. Exact amounts are intentionally not specified in this document because they require a separate treasury authorization after external GO.

Before execution, record:

- exact WKAM/KAM amount;
- exact quote-asset amount;
- implied initial reserve ratio;
- maximum acceptable slippage for each smoke transaction;
- maximum allowed treasury exposure;
- LP recipient/custody address;
- abort threshold if observed state differs from approved pre-state.

No amount may be chosen solely to manufacture a target market price, volume, liquidity depth or valuation.

## Execution sequence after GO

1. Re-read external report and confirm exact reviewed commit/blob scope.
2. Verify current public RPC Chain ID is `22028`.
3. Verify canonical WKAM address and runtime.
4. Verify Factory V2 runtime and immutable `pairCreator`.
5. Verify Router V2 runtime and Factory/WKAM bindings.
6. Verify `permissionlessPairCreation() == false` and `allPairsLength() == 0`.
7. Verify quote-asset contract code, decimals, symbol and provenance evidence.
8. Verify treasury and pairCreator signer quorum and transaction digest independently.
9. Wrap only the approved small native KAM amount needed for the canary.
10. Approve only the exact canary token amounts required by the controlled first-seed transaction where practical.
11. Execute exactly one authorized `createPairAndSeed` transaction for the approved WKAM/quote-asset pair.
12. Record transaction hash, block number, pair address, event logs, reserves, LP supply and LP recipient.
13. Independently verify reserve balances from public RPC/explorer.
14. Execute one small buy smoke transaction with explicit deadline and minimum output.
15. Verify received output and reserve/invariant state.
16. Execute one small sell smoke transaction with explicit deadline and minimum output.
17. Verify received output and reserve/invariant state.
18. Add a small amount of follow-on liquidity through Router V2.
19. Redeem a small portion of LP through Router V2 and verify both assets are returned correctly.
20. Test native KAM wrap/unwrap and native Router path with minimal approved value if included in external GO scope.
21. Reconcile all treasury deltas, LP balances, fees and reserves.
22. Produce a signed/recorded canary evidence summary.

## Mandatory abort conditions

Immediately stop and do not retry automatically if any of the following occurs:

- runtime/source mismatch;
- wrong Chain ID;
- unexpected pair already exists;
- permissionless pair creation is unexpectedly enabled;
- pairCreator mismatch;
- Router binding mismatch;
- quote-asset provenance or withdrawal path cannot be verified;
- balance/reserve delta differs from expected standard-token behavior;
- unexpected mint/burn/admin event on quote asset;
- transaction output falls below approved minimum;
- LP recipient differs from approval;
- RPC/explorer evidence is inconsistent;
- external reviewer has withdrawn or conditioned GO on an unmet item;
- signer or treasury authorization discrepancy;
- any unreviewed contract source change is discovered.

Abort means **HOLD**, preserve evidence, and return to review. Do not compensate by increasing liquidity or repeating transactions with looser safeguards.

## Post-canary decision

Canary success does not automatically authorize public launch. After successful technical smoke tests, perform a separate decision review covering:

- auditor conditions satisfied;
- treasury reconciliation;
- quote-asset bridge health;
- RPC/explorer consistency;
- UI slippage/deadline safeguards;
- user warnings for unsupported/non-standard tokens;
- monitoring/incident response;
- whether/when permissionless pair creation should remain closed or be opened;
- whether public Connect Wallet and Swap may be enabled.

## Current decision

**NOT AUTHORIZED — WAITING FOR EXTERNAL GO/HOLD.**

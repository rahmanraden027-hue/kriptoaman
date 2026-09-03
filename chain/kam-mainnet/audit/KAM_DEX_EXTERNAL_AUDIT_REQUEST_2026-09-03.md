# KAM DEX — External Security Audit Request

Date: 2026-09-03
Project: KriptoAman / KAM Mainnet
Network: KriptoAman Mainnet, Chain ID 22028
Engagement status: REQUEST FOR INDEPENDENT REVIEW
Release status: HOLD — no production liquidity authorized

## Project summary

KriptoAman is preparing a deliberately controlled first-liquidity phase for a native-chain AMM on KAM Mainnet. The DEX stack consists of a wrapped native asset (WKAM), a permissionless Factory, a constant-product Pair implementation, and a Router supporting token/token and native-KAM routes.

Before any real production pair, treasury movement, liquidity seeding, wallet activation, or public Swap activation, we require an independent external smart-contract security review of the exact frozen scope below.

## Frozen audit scope

Please review the exact source/blob identifiers documented in:

- `chain/kam-mainnet/audit/KAM_DEX_AUDIT_HANDOFF_2026-09-03.md`
- `chain/kam-mainnet/audit/KAM_DEX_ATTESTATION_EVIDENCE_2026-09-03.md`
- GitHub PR #387
- GitHub Issue #388

Primary contract files:

- `chain/kam-mainnet/contracts/WKAM.sol`
- `chain/kam-mainnet/trading/dex/KAMFactory.sol`
- `chain/kam-mainnet/trading/dex/KAMPair.sol`
- `chain/kam-mainnet/trading/dex/KAMRouter.sol`
- `chain/kam-mainnet/trading/dex/interfaces/IERC20Minimal.sol`

The audit handoff records the frozen Git blob SHA for each file.

## Deployed contracts

- WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Factory: `0x5024017B0496113269E80817d9b0F11733AE6de2`
- Router: `0x4a413674245EE0959183604C153e386C00409122`
- Chain ID: `22028`
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`

Current Factory state at the latest internal read-only verification: `allPairsLength() = 0`.

## Reproducible source/runtime evidence

Gate 1 source/runtime identity has completed successfully with read-only evidence:

- WKAM exact runtime reproduction: Solidity 0.8.24, optimizer 200, EVM Paris.
- Factory exact runtime reproduction: Solidity 0.8.36, optimizer 200, EVM Paris.
- Router runtime reproduction after compiler-provided immutable normalization: Solidity 0.8.36, optimizer 200, EVM Paris.
- Router → Factory binding verified.
- Router → WKAM binding verified.
- Deployment receipts, addresses, blocks, and successful status verified.
- Runtime attestation workflow run: `33732993736`.
- Evidence artifact: `kam-dex-runtime-attestation-33732993736`, Artifact ID `9884604618`.

We request that the external reviewer independently reproduce or sample-check this evidence rather than relying solely on our internal result.

## Internal findings requiring independent assessment

Please explicitly assess the following:

1. **F-01 — Permissionless pair creation / launch integrity**
   - `KAMFactory.createPair()` is permissionless.
   - Router auto-creates a missing pair.
   - A third party may create the intended first pair and become first liquidity provider before treasury execution.

2. **F-02 — Source/runtime identity**
   - Internally resolved through reproducible bytecode and deployment evidence.
   - Please independently validate.

3. **F-03 — Independent review requirement**
   - This engagement is the hard production blocker.

4. **F-04 — No Router deadline/expiry parameter**
   - Amount-minimum protections exist, but swap/liquidity calls have no transaction deadline.

5. **F-05 — `_optimalAmounts` minimum semantics**
   - Minimum checks are asymmetric when one desired side is consumed in full.

6. **F-06 — Standard ERC-20 assumptions**
   - Exact-transfer, boolean-returning ERC-20 behavior is assumed.
   - Fee-on-transfer, rebasing, and unusual tokens are not intended to be supported.

7. **F-07 — Native-value callback/reentrancy surfaces**
   - Review WKAM native withdrawal and Router native refund/output paths.
   - Assess whether explicit reentrancy guards or other defense-in-depth changes are appropriate.

## Additional requested review areas

Please review:

- LP mint/burn accounting;
- `MINIMUM_LIQUIDITY` behavior;
- constant-product invariant and 0.30% fee math;
- reserve accounting and bounds;
- token/reserve ordering;
- initialization and pair ownership semantics;
- slippage/minimum-output behavior;
- malicious/non-standard token behavior;
- denial-of-service and griefing paths;
- first-liquidity front-running risks;
- Pair creation bytecode embedded in Factory versus reviewed Pair source;
- wrap/unwrap behavior and native-value callbacks;
- refund paths;
- event/accounting consistency;
- any condition that should block first real liquidity.

## Required deliverables

Please confirm whether your engagement can provide:

1. named reviewer/auditor organization and review date;
2. exact frozen source/blob identifiers reviewed;
3. methodology and tools used;
4. severity-rated findings with affected code paths;
5. explicit disposition of F-01 through F-07;
6. required fixes versus accepted risks;
7. explicit GO/HOLD recommendation for a deliberately small controlled first-liquidity test;
8. fix review / re-review of any replacement or modified contracts;
9. an attributable final report artifact suitable for our release-gate evidence.

## Important release constraints

This request does **not** authorize:

- production pair creation;
- treasury movement;
- liquidity seeding;
- market making;
- token sale;
- fabricated price, volume, or liquidity;
- Connect Wallet activation;
- public Swap activation;
- any claim that KAM DEX is live;
- any claim of regulatory or third-party listing approval.

If the audit recommends a material code change, we will deploy replacement contracts at new addresses and repeat source/runtime attestation before any liquidity step.

## Engagement response requested

Please provide:

- scope acceptance or requested scope changes;
- proposed methodology;
- estimated engagement structure/timeline;
- commercial proposal/quote;
- fix-review terms;
- conflict-of-interest disclosure;
- final-report publication policy.

Primary release decision remains **HOLD** until the independent review is completed and accepted under GitHub Gate 2 Issue #388.

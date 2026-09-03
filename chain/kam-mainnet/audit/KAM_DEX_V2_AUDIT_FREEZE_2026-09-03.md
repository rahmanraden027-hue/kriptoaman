# KAM DEX V2 Audit Freeze — 2026-09-03

Status: **PRE-AUDIT / NOT DEPLOYED / NO LIQUIDITY AUTHORIZED**

This document freezes the current KAM DEX V2 candidate for independent review. It supersedes the earlier V2 addendum sent before atomic first-liquidity seeding was added.

## Frozen source revision

Candidate source commit: `59e558d96a532af07c05e58922ee5b9c53c1e5bb`

Frozen source blobs:

- `chain/kam-mainnet/trading/dex-v2/KAMFactoryV2.sol`
  - blob SHA: `c645e18d4d5b20bd14dfcc895874937e56f1e3eb`
- `chain/kam-mainnet/trading/dex-v2/KAMRouterV2.sol`
  - blob SHA: `eb34d3c5f8bf81ea37d62405befa0debf2c0c61d`
- `chain/kam-mainnet/trading/dex/KAMPair.sol`
  - blob SHA: `99dc103515d04156d63428138b7a5dbd180ae137`
- canonical deployed WKAM source: `chain/kam-mainnet/contracts/WKAM.sol`
  - blob SHA: `c8f9b86c7fe199fb3834d3bd6d04c3b5943188f8`

Regression test blob:

- `chain/kam-mainnet/trading/test/KAMDEXV2.t.sol`
  - blob SHA: `4f75a5ab49f863e8a107021f5328eb5afaf2f815`

## V2 security changes versus deployed V1

### F-01 launch integrity

V2 removes the official empty-pair launch window.

Before permissionless mode is opened:

- `createPair()` rejects all empty pair creation;
- only immutable `pairCreator` can call `createPairAndSeed()`;
- official pair deployment, both token transfers, exact balance checks, and initial LP mint occur atomically in one transaction;
- fee-on-transfer/rebasing style behavior is rejected for the first official seed by exact pair balance checks;
- Factory uses a reentrancy lock during launch operations.

After the controlled launch phase, `pairCreator` may irreversibly enable permissionless pair creation.

### F-04 stale transactions

All Router V2 state-changing public entry points accept and enforce a `deadline`.

### F-05 asymmetric liquidity minimums

Router V2 enforces both `amountAMin` and `amountBMin` in every liquidity branch, including zero-reserve pairs.

### Defense in depth

Router V2:

- never auto-creates missing pairs;
- uses a router-level reentrancy lock on state-changing entry points;
- retains explicit output minimums for swaps;
- continues to reject direct native KAM transfers except from canonical WKAM.

## Internal execution evidence

GitHub Actions workflow: `KAM DEX Contract`

- run ID: `33740297122`
- job ID: `100600386409`
- conclusion: `success`

Passing steps:

- Foundry format check;
- Paris-compatible build;
- V1 regression tests;
- V2 hardening candidate tests;
- deployment simulation;
- canonical WKAM metadata verification;
- no deployer secret available to CI.

The V2 tests specifically cover:

- controlled phase rejects empty pair creation;
- atomic official pair creation + first seed;
- atomic official seed cannot repeat or run after permissionless opening;
- explicit irreversible permissionless opening;
- Router never auto-creates a missing pair;
- expired transaction rejection;
- both initial minimums on public zero-reserve pairs;
- closure of both F-05 asymmetric minimum branches;
- valid post-seed liquidity still succeeds.

## Auditor questions

The independent reviewer must explicitly assess:

1. whether atomic `createPairAndSeed()` adequately closes first-liquidity front-running/griefing risk for the official launch pair;
2. whether Factory exact post-transfer balance checks are sufficient for the intended canonical counter-asset and WKAM;
3. whether the immutable `pairCreator` and irreversible permissionless-open model is appropriate, including multisig recommendations;
4. whether Router V2 deadline and minimum checks fully resolve F-04/F-05;
5. whether Factory/Router reentrancy locks and WKAM native-value call paths are sufficient;
6. whether unchanged `KAMPair.sol` is safe for this architecture, including mint/burn/swap accounting and malicious/non-standard token behavior;
7. whether V2 is suitable for a small controlled canary deployment and first liquidity transaction.

## Release rule

This freeze is **not** production authorization.

Until an independent audit returns an attributable GO under the frozen scope and the quote-asset/treasury gates pass:

- do not deploy V2 to production;
- do not create an official pair;
- do not move treasury funds for DEX liquidity;
- do not seed liquidity;
- do not enable Connect Wallet or Swap;
- do not claim KAM DEX is live.

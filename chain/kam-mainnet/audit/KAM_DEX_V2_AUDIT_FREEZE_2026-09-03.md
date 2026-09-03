# KAM DEX V2 Audit Freeze — Revision 3 — 2026-09-03

Status: **PRE-AUDIT / NOT DEPLOYED / NO LIQUIDITY AUTHORIZED**

This is the current frozen KAM DEX V2 candidate for independent review. It supersedes all earlier V2 addenda and Revision 2 freeze references. Auditors should ignore earlier V2 blob/commit references and review only the Revision 3 scope below.

## Frozen revision

Candidate commit: `dc5b27185b0029f83c8d1ee8848c851b187d32d6`

Frozen source blobs:

- `chain/kam-mainnet/trading/dex-v2/KAMFactoryV2.sol`
  - blob SHA: `adaa30cabeb8a82edcdaf9b8e173c413e2169fd8`
- `chain/kam-mainnet/trading/dex-v2/KAMPairV2.sol`
  - blob SHA: `a56cfaa4a6d8d29d9072237ec25ac62d8af5c8c2`
- `chain/kam-mainnet/trading/dex-v2/KAMRouterV2.sol`
  - blob SHA: `a3ef9ebcd7a595d391d4409e818f8af23870171a`
- canonical deployed WKAM source: `chain/kam-mainnet/contracts/WKAM.sol`
  - blob SHA: `c8f9b86c7fe199fb3834d3bd6d04c3b5943188f8`

Regression test blob:

- `chain/kam-mainnet/trading/test/KAMDEXV2.t.sol`
  - blob SHA: `be162135f41e1a2d0b6ed09889fb1b658ed59e97`

## Security design changes versus deployed V1

### F-01 — launch integrity

Revision 3 removes the empty-pair launch path entirely.

Every V2 pair is created and receives its first liquidity through `KAMFactoryV2.createPairAndSeed()` in one transaction.

Before permissionless mode is opened, only immutable `pairCreator` may call it. After an explicit irreversible open action, any provider may create and seed a new pair, but creation remains atomic.

### Counterfactual pre-funding hardening

A CREATE child address can be predicted before the Pair contract exists. An attacker could therefore pre-fund the future address with ERC-20 balances before deployment.

Revision 3 addresses that case with `KAMPairV2`:

1. Factory deploys and initializes Pair V2.
2. Factory records any pre-existing balances at the newly deployed Pair address.
3. Factory transfers the provider's approved official seed amounts.
4. Factory-only `KAMPairV2.seed()` recovers the recorded pre-existing balances to the provider.
5. Pair V2 requires the remaining balances to exactly equal the intended official seed amounts.
6. Only then is the first LP position minted and reserves synchronized.

This rejects fee-on-transfer/rebasing or other non-standard first-seed behavior and prevents counterfactual token donations from determining the official initial reserve ratio.

`KAMPairV2.mint()` cannot be used before the factory-controlled first seed completes.

### F-04 — stale transactions

All Router V2 state-changing public entry points enforce a caller-supplied `deadline`.

### F-05 — asymmetric liquidity minimums

Router V2 enforces both `amountAMin` and `amountBMin` across liquidity branches.

### Defense in depth

- Router V2 never auto-creates missing pairs.
- Factory V2 and Router V2 use reentrancy locks for state-changing launch/routing paths.
- Pair V2 retains a pair-level lock.
- Swap output minimums remain enforced.
- Direct native KAM transfers to Router remain rejected except from canonical WKAM.
- Official first liquidity should use canonical WKAM as the wrapped native asset and a separately verified quote asset.

## Internal execution evidence

GitHub Actions workflow: `KAM DEX Contract`

- run ID: `33741059278`
- job ID: `100602816541`
- conclusion: `success`

Passing steps:

- Foundry format check;
- Paris-compatible build;
- deployed V1 regression tests;
- V2 hardening candidate tests;
- deployment simulation;
- canonical WKAM metadata verification;
- no deployer secret available to CI.

Revision 3 tests cover:

- controlled phase blocks third-party pair creation/seeding;
- official pair creation and first seed are atomic;
- predicted-address/counterfactual pre-funding is recovered and does not alter official reserves;
- duplicate pair creation is rejected;
- permissionless opening is explicit and new public pairs are still created+seeded atomically;
- Router never auto-creates missing pairs;
- expired deadlines are rejected;
- both F-05 minimum-bypass cases are closed;
- post-seed add liquidity works;
- token-to-token swap works;
- liquidity removal works.

## Required independent review questions

The auditor must explicitly assess:

1. whether `createPairAndSeed()` plus Pair V2 factory-only first seed adequately closes first-liquidity front-running and griefing;
2. whether counterfactual pre-funding recovery is safe and whether returning pre-existing balances to the pair provider is an acceptable policy;
3. whether malicious/non-standard token behavior can bypass the recorded-prebalance and exact-post-recovery checks;
4. whether `pairCreator` should be a multisig and whether the irreversible permissionless-open control is appropriate;
5. whether Factory/Pair/Router reentrancy locks cover all relevant callback paths;
6. whether Router deadlines and symmetric minimum checks fully resolve F-04/F-05;
7. whether Pair V2 mint/burn/swap accounting and invariant/fee calculations are correct;
8. whether canonical WKAM native-value call paths require additional protection;
9. whether V2 Revision 3 is suitable for a small controlled canary deployment and first liquidity transaction.

## Release rule

This freeze is **not** production authorization.

Until an independent audit returns an attributable GO for this exact frozen scope and the quote-asset + treasury authorization gates pass:

- do not merge/deploy V2 as production authorization;
- do not create a production pair;
- do not move treasury funds for DEX liquidity;
- do not seed production liquidity;
- do not enable Connect Wallet or Swap;
- do not claim KAM DEX is live.

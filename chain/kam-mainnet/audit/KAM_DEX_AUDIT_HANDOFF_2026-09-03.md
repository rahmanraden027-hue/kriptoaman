# KAM DEX — Independent Audit Handoff

Date: 2026-09-03  
Network: KriptoAman Mainnet  
Chain ID: `22028` (`0x560c`)  
Status: **EXTERNAL REVIEW REQUIRED — NO PRODUCTION LIQUIDITY AUTHORIZED**

This package freezes the technical scope and evidence that should be supplied to an independent smart-contract reviewer. It does not authorize pair creation, treasury movement, liquidity seeding, market making, public Swap activation, or a `KAM DEX live` claim.

## 1. Review objective

The reviewer should determine whether the currently deployed WKAM/Factory/Router architecture and the Pair implementation are suitable for a first controlled production-liquidity phase, and identify any condition that must be remediated before real funds are moved.

The reviewer must treat deployed-address provenance separately from proposed source changes. Any code change that changes deployed runtime behavior requires a new deployment address and updated manifest; the source-to-address record for existing contracts must not be rewritten.

## 2. Frozen source scope

Use these repository paths and Git blob identifiers as the audit source freeze:

| Component | Repository path | Git blob SHA |
|---|---|---|
| Deployed WKAM source | `chain/kam-mainnet/contracts/WKAM.sol` | `c8f9b86c7fe199fb3834d3bd6d04c3b5943188f8` |
| KAMFactory | `chain/kam-mainnet/trading/dex/KAMFactory.sol` | `77e05ff4240b0a58e9783e1240116f961dbf7d50` |
| KAMPair | `chain/kam-mainnet/trading/dex/KAMPair.sol` | `99dc103515d04156d63428138b7a5dbd180ae137` |
| KAMRouter | `chain/kam-mainnet/trading/dex/KAMRouter.sol` | `b8b5518f6551db7f8ad6c942c636e34f54c55c0c` |
| IERC20Minimal | `chain/kam-mainnet/trading/dex/interfaces/IERC20Minimal.sol` | `1d60a95a9a2d5f736dbe1f2ef79d1628bc39f44d` |

Audit branch / evidence PR: `audit/kam-dex-release-gate-2026-09-03` / PR `#387`.

Important: `chain/kam-mainnet/trading/contracts/WKAM.sol` is a later trading-stack variant and is **not** the source of the currently deployed WKAM runtime.

## 3. Live contract inventory

### WKAM

- Address: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Deployment block: `240024`
- Deployment tx: `0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf`
- Runtime bytes: `2232`
- RPC code hash observed: `0x18e55c1a64d14c644503ebef31eea97de1668dc923593c47386b795078e05c6a`
- Source/runtime SHA-256: `739d764da5216881769312e6b80f5bbe856b9ded889635a51ac0935e90717c30`
- Logic SHA-256: `464d7acacb04d95fc5544cfbc6ba8c6053a551470e9f0df743550335a456140f`

### KAMFactory

- Address: `0x5024017B0496113269E80817d9b0F11733AE6de2`
- Deployment block: `384625`
- Deployment tx: `0xddbe3f7265194a068b369d954277f360fcabd2753175c03929d5bebedeb5c0e4`
- Runtime bytes: `7609`
- RPC code hash observed: `0x3f187615045d020d6ae4abf4d61f59e64411b1b5c80a837b0245afccaa8db3da`
- Reproduced runtime SHA-256: `a046af379249f2d5f72ef823837d1c661cc755359c54e09ef0274d8d2ad02237`
- Logic SHA-256: `145d1f6093ac351b909048a6cd346d4bfe87f2cec1ce49797a749f73b3b4c1be`
- Observed `allPairsLength()`: `0` during the 2026-09-03 audit pass

### KAMRouter

- Address: `0x4a413674245EE0959183604C153e386C00409122`
- Deployment block: `384625`
- Deployment tx: `0x83dd3be8629483b2db730c86437128fb39f8b7ceb0738e970bba9c7a9bf98053`
- Runtime bytes: `8456`
- RPC code hash observed: `0xcce1904574cb5c020c73e5b9ca8ea47a8b48f6f7f6161cb784238ccb4e8af65b`
- Runtime SHA-256 after immutable normalization: `9095f45d066f83e677ef68a4ac511dc64b89a2c8742e6d1bcaa4c09e5c0a997b`
- Logic SHA-256: `8d4e140bb21e7babbf7326f10d29dc6495c0c7a1ac3a98b27bd8111c650d7503`
- `factory()` binding: `0x5024017B0496113269E80817d9b0F11733AE6de2`
- `WKAM()` binding: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`

## 4. Compiler reproduction

### WKAM deployment reproduction

- Solidity: `0.8.24+commit.e11b9ed9.Emscripten.clang`
- Optimizer: enabled
- Runs: `200`
- EVM version: `paris`
- Standard JSON source key: `WKAM.sol`
- Source path: `chain/kam-mainnet/contracts/WKAM.sol`
- Exact deployed runtime match: `true`

### Factory / Router reproduction

- Solidity: `0.8.36`
- Optimizer: enabled
- Runs: `200`
- EVM version: `paris`
- Factory exact runtime match: `true`
- Router exact runtime match after compiler-provided immutable masking: `true`
- Logic bytecode match ignoring metadata: `true` for both

## 5. Deployment provenance

Read-only recovery of block `384625` found two deployer contract-creation transactions from:

`0x9D4b034758202cE555504d038F92A344540D47B0`

1. Nonce `0x14` → Factory
   - tx `0xddbe3f7265194a068b369d954277f360fcabd2753175c03929d5bebedeb5c0e4`
   - contract `0x5024017B0496113269E80817d9b0F11733AE6de2`
   - status success
2. Nonce `0x15` → Router
   - tx `0x83dd3be8629483b2db730c86437128fb39f8b7ceb0738e970bba9c7a9bf98053`
   - contract `0x4a413674245EE0959183604C153e386C00409122`
   - status success

The earlier repository values containing Factory `...E80B17...` and slightly different DEX transaction hashes were transcription errors and have been corrected in `chain/kam-mainnet/deployments/dex.mainnet.deployment.json`.

## 6. Read-only evidence scripts/workflows

The reviewer may reproduce the evidence using:

- `.github/workflows/kam-dex-runtime-attestation.yml`
- `.github/workflows/kam-dex-source-reproduction.yml`
- `.github/workflows/kam-dex-state-probe.yml`
- `chain/kam-mainnet/trading/scripts/attest-dex-runtime.mjs`
- `chain/kam-mainnet/trading/scripts/reproduce-wkam-standard-json.mjs`
- `chain/kam-mainnet/trading/scripts/compare-runtime-at-address.mjs`
- `chain/kam-mainnet/trading/scripts/probe-current-dex-state.mjs`
- `chain/kam-mainnet/trading/scripts/recover-dex-deployment-provenance.mjs`

These workflows explicitly assert that `DEPLOYER_PRIVATE_KEY` and `MNEMONIC` are absent. They are intended to compile, read RPC state, read receipts, call view methods, compare bytecode, and publish evidence only.

## 7. Internal findings for independent validation

### F-01 — Permissionless pair creation

`KAMFactory.createPair()` is public and `KAMRouter._pairFor()` auto-creates a missing pair. A third party can create the intended pair before the treasury and can become the first liquidity provider.

Reviewer decision requested:
- acceptable permissionless design; or
- controlled first-pool launch requires replacement Factory/Router or another reviewed control design.

### F-02 — Source/runtime identity

Internal status: **resolved technically**. Exact source/runtime reproduction and receipt/address/block evidence exist for WKAM, Factory, and Router.

Reviewer requested to independently reproduce or sample-check the evidence.

### F-03 — Independent review

This handoff exists because CI/internal review is not treated as an independent external audit. This remains a hard blocker until an independent report is delivered and findings are triaged.

### F-04 — No Router deadline parameter

Liquidity and swap calls have amount-minimum controls but no deadline/expiry parameter.

Reviewer decision requested on whether a replacement Router should include deadline protection.

### F-05 — Asymmetric minimum checks in `_optimalAmounts`

When a desired amount is used in full, the corresponding `amountMin` is not explicitly checked against that full desired amount.

Reviewer requested to assess severity and recommend explicit precondition checks/tests if appropriate.

### F-06 — Standard ERC-20 assumptions

Transfers assume boolean-returning standard `transfer`/`transferFrom` semantics and exact transferred amounts. Fee-on-transfer, rebasing, and unusual tokens are unsupported.

Reviewer requested to state quote-asset compatibility requirements clearly.

### F-07 — Native-value call / callback review

Deployed WKAM reduces state and emits withdrawal events before its native-value call. Router also performs native-value refund/output calls.

Reviewer requested to assess callback/reentrancy behavior and whether explicit reentrancy guards are desirable for defense in depth.

## 8. Additional reviewer focus areas

Please explicitly evaluate:

- integer arithmetic and reserve bounds;
- first-liquidity and `MINIMUM_LIQUIDITY` behavior;
- LP mint/burn accounting;
- invariant enforcement and fee math;
- token ordering and reserve ordering;
- zero-address and identical-token handling;
- Router slippage semantics;
- KAM wrapping/unwrapping paths;
- refund paths;
- callback/reentrancy surfaces;
- malicious/non-standard token interactions;
- denial-of-service/griefing scenarios;
- permissionless pool front-running / launch-integrity implications;
- whether Pair creation bytecode embedded in the verified Factory is consistent with the reviewed KAMPair source;
- whether any event-ordering or off-chain-indexer assumptions could cause security or accounting issues;
- any condition that should block first real liquidity.

## 9. Quote-asset constraint

No quote asset is approved by this handoff.

A production quote asset must have independently verified provenance and explicit support for Chain ID 22028. A locally created token named USDC/USDT/WETH must not be represented as canonical.

Reviewer should assess compatibility after a candidate asset is identified, including transfer semantics, decimals, issuer/bridge design, mint/burn or escrow model, withdrawal path, and operational risks.

## 10. Launch controls after audit

Even if the contracts are accepted by the reviewer, liquidity remains blocked until all of these are separately recorded:

- F-01 launch-control decision;
- quote-asset provenance;
- authorized source wallet(s);
- approval authority/signers;
- exact initial amounts;
- intended initial reserve ratio;
- slippage / price-impact policy;
- LP-token custody policy;
- incident/rollback procedure.

The first real pool and transactions should use deliberately small amounts and be followed by on-chain reserve verification, wrap/unwrap smoke, buy/sell smoke in both directions, and partial LP redemption before any wider activation.

## 11. Required independent-audit output

Please return at minimum:

1. reviewer/auditor identity and review date;
2. frozen source identifiers reviewed;
3. methodology/tools used;
4. findings with severity and affected code paths;
5. explicit assessment of F-01 through F-07;
6. explicit statement on suitability for controlled first-liquidity testing;
7. required fixes versus accepted risks;
8. re-review status for any replacement contracts;
9. signed or otherwise attributable final report artifact.

## 12. Release decision at handoff

**HOLD.**

Source/runtime identity is reproducibly evidenced, but production liquidity and public swap activation remain blocked by independent external review and the subsequent launch-control, quote-asset, treasury, and controlled-smoke gates.

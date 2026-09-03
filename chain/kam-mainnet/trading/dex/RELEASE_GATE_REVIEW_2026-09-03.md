# KAM DEX Release-Gate Review — 2026-09-03

Status: **HOLD — do not seed production liquidity or enable public Swap/Connect Wallet yet.**

This document records an internal technical review of the current KAM DEX source, live read-only state, deployment provenance, and reproducible runtime evidence. It is **not** a substitute for an independent external smart-contract audit.

## Scope reviewed

- `chain/kam-mainnet/contracts/WKAM.sol` — source of the currently deployed WKAM runtime
- `chain/kam-mainnet/trading/dex/KAMFactory.sol`
- `chain/kam-mainnet/trading/dex/KAMPair.sol`
- `chain/kam-mainnet/trading/dex/KAMRouter.sol`
- `chain/kam-mainnet/trading/dex/interfaces/IERC20Minimal.sol`
- `chain/kam-mainnet/deployments/wkam.json`
- `chain/kam-mainnet/deployments/dex.mainnet.deployment.json`
- read-only source reproduction, runtime attestation, deployment-provenance recovery, and current-state probe workflows
- current KAM DEX UI gating

## Verified deployment state

- Network: KriptoAman Mainnet
- Chain ID: `22028` (`0x560c`)
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- KAMFactory: `0x5024017B0496113269E80817d9b0F11733AE6de2`
- KAMRouter: `0x4a413674245EE0959183604C153e386C00409122`
- WKAM deployment block: `240024`
- Factory/Router deployment block: `384625`
- Factory pair count observed during the audit pass: `0`
- Liquidity seeded: `false`
- Liquidity authorization: `NOT_AUTHORIZED`
- Deployment manifest status: `ONCHAIN_SOURCE_VERIFIED_PENDING_EXTERNAL_AUDIT_AND_LIQUIDITY_AUTHORIZATION`

The Factory address above is the address actually embedded in the live Router and backed by live runtime code. A previous repository transcription used `...E80B17...`; direct RPC inspection proved that address had no code. The live Router resolves to `...E80817...`, which has Factory runtime code and `allPairsLength() = 0`.

## Reproducible source/runtime evidence

### WKAM

The deployed WKAM runtime was reproduced exactly from:

`chain/kam-mainnet/contracts/WKAM.sol`

using the historical Standard JSON input shape:

- Solidity: `0.8.24+commit.e11b9ed9.Emscripten.clang`
- optimizer: enabled
- optimizer runs: `200`
- EVM version: `paris`
- Standard JSON source key: `WKAM.sol`
- compiled runtime: `2232` bytes
- on-chain runtime: `2232` bytes
- exact runtime match: `true`
- runtime SHA-256: `739d764da5216881769312e6b80f5bbe856b9ded889635a51ac0935e90717c30`
- logic SHA-256: `464d7acacb04d95fc5544cfbc6ba8c6053a551470e9f0df743550335a456140f`

The later file `chain/kam-mainnet/trading/contracts/WKAM.sol` is **not** the source of the currently deployed WKAM runtime and must not be used as its provenance record.

### Factory

The live Factory runtime was reproduced from repository source with:

- Solidity: `0.8.36`
- optimizer: enabled, `200` runs
- EVM version: `paris`
- compiled/on-chain runtime: `7609` bytes
- exact runtime match: `true`
- runtime SHA-256: `a046af379249f2d5f72ef823837d1c661cc755359c54e09ef0274d8d2ad02237`
- logic SHA-256: `145d1f6093ac351b909048a6cd346d4bfe87f2cec1ce49797a749f73b3b4c1be`

### Router

The live Router runtime was reproduced from repository source with immutable references normalized using the compiler artifact:

- Solidity: `0.8.36`
- optimizer: enabled, `200` runs
- EVM version: `paris`
- compiled/on-chain runtime: `8456` bytes
- exact normalized runtime match: `true`
- runtime SHA-256 after immutable normalization: `9095f45d066f83e677ef68a4ac511dc64b89a2c8742e6d1bcaa4c09e5c0a997b`
- logic SHA-256: `8d4e140bb21e7babbf7326f10d29dc6495c0c7a1ac3a98b27bd8111c650d7503`

### Deployment provenance

Read-only recovery of block `384625` found exactly two deployer contract-creation transactions:

- Factory tx: `0xddbe3f7265194a068b369d954277f360fcabd2753175c03929d5bebedeb5c0e4`
  - contract: `0x5024017B0496113269E80817d9b0F11733AE6de2`
  - receipt status: success
- Router tx: `0x83dd3be8629483b2db730c86437128fb39f8b7ceb0738e970bba9c7a9bf98053`
  - contract: `0x4a413674245EE0959183604C153e386C00409122`
  - receipt status: success

WKAM deployment receipt:

- tx: `0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf`
- block: `240024`
- receipt status: success
- contract address matches canonical WKAM

## Current CI/read-only evidence

Observed passing evidence includes:

- KAM DEX contract tests
- WKAM contract tests
- KAM DEX mainnet dry-run
- KAM DEX source reproduction
- KAM DEX current-state probe
- CI
- KAM Mainnet promotion gate
- live site/core/network smokes on the audit branch during the review window

The dedicated runtime-attestation workflow has been corrected to use the actual mixed deployment compilers: Solidity `0.8.24` for WKAM and `0.8.36` for Factory/Router. It contains no deployer private key or mnemonic and performs only build, RPC reads, receipt reads, contract calls, and artifact publication.

## Positive findings

1. Deployed WKAM is minimal, has no owner, privileged mint, tax, blacklist, or upgradeability.
2. Deployed WKAM reduces the caller's wrapped balance and emits withdrawal/burn-style events before performing the native external call.
3. KAMPair contains a reentrancy lock around `mint`, `burn`, and `swap`.
4. KAMPair enforces the constant-product invariant with a 0.30% swap-fee model.
5. Router constructor binds immutable Factory and WKAM addresses.
6. Live Router → Factory and Router → WKAM bindings match the verified addresses above.
7. Router supports explicit minimum-output/minimum-liquidity parameters.
8. Current public DEX UI keeps Connect Wallet and Swap disabled while production gates remain incomplete.
9. Repository documentation prohibits fabricated quote assets, fake price, wash trading, and unauthorized treasury movement.

## Findings requiring action before first production pool

### F-01 — Pool creation is permissionless
Severity: **Medium / Launch-integrity risk**

`KAMFactory.createPair()` is callable by any address. `KAMRouter._pairFor()` also creates a pair automatically when none exists.

Impact:
- The first intended WKAM/counter-asset pair is not reserved for an authorized launch transaction.
- A third party can create the pair before treasury execution.
- A third party can become the first liquidity provider and establish an arbitrary initial reserve ratio.
- This conflicts with any product wording implying that pair creation itself is authorization-gated.

Required resolution before launch:
- Decide explicitly whether KAM DEX is intended to remain permissionless like Uniswap V2 or controlled for the first-production-pool phase.
- If controlled launch is required, use a separately reviewed replacement Factory/Router or another reviewed launch-control design.
- Do not silently change source while continuing to reference already-deployed addresses; a replacement requires new addresses and a new deployment manifest.

### F-02 — Source/runtime bytecode attestation
Severity: **Resolved technical gate / evidence maintenance required**

The previous source/runtime blocker has been resolved by reproducible exact matching of WKAM, Factory, and Router to live runtime code using the deployment compilers/settings described above, plus receipt/address/block verification.

Remaining requirement:
- Preserve the reproduction workflows and evidence with the audit handoff.
- Independent external review is still required and is not replaced by this resolution.

### F-03 — Independent external smart-contract review is not evidenced
Severity: **High release-gate blocker**

No completed independent external audit/review artifact is currently evidenced in this repository review.

Required resolution:
- Independent reviewer/auditor must review WKAM, Factory, Pair, Router, and the minimal ERC-20 interface at the frozen source identifiers supplied in the audit handoff.
- Findings must be triaged and resolved or formally accepted before liquidity movement.

### F-04 — Router has no transaction deadline parameter
Severity: **Low / Medium UX-risk**

Swap and liquidity functions rely on amount-minimum parameters but do not include a transaction deadline. A transaction can remain executable while pending as long as its minimum amount constraints remain satisfied.

Required resolution:
- External reviewer should determine whether deadline protection should be added to the production Router.
- If Router is replaced, use a new deployment address and manifest; do not mutate the source-to-address relationship for the live Router.

### F-05 — Liquidity minimum checks are asymmetric in `_optimalAmounts`
Severity: **Low**

When one desired side is used in full, the corresponding `amountMin` is not explicitly checked against that full desired amount. Normal callers should supply sane values, but the minimum-amount semantics should be explicit and covered by tests.

Required resolution:
- Add tests for `amountADesired < amountAMin` and `amountBDesired < amountBMin` edge cases.
- External reviewer should decide whether explicit precondition checks are required in a replacement Router.

### F-06 — Standard ERC-20 behavior only
Severity: **Informational but mandatory quote-asset constraint**

Pair/Router transfers expect standard `transfer`/`transferFrom` boolean behavior and exact transferred amounts. Fee-on-transfer, rebasing, and unusual ERC-20 implementations are unsupported.

Required resolution:
- Any first quote asset must be independently verified for compatibility with these assumptions.

### F-07 — Native-value external calls require reviewer attention
Severity: **Low / defense-in-depth review**

The deployed WKAM uses a low-level native-value call in `withdraw()`. Its state effect and withdrawal events occur before the external call, so the previously reported `reentrancy-events` warning from the later trading WKAM variant does **not** apply to the deployed canonical WKAM source.

The Router also performs native-value calls for refunds and KAM outputs.

Required resolution:
- External reviewer should assess reentrancy behavior, callback interactions, and whether explicit guards are desirable for defense in depth.
- Any changed contract must be redeployed to a new address rather than rewriting the provenance of the already-deployed runtime.

## Quote-asset gate

Current policy remains:

1. Prefer a legitimate, externally backed **officially supported USDC** on KriptoAman Mainnet if an issuer/bridge/provider explicitly supports Chain ID 22028.
2. Use **WETH** only as a fallback if a legitimate bridge/provider explicitly supports Chain ID 22028.
3. Do not deploy a locally created token named USDC/USDT/WETH and present it as canonical.
4. Verify issuer/bridge provenance, destination contract, bytecode, symbol, decimals, mint/burn or escrow model, and withdrawal path before approving the asset.

Until a legitimate supported destination asset is independently proven, **no production pair should be created and no production liquidity should be seeded.**

## Treasury and liquidity gate

Before any funds move, record:

- authorized treasury/liquidity wallet(s);
- approval authority and required signers;
- exact WKAM amount;
- exact counter-asset amount;
- intended initial pool ratio and rationale;
- maximum slippage / price-impact policy;
- LP-token custody policy;
- transaction approvals and hashes;
- incident/rollback procedure.

## Required execution order

1. Preserve green source/runtime attestation and freeze audit evidence.
2. Obtain independent external contract review.
3. Resolve F-01 launch-control decision and any auditor findings.
4. Verify legitimate quote-asset provenance and bridge/withdrawal path.
5. Record treasury/liquidity authorization.
6. Create exactly one deliberately small controlled pool.
7. Seed only a deliberately small controlled liquidity amount.
8. Verify pair address and reserves on-chain.
9. Execute a deliberately small WKAM wrap/unwrap smoke test.
10. Execute small buy and sell smoke tests in both directions.
11. Remove a small portion of liquidity to validate LP redemption.
12. Confirm RPC/explorer agreement and archive transaction receipts.
13. Only then enable Connect Wallet.
14. Only after all previous gates pass enable Swap and describe KAM DEX as live.

## Current decision

**HOLD.**

Source/runtime identity is now reproducibly evidenced. The remaining primary blocker is independent external contract review, followed by launch-control, quote-asset, treasury authorization, and controlled-liquidity gates.

# KAM DEX V2 Revision 3 — Internal Security Review

Date: 2026-09-05
Reviewer: KriptoAman internal engineering/security review
Classification: **INTERNAL REVIEW — NOT AN INDEPENDENT AUDIT**
Production status: **HOLD**

## 1. Purpose

This document records an internal security review of the frozen KAM DEX V2 Revision 3 candidate. It is intended to strengthen the code and evidence package before independent external review. It must not be presented as an independent audit, third-party attestation, production authorization, listing approval, regulatory approval, or liquidity authorization.

## 2. Frozen source scope

Frozen candidate commit:

`dc5b27185b0029f83c8d1ee8848c851b187d32d6`

Reviewed core scope:

- `chain/kam-mainnet/trading/dex-v2/KAMFactoryV2.sol`
- `chain/kam-mainnet/trading/dex-v2/KAMPairV2.sol`
- `chain/kam-mainnet/trading/dex-v2/KAMRouterV2.sol`
- canonical `chain/kam-mainnet/trading/contracts/WKAM.sol`
- `chain/kam-mainnet/trading/dex/interfaces/IERC20Minimal.sol`
- `chain/kam-mainnet/trading/test/KAMDEXV2.t.sol`
- deployment preparation and release-gate documentation on draft PR #393

The frozen contract blobs remain unchanged by the additional internal-review tests and documentation added after the freeze.

## 3. Methodology used in this internal pass

The internal pass included:

- manual source review of Factory, Pair, Router and WKAM;
- launch-control and first-liquidity path review;
- reserve, LP mint/burn and constant-product accounting review;
- transaction deadline and minimum-amount semantics review;
- reentrancy surface review across Factory, Pair, Router and WKAM interactions;
- counterfactual/predictable CREATE-address pre-funding review;
- ERC-20 compatibility and malicious/non-standard-token assumption review;
- custody impact review for immutable `pairCreator`;
- review of existing Foundry regression coverage and GitHub Actions evidence;
- addition of a dedicated adversarial test suite on the draft audit branch.

This pass is not formal verification and is not a substitute for an attributable independent audit.

## 4. Existing evidence verified

For the exact frozen commit, the following pull-request-triggered workflows were observed successful:

- KAM DEX Contract;
- CI;
- WKAM Contract;
- repository Security Audit automation;
- KAM Chain Freeze Guard;
- live/readiness smoke workflows.

On the frozen commit itself, CodeQL Security Analysis and KAM Mainnet Promotion Gate were observed as cancelled, so they must not be represented as successful evidence for that exact commit.

A later PR head (`5a6945046886bd62fbc831b6cac0a8c152c7c2c9`) showed all 14 relevant workflows successful, including CodeQL and KAM Mainnet Promotion Gate. Those later commits were operational/documentation/CI changes and did not alter the frozen Revision 3 contract blobs.

## 5. Additional adversarial coverage added

New test file:

`chain/kam-mainnet/trading/test/KAMDEXV2Adversarial.t.sol`

Coverage added:

1. fee-on-transfer token during first seed must fail closed and roll back pair creation;
2. ERC-20 transfer functions returning no ABI boolean must fail closed and roll back pair creation;
3. token callback attempting Factory reentrancy during `transferFrom` must be blocked by the Factory lock;
4. token callback attempting Pair reentrancy during swap output must be blocked by the Pair lock;
5. fuzzed standard-token swaps must not decrease the reserve constant product;
6. public Pair `mint()` must remain unavailable before factory-controlled initial seed.

The KAM DEX workflow was updated on the draft branch to execute this adversarial suite. At the time this document was created, a new GitHub Actions result for the latest connector-created head had not yet appeared, so these new tests are **PENDING CI EVIDENCE** and are not recorded as passed yet.

## 6. Findings

### ISR-01 — Immutable pairCreator is a launch-integrity custody dependency

Severity: **MEDIUM — operational/security**

`KAMFactoryV2` binds an immutable `pairCreator`. Before permissionless pair creation is enabled, compromise or misuse of this authority could create an intended production token pair at an unauthorized ratio and make the canonical Factory mapping for that pair unavailable for a clean re-creation without replacing the Factory.

This does not itself grant access to treasury assets, but it can compromise launch integrity and force redeployment.

Required control:

- keep Gate C active;
- prefer reviewed multisig/threshold custody;
- separate pair-creation authority from treasury authority where practical;
- verify the exact public `pairCreator` address before deployment;
- do not enable permissionless mode automatically.

Status: **OPEN CONTROL / PRODUCTION BLOCKER UNTIL CUSTODY APPROVED**.

### ISR-02 — Non-standard ERC-20 behavior is intentionally not broadly supported

Severity: **LOW for the official controlled pair / MEDIUM compatibility risk for permissionless pairs**

The implementation uses strict boolean-return ERC-20 calls and exact first-seed balance verification. This is a strong fail-closed posture for the official controlled launch, but fee-on-transfer, no-return, rebasing, malicious-balance, or other non-standard tokens may revert or behave incompatibly.

Required control:

- official KAM DEX quote asset must have verified provenance and known token semantics;
- public UI must not imply that every permissionless ERC-20 is safe or supported;
- document unsupported token classes;
- keep official pool allowlisting/verification separate from permissionless on-chain pair existence.

Status: **CONTROL REQUIRED; NOT A FUND-SAFETY DEFECT FOR VERIFIED STANDARD TOKENS**.

### ISR-03 — Direct Pair interactions retain atomicity assumptions

Severity: **LOW / USER-SAFETY**

As with Uniswap-V2-style Pair semantics, users should not transfer swap input tokens or LP tokens to a Pair in one transaction and call `swap`, `mint`, or `burn` in a later transaction. Assets sitting in the Pair before the follow-up call can be consumed by another caller. The Router performs the intended transfer + Pair action atomically and avoids this workflow.

Required control:

- production UI must use Router paths;
- documentation must warn against manual two-transaction Pair workflows;
- no user-facing feature should instruct users to send assets directly to a Pair first.

Status: **DOCUMENT / UI CONTROL**.

### ISR-04 — Zero-recipient validation is not uniform at Router/Pair boundary

Severity: **LOW**

Some Router/Pair entry points rely on underlying token behavior rather than uniformly rejecting `to == address(0)`. Standard WKAM rejects zero-address transfers, while arbitrary ERC-20 behavior may differ. This is primarily a user-error and compatibility hardening issue, not an identified theft path.

Potential remediation for a future revision:

- add explicit non-zero recipient checks to user-facing Router state-changing functions and Pair mint/burn/swap recipient paths where appropriate.

Changing frozen contract source would require a new frozen revision and external-scope refresh, so no source change is authorized by this internal report.

Status: **ACCEPT FOR REVIEW / CONSIDER FUTURE HARDENING**.

### ISR-05 — Extreme-balance arithmetic fails closed before reserve update

Severity: **INFORMATIONAL**

Initial liquidity computes `sqrt(balance0 * balance1)` before the Pair stores reserves as `uint112`. Extremely large or maliciously reported balances can cause checked-arithmetic reverts before the explicit reserve-width check. This is fail-closed and no fund-loss path was identified in this pass.

Potential future hardening:

- validate first-seed balances against `uint112` limits before multiplication to provide clearer bounds and errors.

Status: **INFORMATIONAL**.

### ISR-06 — WKAM withdrawal external call requires continued adversarial coverage

Severity: **INFORMATIONAL / TEST GAP**

WKAM reduces account balance and total supply before sending native KAM, following checks-effects-interactions. No double-withdraw path was identified in manual review. Native callback behavior should nevertheless remain in the adversarial/fuzz plan, especially for Router `removeLiquidityKAM` and `swapExactTokensForKAM` flows.

Status: **ADDITIONAL TEST COVERAGE REQUIRED BEFORE INTERNAL REVIEW COMPLETION**.

## 7. Critical/High result for this pass

- Critical findings identified: **0 in this internal pass**.
- High findings identified: **0 in this internal pass**.

This statement means only that none were identified by the current internal review. It is not evidence that no Critical/High issue exists.

## 8. Positive security properties observed

The reviewed frozen candidate includes the following useful defenses:

- no empty-pair creation path in V2;
- atomic pair creation + first authorized seed;
- controlled launch authority before explicit permissionless transition;
- first-seed exact-balance verification;
- counterfactual pre-funding recovery before official reserve verification;
- no public Pair mint before initial seed completion;
- Factory, Pair and Router reentrancy locks on relevant state-changing paths;
- Router does not auto-create missing pairs;
- deadlines on Router state-changing user flows;
- symmetric liquidity-minimum checks in V2;
- 0.30% swap-fee constant-product enforcement;
- canonical WKAM has no owner, admin mint, tax, blacklist or upgradeability.

## 9. Current internal disposition

**INTERNAL SECURITY STATUS: AUDIT-READY WITH OPEN CONTROLS**

**PRODUCTION STATUS: HOLD**

This internal review does not authorize:

- V2 mainnet deployment;
- production pair creation;
- pairCreator selection without custody approval;
- treasury movement;
- liquidity seeding;
- public Connect Wallet activation;
- public Swap activation;
- any claim that KAM DEX is independently audited or live.

## 10. Required next gates

Before any production liquidity decision:

- [ ] obtain CI evidence for `KAMDEXV2Adversarial.t.sol`;
- [ ] add/verify native KAM/WKAM callback and Router native-path adversarial tests;
- [ ] approve `pairCreator` custody model and public address;
- [ ] verify official quote-asset provenance and token semantics;
- [ ] independently verify deployed bytecode/runtime if V2 is later deployed;
- [ ] obtain attributable independent external review of the exact frozen scope;
- [ ] resolve all Critical/High external findings and fund-safety Medium findings;
- [ ] receive explicit external GO/HOLD for a deliberately small controlled canary liquidity phase.

Only after these gates pass should treasury authorization and a deliberately small canary liquidity plan be considered.

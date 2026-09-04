# KAM DEX V2 Revision 3 — Independent Audit Handoff

Status: **AUDIT HANDOFF — PRODUCTION HOLD**

This document packages the KAM DEX V2 Revision 3 scope for independent smart-contract review. It does **not** declare the DEX production-ready, authorize contract deployment, authorize treasury movement, seed liquidity, or activate public swapping.

## 1. Review objective

The reviewer should determine whether the frozen KAM DEX scope is suitable to proceed to a separate deployment decision gate on KriptoAman Mainnet (Chain ID `22028`). A passing CI/build result is supporting evidence only and is not a substitute for an independent security assessment.

The expected review should identify exploitable defects, unsafe assumptions, economic/accounting edge cases, integration risks, and operational constraints before any mainnet Factory/Router broadcast or liquidity action.

## 2. Frozen contract scope

Reviewed contract baseline recorded by the deployment decision package:

`e7efd908b1fc89a8a917e1fe82df5764374222fd`

A repository comparison from that baseline through main merge commit `3cd3000368b1e36427ab0b2948ef6ffaff910112` shows no changes to the three DEX contract files below. Deployment/tooling evidence changed, but these contract sources did not.

In-scope DEX contracts:

- `chain/kam-mainnet/trading/dex/KAMFactory.sol`
  - current Git blob: `77e05ff4240b0a58e9783e1240116f961dbf7d50`
- `chain/kam-mainnet/trading/dex/KAMPair.sol`
  - current Git blob: `99dc103515d04156d63428138b7a5dbd180ae137`
- `chain/kam-mainnet/trading/dex/KAMRouter.sol`
  - current Git blob: `b8b5518f6551db7f8ad6c942c636e34f54c55c0c`

Canonical wrapped-native dependency:

- `chain/kam-mainnet/trading/contracts/WKAM.sol`
  - current Git blob: `a2a8130392e08642a79b599227389d4cbe406650`
  - recorded deployment address: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
  - recorded deployment block: `240024`
  - recorded deployment transaction: `0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf`

The separate source `chain/kam-mainnet/contracts/WKAM.sol` is legacy/reference-only for this review unless bytecode equivalence is independently proven.

## 3. Intended system behavior

- EVM target: Solidity `0.8.24`, Paris-compatible bytecode.
- Native asset: `KAM`.
- Wrapped native asset: `WKAM`, intended 1:1 with native KAM held by the wrapper.
- Factory: one pair per token combination.
- Pair: constant-product AMM, LP accounting, mint/burn, reserve tracking and 0.30% swap fee.
- Router: add/remove liquidity and exact-input single-hop swaps with explicit slippage bounds.
- No upgradeability.
- No protocol fee switch.
- No privileged DEX admin control intended.
- No oracle.
- Standard ERC-20 behavior only; fee-on-transfer and rebasing assets are outside the supported scope.

## 4. Required security review areas

At minimum, review:

1. Reentrancy and callback surfaces, including native-KAM/WKAM flows.
2. Reserve accounting and constant-product invariant enforcement.
3. LP mint/burn arithmetic, rounding, minimum-liquidity behavior and first-liquidity edge cases.
4. Swap fee calculation, amount-in/amount-out validation and invariant preservation.
5. Token ordering, pair uniqueness, CREATE/CREATE2 assumptions if applicable, and pair initialization safety.
6. Router allowance/transfer flows and approval assumptions.
7. Slippage and deadline protections.
8. Native KAM wrap/unwrap, refund and failed-transfer behavior.
9. Zero-address, zero-amount, empty-reserve and insufficient-liquidity paths.
10. Unexpected ERC-20 return behavior and unsupported token classes.
11. Denial-of-service/griefing paths and forced token/native transfers.
12. Arithmetic overflow/underflow assumptions and unsafe unchecked blocks.
13. Price manipulation and flash-liquidity limitations; confirm the DEX is unsuitable as a secure oracle.
14. Front-running/MEV exposure and user-facing implications.
15. Factory/Router constructor binding to the canonical WKAM address.
16. Any mismatch between documented behavior and actual contract behavior.
17. Deployment assumptions that could invalidate an otherwise-correct source review.

## 5. Out-of-scope / separate approvals

The smart-contract review does not authorize or validate:

- Treasury custody or treasury movement.
- Liquidity amount or source wallet.
- Counter-asset legitimacy or bridge backing.
- Initial pool price, market value, TVL, volume or market demand.
- CoinGecko/CoinMarketCap/MetaMask/wallet/exchange listing.
- Regulatory approval.
- Automated CI deployment.

A token named USDT/USDC or similar must never be represented as the externally issued asset without independently verified provenance.

## 6. Evidence available to reviewer

Repository evidence includes:

- `README.md` — production gates and supported limitations.
- `CANONICAL_WKAM.md` — WKAM canonicalization and recorded deployment evidence.
- `DEPLOYMENT_DECISION_CHECKLIST.md` — explicit no-broadcast gate.
- `PRE_SIGN_DEPLOYMENT_REVIEW.md` — human signing checklist and separate liquidity gate.
- `DEPLOYMENT_PLAN.md` and `MAINNET_DEPLOY_COMMAND.md` — deployment planning only; no automatic authorization.
- `chain/kam-mainnet/deployments/wkam.json` — recorded WKAM deployment metadata.
- `chain/kam-mainnet/deployments/dex.mainnet.deployment.json` — deployment evidence/record if populated; existence alone is not an approval signal.
- Relevant CI, CodeQL and security workflow evidence.

The reviewer should independently reproduce build/tests from a pinned commit and should not rely solely on repository status badges or prior internal statements.

## 7. Required auditor deliverables

For an audit to be attributable and actionable, the final package should include:

- Auditor/reviewer identity or organization.
- Date and review period.
- Exact repository commit SHA reviewed.
- Exact files/source hashes reviewed.
- Toolchain/compiler configuration used.
- Testing/static-analysis methodology.
- Findings table with severity: Critical / High / Medium / Low / Informational.
- Clear reproduction steps for each actionable finding.
- Recommended remediation.
- Remediation status after re-review: fixed / accepted / unresolved / not applicable.
- Explicit statement of limitations and unaudited components.
- Final signed or attributable report URL/file reference.

A verbal statement, anonymous chat message, or unattributable screenshot is not sufficient evidence of a completed independent audit.

## 8. Post-audit decision gates

Even after an attributable audit is completed, production remains blocked until a separate decision confirms:

- Critical findings: `0` unresolved.
- High findings: `0` unresolved unless an explicit written risk acceptance is approved.
- Exact deployment commit is frozen.
- Chain ID `22028` is re-verified immediately before signing.
- Canonical WKAM runtime/source relationship is independently verified.
- Factory is deployed and independently verified before Router signing.
- Router constructor binds only to verified Factory + canonical WKAM.
- Legitimate quote-asset provenance is verified.
- Treasury/liquidity authorization is separately recorded.
- Initial pool parameters and implied price are reviewed.
- Small controlled liquidity + wrap/unwrap + buy/sell smoke tests are approved only after every earlier gate passes.

## 9. Current authorization state

`INDEPENDENT_AUDIT_COMPLETED = false`

`FACTORY_DEPLOYMENT_AUTHORIZED = false`

`ROUTER_DEPLOYMENT_AUTHORIZED = false`

`LIQUIDITY_AUTHORIZED = false`

`PUBLIC_SWAP_AUTHORIZED = false`

Until an attributable external report is received and the post-audit decision gates are completed, KAM DEX remains **production hold / not yet trading**.

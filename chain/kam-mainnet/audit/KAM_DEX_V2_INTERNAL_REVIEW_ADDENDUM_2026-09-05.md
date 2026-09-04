# KAM DEX V2 Revision 3 — Internal Review Addendum

Date: 2026-09-05
Classification: **INTERNAL REVIEW ADDENDUM — NOT AN INDEPENDENT AUDIT**
Production status: **HOLD**

## Purpose

This addendum records security work completed after the initial internal review. It does not modify or supersede the frozen KAM DEX V2 Revision 3 contract source and does not authorize deployment or liquidity.

## Frozen source integrity

Frozen candidate commit:

`dc5b27185b0029f83c8d1ee8848c851b187d32d6`

Latest branch head after this addendum's preparation included only post-freeze test, workflow, documentation, release-gate and deployment-preparation changes. A direct commit comparison from the frozen candidate to the pre-addendum head `d61cf904e26b36e8bf90efd2c567cc823f318a72` showed no modification to:

- `KAMFactoryV2.sol`;
- `KAMPairV2.sol`;
- `KAMRouterV2.sol`;
- canonical `WKAM.sol`.

The external-review contract scope therefore remains Revision 3 at the frozen commit above.

## Native KAM / WKAM adversarial coverage added

New test file:

`chain/kam-mainnet/trading/test/KAMDEXV2NativeAdversarial.t.sol`

Coverage:

1. **WKAM reentrant withdrawal callback** — a receiver attempts a second withdrawal during native KAM return; expected result is fail-closed because WKAM balance/supply are reduced before the external call.
2. **Token -> native KAM swap recipient callback** — a recipient receiving KAM from `swapExactTokensForKAM` attempts Router reentry; expected result is rejection by the Router lock.
3. **Remove-liquidity native KAM recipient callback** — a recipient receiving KAM from `removeLiquidityKAM` attempts Router reentry; expected result is rejection by the Router lock.
4. **`addLiquidityKAM` refund callback** — a caller receiving excess-native-KAM refund attempts Router reentry; expected result is rejection by the Router lock.
5. **Direct native KAM send to Router** — a non-WKAM sender attempts a bare native transfer; expected result is rejection by the Router `receive()` restriction.

The `KAM DEX Contract` workflow was updated to execute both:

- `KAMDEXV2Adversarial.t.sol`;
- `KAMDEXV2NativeAdversarial.t.sol`.

## Execution-evidence status

The connector-created commits did not produce a new pull-request workflow run at the time of verification. A local fallback execution was also attempted, but the available execution environment did not contain Foundry/solc and had no direct GitHub network resolution.

Therefore the new adversarial suites remain:

**SOURCE PREPARED / CI EXECUTION EVIDENCE PENDING**

They must not be represented as PASS until a real Foundry workflow result is attached.

## pairCreator custody gate

Gate C remains open. Internal recommendation recorded on Issue #396:

- prefer a threshold/multisig model, provisionally 2-of-3 if the exact implementation is validated on Chain ID 22028 and accepted by the independent auditor;
- do not select or publish a pairCreator address merely for convenience;
- separate pair-creation authority from treasury authority where practical;
- do not store signer secrets in repository, CI, chat or audit artifacts;
- retain HOLD for a single-EOA fallback unless explicitly accepted by an independent reviewer for a narrowly bounded canary.

No signer set or public pairCreator address is approved by this addendum.

## Quote-asset / Circle gate

Issue #375 was updated with the latest Circle response:

- Circle indicated that beginning with the Bridged USDC Standard is a sensible interim path;
- this is not native USDC or CCTP approval;
- native USDC/CCTP evaluation has no single fixed minimum checklist and would involve broader due diligence, including information on disclosed funding;
- production quote-asset approval remains HOLD until bridge provenance, escrow/lock model, withdrawal path, destination implementation, roles/minter controls, upgrade path and operational safeguards are verified.

No locally created token may be represented as USDC.

## Current disposition

**Internal security posture:** AUDIT-READY WITH OPEN EXECUTION/EXTERNAL GATES

**Production posture:** HOLD

Remaining blockers before any canary liquidity decision:

- [ ] Foundry CI evidence for both adversarial suites;
- [ ] external independent review of the exact frozen Revision 3 scope;
- [ ] approved pairCreator custody model and exact public address;
- [ ] verified legitimate quote-asset/bridge provenance and withdrawal path;
- [ ] resolution of all Critical/High and fund-safety Medium findings;
- [ ] external GO/HOLD disposition for deliberately small controlled canary liquidity;
- [ ] separate treasury authorization for exact canary amounts.

No production liquidity movement is authorized.
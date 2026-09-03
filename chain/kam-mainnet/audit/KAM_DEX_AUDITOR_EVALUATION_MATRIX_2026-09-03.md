# KAM DEX — Independent Auditor Evaluation Matrix

Date: 2026-09-03
Parent procurement gate: GitHub Issue #389
Parent security gate: GitHub Issue #388
Frozen candidate: KAM DEX V2 Revision 3

Status: **PROCUREMENT PREPARED / NO AUDITOR SELECTED**

This matrix is vendor-neutral. It is intended to prevent selection based only on brand, speed, price, automated-scanner output, or marketing badges.

## Mandatory disqualifiers

A reviewer is not acceptable for Gate 2 if any of the following applies:

- cannot confirm independence from KAM DEX implementation/deployment;
- will not review the exact frozen Revision 3 source/blob identifiers;
- will not review the canonical deployed WKAM source in scope;
- will not assess DeFi/AMM-specific accounting, invariant, LP mint/burn and launch behavior;
- will not provide an attributable severity-rated written report;
- will not disclose material conflicts of interest;
- will not state required fixes versus accepted risks;
- will not offer fix-review/re-review terms for material changes;
- will not provide an explicit GO/HOLD disposition for a deliberately small controlled canary deployment/liquidity phase.

Any mandatory disqualifier => **REJECT / DO NOT ENGAGE FOR GATE 2**.

## Weighted evaluation

Score each category from 0 to 5, then multiply by weight.

| Category | Weight | What good evidence looks like |
| --- | ---: | --- |
| EVM/Solidity smart-contract security depth | 20% | senior reviewers, relevant public reports, manual review beyond scanners |
| AMM/DEX/DeFi experience | 20% | prior invariant, LP accounting, Router/Factory/Pair or similar reviews |
| Exact frozen-scope discipline | 15% | confirms exact commit/blob identifiers and compiler/reproduction context |
| Launch-integrity / adversarial analysis | 10% | first-liquidity, counterfactual pre-funding, transaction ordering, griefing review |
| Methodology and tooling | 10% | manual review plus appropriate static/fuzz/invariant/formal techniques where useful |
| Fix-review / re-review quality | 10% | clear remediation cycle, retest scope, changed-source handling |
| Report attribution and transparency | 5% | named organization/reviewer, severity definitions, affected paths, final artifact |
| Conflict-of-interest disclosure | 5% | explicit declaration and independence statement |
| Commercial/operational fit | 5% | clear quote, engagement structure, practical communication and timeline |

Maximum weighted score: 5.00.

## Required scope acknowledgement

The auditor response must explicitly acknowledge review of:

- KAMFactoryV2 frozen Revision 3 source;
- KAMPairV2 frozen Revision 3 source;
- KAMRouterV2 frozen Revision 3 source;
- canonical deployed WKAM source;
- V2 regression/evidence package as supporting evidence, not as a substitute for independent review;
- V1 findings F-01 through F-07 and their V2 dispositions;
- Pair invariant, fee and reserve accounting;
- LP mint/burn and `MINIMUM_LIQUIDITY` behavior;
- atomic first pair + first-seed design;
- predictable CREATE address / counterfactual pre-funding handling;
- deadlines and minimum-amount semantics;
- callback/reentrancy surfaces;
- standard/non-standard token assumptions;
- custody/`pairCreator` model under Gate C #396;
- explicit conditions that must force HOLD.

## Required commercial response fields

Record for each candidate:

- organization/reviewer name;
- primary contact;
- scope accepted / requested changes;
- methodology;
- proposed start structure/timeline;
- quote and payment terms;
- fix-review/retest terms;
- public-report policy;
- conflict-of-interest disclosure;
- report delivery format;
- explicit ability to provide final GO/HOLD disposition.

## Selection rule

Do not select an auditor until all mandatory fields are known. If multiple qualified candidates respond, prefer security depth and scope quality over the lowest quote or fastest promised delivery.

A commercial proposal is not an audit pass. Signing an engagement does not authorize deployment or liquidity.

## Current candidate status

- ChainSecurity — outreach sent; response pending.
- Trail of Bits — outreach sent; response pending.
- OpenZeppelin Security Audit — outreach sent; response pending.

No candidate has been selected, contracted, or accepted as the Gate 2 reviewer as of this record.

## Production rule

Until Gate 2 is completed and accepted:

- V2 deployment: HOLD
- pairCreator selection: HOLD pending custody review
- quote-asset approval: HOLD
- pair creation: HOLD
- treasury movement: HOLD
- liquidity: HOLD
- Connect Wallet: HOLD
- Swap: HOLD
- `KAM DEX live` claim: prohibited

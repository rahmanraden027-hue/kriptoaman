# KAM DEX V2 Revision 3 — External Auditor Verdict Intake

Date: 2026-09-05
Status: **WAITING FOR ATTRIBUTABLE EXTERNAL VERDICT**
Parent gate: #388
Frozen candidate commit: `dc5b27185b0029f83c8d1ee8848c851b187d32d6`

## Purpose

Provide a single acceptance template for any response from ChainSecurity, Trail of Bits, OpenZeppelin Security, or another qualified independent reviewer. This prevents a commercial reply, acknowledgment, scanner result, or ambiguous statement from being mistaken for an audit GO.

## Required identity and scope fields

Do not treat a response as a security verdict unless all applicable fields are known:

- reviewer/auditor organization;
- named reviewer(s) or attributable review team;
- review date;
- exact commit and/or blob identifiers reviewed;
- confirmation that Factory V2, Pair V2, Router V2 and canonical WKAM were in scope;
- methodology/tools used;
- conflicts-of-interest statement or independence confirmation;
- findings with severity and affected path/function;
- remediation/re-review status;
- explicit disposition for a deliberately small controlled canary.

## Accepted verdict states

### GO

A GO is valid only when the independent reviewer explicitly states that the reviewed scope is suitable for a deliberately small controlled canary deployment/liquidity phase, subject to any listed conditions.

Before acting on GO:

- verify all stated conditions are satisfied;
- confirm no Critical/High finding remains unresolved;
- confirm fund-safety/launch-integrity Medium findings are resolved or explicitly accepted;
- verify the reviewed source still matches the frozen scope;
- record quote-asset and custody gates separately;
- execute only the controlled canary runbook, not a broad public launch.

### HOLD

A HOLD is any explicit statement that the reviewed candidate should not proceed to canary deployment/liquidity, or any report containing unresolved Critical/High findings or unresolved fund-safety Medium findings that preclude safe canary testing.

On HOLD:

- no deployment;
- no treasury movement;
- no pair creation;
- no liquidity;
- no wallet/swap activation;
- record each finding and remediation owner;
- create a new frozen revision if contract source changes;
- obtain fix review/re-review before reconsidering GO.

### CONDITIONAL / AMBIGUOUS

If an auditor says "looks good," "no major issues found," provides a quote, confirms receipt, accepts scope, or gives a preliminary observation without an explicit canary suitability decision, classify it as:

**NOT A GO — HOLD PENDING CLARIFICATION**.

## Response processing checklist

When an external response arrives:

1. preserve the original email/report and attachment metadata;
2. record sender domain and attributable identity;
3. confirm exact scope and commit/blob identifiers;
4. extract findings without changing severity language;
5. map findings to Factory/Pair/Router/WKAM/custody/quote-asset gates;
6. classify verdict as GO, HOLD, or NOT-A-GO pending clarification;
7. update Issue #388 with factual evidence;
8. do not close Gate #388 until the acceptance criteria are met;
9. if GO, proceed only to the prepared canary runbook;
10. if HOLD, open remediation tasks and keep production locked.

## Current state

As of 2026-09-05, final follow-up evidence addenda have been sent to ChainSecurity, Trail of Bits and OpenZeppelin Security. No attributable external smart-contract report or explicit GO/HOLD has been received.

Current operational verdict: **HOLD PENDING EXTERNAL REVIEW**.

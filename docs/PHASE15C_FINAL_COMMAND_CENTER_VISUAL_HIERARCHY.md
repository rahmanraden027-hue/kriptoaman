# Phase 15C — Final Command Center Visual Hierarchy

Status: **IMPLEMENTED ON REVIEW BRANCH**

## Objective

Make the KriptoAman public command center communicate product purpose through live data before explanatory or workflow UI.

## Final visual hierarchy

1. **MARKET** — featured market asset, shared market source rail, market pulse.
2. **INTELLIGENCE** — movers and derived intelligence signals.
3. **NETWORK** — ZEVARYQ verified network state and on-chain discovery.
4. **EVIDENCE** — universal verification surface.
5. **FLOW** — Observe → Understand → Decide → Execute → Verify as a compact secondary rail.

The hierarchy is encoded in HomeV10 with machine-readable `data-command-layer` attributes.

## De-duplication rule

All market panels consume the same market provenance object. Phase 15C therefore renders that market provenance once at the market layer instead of repeating the same source/timestamp bar inside every market card.

Independent sources remain independently attributable:

- ZEVARYQ network status keeps its own provenance rail.
- ZEVARYQ on-chain evidence keeps its own provenance rail.

## Visual density

The provenance rail and product flow rail are intentionally compact. They remain visible and machine-readable while primary market, intelligence, network, and evidence data retain visual priority.

## Safety boundary

Phase 15C changes only presentation hierarchy and contract tests. It does not modify network APIs, genesis, validators, private keys, balances, transactions, DNS, RPC write policy, wallet signing/broadcasting, or token state.

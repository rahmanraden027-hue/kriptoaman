# Phase 16F — 24H/72H Production Stability Observation

Status: **LONG-RUN EVIDENCE COLLECTION**

Phase 16F extends the Phase 16E hourly production observation into auditable 24-hour and 72-hour stability windows.

## Important rule

Phase 16F never claims that 24 hours or 72 hours have passed before enough evidence exists.

A single successful run cannot produce a 24H or 72H stable result. The aggregator requires both elapsed evidence span and distinct hourly evidence buckets.

## Source of truth

Phase 16F reads only completed Phase 16E workflow runs from the `main` branch and their retained `phase16e-production-observation` artifacts.

It does not re-create market, RPC, Explorer, or on-chain values.

## 24H acceptance

The 24-hour window requires:

- at least 23 hours of evidence span;
- at least 20 distinct hourly evidence buckets;
- no failed/timed-out/cancelled Phase 16E production observation in the window;
- only `STABLE` or `STABLE_WITH_WARNINGS` source observations.

Until those conditions are met, the status is `PENDING`.

## 72H acceptance

The 72-hour window requires:

- at least 70 hours of evidence span;
- at least 60 distinct hourly evidence buckets;
- no failed/timed-out/cancelled Phase 16E production observation in the window;
- only accepted Phase 16E source observations.

Until those conditions are met, the status remains `PENDING`.

## Overall states

- `COLLECTING` — 24H evidence is not complete.
- `24H_STABLE` — 24H acceptance is complete; 72H is still collecting.
- `24H_STABLE_WITH_WARNINGS` — 24H hard invariants passed with one or more Phase 16E warnings.
- `LONG_RUN_STABLE` — 72H acceptance is complete with no warning observation.
- `LONG_RUN_STABLE_WITH_WARNINGS` — 72H hard invariants passed with warning observations.
- `FAILED` — a source observation failure or invalid source evidence is present in an active window.

## Operational evidence

The aggregate records:

- RPC, network, on-chain, and Explorer block progression;
- minimum observed market asset coverage;
- maximum market snapshot age;
- maximum Explorer lag;
- maximum network probe latency;
- maximum on-chain evidence latency;
- failed source workflow runs;
- missing artifacts;
- warning observations.

## Frozen boundary

Phase 16F keeps `phase16c-final-command-center-v1` frozen. It does not authorize redesign or modify genesis, validators, private keys, balances, token supply, transactions, wallet broadcasting, custody, DNS, RPC write/admin/debug policy, or consensus state.

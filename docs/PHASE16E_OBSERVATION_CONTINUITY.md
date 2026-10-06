# Phase 16E Observation Continuity Guardian

Status: **READ-ONLY CONTINUITY HOTFIX**

## Purpose

Phase 16E is the hourly source of production evidence used by Phase 16F. The primary Phase 16E workflow already contains an hourly schedule, but a continuity gap was observed after the initial merge while other scheduled workflows in the repository continued to run.

This guardian adds a second, independent continuity check without changing the Phase 16E evidence contract.

## Behavior

The guardian runs hourly and on its own main-branch deployment.

It reads the latest Phase 16E workflow runs on `main` and treats continuity as healthy when a queued, in-progress, or successfully completed observation exists within the last 90 minutes.

If no such run exists, the guardian invokes the existing Phase 16E `workflow_dispatch` entry point on `main`.

It does not fabricate an observation and it does not mark Phase 16E stable by itself. The dispatched Phase 16E workflow must still pass its full production observer.

## Safety boundary

The guardian has GitHub Actions write permission only so it can dispatch the existing read-only Phase 16E workflow.

It does not modify UI, production application files, RPC policy, genesis, validators, private keys, balances, token supply, treasury, custody, liquidity, transactions, DNS, or consensus state.

## Phase 16F impact

The Phase 16F acceptance rules remain unchanged. Missing hourly buckets are not backfilled or invented. The long-run window can advance only from real retained Phase 16E observation artifacts.

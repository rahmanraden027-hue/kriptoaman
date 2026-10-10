# Post-24H Execution Order — KriptoAman / ZEVARYQ

Status: **PREPARED / NOT EXECUTED**

This runbook defines the exact order after the Phase 16F 24H gate. Its main purpose is to preserve evidence integrity: the production baseline must remain unchanged through the 72H stability window.

## Why production stays frozen after 24H PASS

A 24-hour PASS proves the first stability milestone. It does not complete the 72-hour proof. If we merge or deploy runtime changes immediately after the 24H gate, the 72H evidence would mix different production baselines and would be weaker as a release proof.

Therefore:

**24H PASS → Device Gate on the same baseline → continue observation → 72H PASS → controlled transition.**

The Device Gate is observational/review-only and does not require a production code change.

## Stage A — 24H acceptance

Verify the actual Phase 16F summary and artifacts. PASS requires the existing contract thresholds, including at least 23 hours of evidence and 20 hourly buckets. Do not infer PASS from workflow success alone.

Once PASS is proven, record the production commit and keep it frozen.

## Stage B — Device Gate on the unchanged baseline

Use the prepared Device Acceptance Pack from PR #1044 without merging it into production.

Validate KriptoAman Platform and ZEVARYQ Wallet on the automated viewport matrix plus a real Android device. Wallet acceptance remains preview-only. No send or swap broadcast is required or permitted by this gate.

A Device Gate failure is a release blocker, but it does not authorize an emergency production mutation unless a separate incident decision is made.

## Stage C — Finish the 72H stability window

Keep Phase 16E observations running and continue Phase 16F aggregation. Do not merge PR #1042, #1043 or #1044 into the active production baseline merely because 24H has passed.

72H PASS must satisfy the existing Phase 16F contract, including at least 70 hours of evidence and 60 hourly buckets.

## Stage D — Refresh all preparation work

After 72H PASS:

- refresh/rebase PR #1042, #1043 and #1044 onto current `main`;
- rerun all CI;
- resolve any drift introduced during the observation window;
- do not bulk-merge all preparation PRs at once.

Each production-impacting change must retain an independent rollback/verification point.

## Stage E — Canonical ZVQ status alias

PR #1042 prepares `/api/zvq/network-status` as a compatibility alias to the existing verified network-status handler.

The legacy `/api/kam/network-status` endpoint remains available. The first transition must prove that both paths expose the same ZEVARYQ identity and read-only network evidence.

Do not remove the legacy endpoint in this phase.

## Stage F — Protected runtime transition

Changing the Wallet/Platform preference from the legacy endpoint to the canonical ZVQ endpoint touches protected production runtime files. The current Phase 14 governance manifest is locked and its transition is inactive.

A new, separate transition-governance PR must therefore be created before touching protected runtime paths. It must authorize only the exact files needed and must not authorize chain-state or financial-state mutation.

No transition may modify genesis, validators, private keys, balances, token supply, liquidity, custody, DNS, consensus, wallet signing/broadcasting, or RPC write methods.

## Stage G — Public identity cleanup

Use PR #1043 as the source of truth for presentation cleanup.

Only user-facing retired network labels are changed. Internal compatibility paths, historical archives and KAM Points remain distinct and preserved according to the cleanup manifest.

## Stage H — Post-change regression

After the canonical endpoint preference and public copy cleanup are deployed:

- repeat the critical Device Acceptance checks;
- rerun Wallet Production Gate;
- rerun Explorer browser/public proof;
- verify Chain ID 22028 / 0x560c and ZVQ identity;
- verify wallet broadcast and RPC write methods are still locked;
- verify no visible split-brain between Platform, Wallet and Explorer.

## Final release decision

The final release decision is made only from evidence after the transition, not from the preparation PRs themselves.

Prepared PRs are implementation inputs. A green preparation PR does not equal production acceptance.

# Phase 14 — Release Governance & Hard Enforcement

Status: **TRANSITION ACTIVE — REVIEW REQUIRED**

Phase 14 starts from the accepted Phase 13 production baseline:

- Phase 13 final commit: `0b5be71b8386e7af8bc1969acbb85aa7ea23b7c5`
- Phase 13 final PR: `#1020`
- Phase 13 result: `FINAL / PASS`

## Existing GitHub enforcement

The repository already has an active ruleset:

- Ruleset: **KriptoAman Production Main Protection**
- Ruleset ID: `21245066`
- Scope: default branch
- Pull request required
- Review threads must be resolved
- Branch deletion blocked
- Non-fast-forward updates blocked
- Strict required-status policy enabled
- Required contexts:
  - `kriptoaman/production-security`
  - `kriptoaman/live-site-smoke`
- Bypass actors: none

The current connector does not have repository-administration permission to mutate this ruleset. Phase 14 therefore hardens the already-required `kriptoaman/production-security` context.

## Hard-enforcement design

The required Security Audit workflow now executes:

`node scripts/verify-phase14-release-governance.mjs`

The verifier reads the machine-readable governance contract, fetches the live GitHub ruleset, and fails when any required hard-enforcement property is weakened.

Because `kriptoaman/production-security` is a required status check in the active ruleset, verifier failure blocks merge to `main`.

## Controlled transition

Phase 13 already protects `security-audit.yml`. Phase 14 therefore uses one narrow transition:

- exact branch: `phase14a-hard-enforcement-transition`
- exact baseline: `0b5be71b8386e7af8bc1969acbb85aa7ea23b7c5`
- exact protected path allowed to change: `.github/workflows/security-audit.yml`
- every other protected path remains fail-closed

The transition is temporary and must be sealed after the hard-enforcement PR is merged.

## Runtime boundary

Phase 14 does not modify genesis, validator keys, private keys, balances, transactions, DNS, RPC write behavior, wallet signing/broadcasting, or token state.

## Completion sequence

1. Merge the hard-enforcement transition PR only after all production/security gates pass.
2. Disable the transition and advance the release baseline to the Phase 14 enforcement commit.
3. Add Phase 14 governance files and the Phase 13 governance workflow to the locked governance surface.
4. Re-run post-merge production/security evidence.

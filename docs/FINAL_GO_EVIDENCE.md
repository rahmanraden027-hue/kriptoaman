# KriptoAman Final Production GO Evidence

This file defines the final evidence gate for production release. Passing static tests alone is not sufficient.

## Automated production checkpoint — 2026-09-07

This checkpoint records repeatable automated evidence from current production. It does not replace the GO / CONDITIONAL GO / NO-GO policy below and does not imply third-party wallet, exchange, token-registry or regulator approval.

Verified on production after commit `9c356eed2ef5a6a6496b5c372125bd84eefde79d`:
- Production SLO Proof #55 completed with status `target_met`.
- Six samples per endpoint completed with zero request failures.
- `platform-status` p95: 545 ms.
- `network-health` p95: 267 ms.
- KAM `network-status` p95: 285 ms.
- Multi-chain verification: 21/21 online, 0 degraded.
- No SLO target misses and no hard-gate failures were reported.
- CI, Security Audit, CodeQL, Live Capacity & Network Smoke, Live Core Readiness Smoke, Auth Live Smoke, Market Data Trust Gate and Disaster Recovery Proof passed on the production latency-hardening change before merge.

KAM Explorer backend/indexer was separately revalidated read-only on 2026-09-07 with RPC height equal to Blockscout indexed height and indexer gap 0. Explorer frontend presentation cleanup is tracked separately and must not be represented as a chain-state or validator issue.

sKAM is outside the KriptoAman web-platform GO decision. Its mint, liquidity, wallet detection and third-party listing states are governed by their own evidence and must not be inferred from this release gate.

## Dependency moderate cleanup

Production release blocks on High/Critical dependency findings. Moderate findings are reviewed individually.

Known candidates from the 2026-08-31 audit:
- `react-quill` / Quill: moderate XSS advisory; direct source search currently shows no application reference, so removal is preferred over a breaking downgrade.
- `react-router-dom` / React Router: moderate advisories require a separately regression-tested migration path; do not force-upgrade blindly.
- transitive `uuid` under the Solana dependency chain: direct source search currently shows no application reference to `@solana/web3.js`; remove the direct dependency if a lockfile-safe cleanup proves it unused.

Do not use `npm audit fix --force` on production without a dedicated regression PR.

## Browser and viewport evidence

Required production viewport widths:

320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440, 1920 px.

The automated gate captures full-page Chromium screenshots for every width and runs an automated WCAG 2 AA scan. This is browser evidence, not a substitute for physical-device and assistive-technology testing.

Manual release sign-off must additionally cover at least:
- one Android Chrome physical device,
- one iOS Safari physical device,
- keyboard-only navigation,
- screen-reader smoke test,
- 200% text zoom/reflow,
- focus visibility, dialogs, forms, error messages and fixed navigation.

## Controlled load benchmark

The PR gate runs only the safe read-only smoke profile. Higher production stages are blocked unless an operator explicitly selects a stage and approves production high load.

Required evidence sequence for scale certification:
1. smoke,
2. 1,000 concurrent virtual users,
3. 2,500,
4. 5,000,
5. 10,000.

Stop at the first failed stage. Passing this sequence supports the concurrent-session planning envelope; it does not prove one million simultaneous users. The 1,000,000 figure remains a registered-account architecture target.

## Rollback rehearsal

The final gate rebuilds and regression-tests the current rollback target in isolation. This proves the rollback commit remains buildable. It does not modify production.

Before a major public release, operational sign-off must also confirm the hosting provider can redeploy the known-good commit and that database/schema changes are backward compatible or have a tested restore path.

## Final decision policy

### GO
Allowed only when:
- CI/build/security/CodeQL are green,
- production health and live smokes are green,
- dependency gate has no High/Critical findings,
- browser viewport evidence is clean,
- automated accessibility scan is clean or every exception is reviewed,
- physical Android/iOS and assistive-technology checks are signed off,
- controlled load target for the intended traffic envelope passes,
- rollback target is buildable and operational rollback is confirmed.

### CONDITIONAL GO
Allowed for normal production traffic when all release/security/health gates pass but scale-certification or manual physical-device evidence is still incomplete. No public claim of one-million-user capacity is allowed.

### NO-GO
Any High/Critical dependency issue, failed security gate, failed production health, reproducible viewport/accessibility blocker, failed load stage within the intended traffic envelope, or unbuildable rollback target blocks release.

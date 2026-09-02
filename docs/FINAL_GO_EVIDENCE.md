# KriptoAman Final Production GO Evidence

This file defines the final evidence gate for production release. Passing static tests alone is not sufficient.

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

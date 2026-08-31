# KriptoAman Production Finalization

This document is the evidence checklist for the final UI/UX, accessibility, performance, capacity, security and rollback gates. A checked item requires retained test evidence; documentation alone is not a PASS.

## 1. UI/UX and responsive audit

Required viewport matrix:

- 320px
- 360px
- 375px
- 390px
- 412px
- 430px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

At each viewport verify public and authenticated routes for accidental horizontal scrolling, text clipping, overlapping fixed elements, duplicate navigation, layout shift, dead actions, broken empty/loading/error states and inconsistent spacing. Primary interactive targets must remain at least 44x44 CSS pixels where practical under WCAG 2.2 target-size guidance.

## 2. Design-system lock

The reviewed final style stack ends at `src/styles/final-ui-v9.css`. Do not add `final-ui-v10.css`, `final-ui-v11.css`, or equivalent version layers. Extend the locked tokens in v9 or refactor an existing layer with regression coverage.

The locked production tokens include minimum control size, spacing, radii and focus treatment. Existing route behavior, auth, KYC, wallets, financial calculations and KAM network behavior are out of scope for presentation-only adjustments.

## 3. Accessibility gate

Target: WCAG 2.2 AA where applicable.

Evidence checklist:

- keyboard-only navigation through every primary route
- visible `:focus-visible` treatment
- semantic headings and landmarks
- associated form labels and error descriptions
- accessible dialog/drawer focus behavior
- no status conveyed only by color
- reduced-motion behavior
- minimum touch target guardrail
- contrast review on default dark and light surfaces
- screen-reader smoke pass on login, dashboard, market, portfolio, wallet/KYC and security flows

Static regression tests are necessary but are not a substitute for browser/assistive-technology testing.

## 4. Performance gate

Production targets:

- Mobile LCP <= 2.5s
- Mobile INP <= 200ms
- Mobile CLS <= 0.1
- Desktop LCP <= 2.0s
- Desktop CLS <= 0.1

The CI bundle guard fails when the build exceeds its reviewed distribution/JavaScript budgets. Real-user or lab Core Web Vitals evidence is still required before marking the performance gate PASS.

## 5. Capacity and staged load gate

See `docs/PRODUCTION_CAPACITY_MODEL.md` and `load/k6-production-readonly.js`.

Staged order: smoke -> 1,000 -> 2,500 -> 5,000 -> 10,000 virtual/concurrent users. Stop at the first failed stage. High-load production execution requires explicit operator opt-in. No load profile may perform blockchain transactions, wallet signing, KYC submission, trading, transfer or other state-changing financial actions.

## 6. Security gate

Required before final GO:

- full regression suite PASS
- production build PASS
- Security Audit PASS
- CodeQL PASS
- secret/private-key checks PASS
- auth/KYC/wallet security regressions PASS
- public KAM sensitive RPC methods remain blocked
- no unresolved reachable Critical/High issue accepted without reviewed mitigation

## 7. Rollback gate

Before production merge/deploy:

1. Record the exact pre-deploy main SHA.
2. Confirm the deployment platform can redeploy that SHA without database reset.
3. Run post-deploy live-site, auth, market/network and KAM smoke checks.
4. If a critical regression appears, restore the prior application SHA first; do not reset KAM genesis, Chain ID, validator keys, treasury or consensus.
5. Preserve failure logs and the rollback SHA as release evidence.

## 8. Final verdict

Only issue `PRODUCTION GO` when every critical gate has current evidence. The one-million-account target remains a design/capacity objective until staged load-test artifacts and production-topology metrics support the claim.

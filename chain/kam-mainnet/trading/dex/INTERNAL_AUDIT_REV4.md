# KAM DEX V2 Revision 4 — Internal Security Review

Status: **INTERNAL HARDENING — PRODUCTION HOLD**

This document records an internal review of the KAM DEX candidate. It is not an independent audit, does not authorize Factory/Router deployment, does not authorize treasury movement, and does not authorize public trading.

## Scope

- `KAMFactory.sol`
- `KAMPair.sol`
- `KAMRouter.sol`
- canonical `WKAM.sol`
- unit, fuzz/invariant, and deployment-simulation tests

## Findings addressed in Revision 4

### KA-INT-001 — Missing transaction deadlines
Severity: Medium
Status: Fixed in Revision 4

The prior Router API enforced slippage bounds but did not enforce user-supplied transaction deadlines. A transaction could therefore remain valid longer than intended if it stayed pending before inclusion.

Revision 4 adds a `deadline` argument and `ensure(deadline)` guard to liquidity and swap entry points. Expired calls revert before pair creation, token movement, or reserve changes.

### KA-INT-002 — Desired/minimum mismatch on first liquidity
Severity: Medium
Status: Fixed in Revision 4

The previous `_optimalAmounts` path returned desired amounts immediately for an empty pool without first validating that desired amounts were greater than or equal to the supplied minimums. Revision 4 validates both desired/minimum relationships before the empty-pool branch.

### KA-INT-003 — Zero recipient protection
Severity: Low
Status: Fixed in Revision 4

Router liquidity and swap entry points now reject the zero address as the recipient.

## Existing hardening evidence

The existing test suite already covers:

- pair uniqueness and invalid pair creation;
- LP mint/burn behavior;
- constant-product preservation with fees;
- slippage failure atomicity;
- fuzzed liquidity round trips;
- fuzzed pro-rata second-liquidity minting;
- output monotonicity;
- native KAM refund behavior;
- WKAM backing equality in tested flows;
- pair reentrancy-lock behavior;
- Factory/Router/WKAM deployment binding simulation.

Revision 4 adds regression coverage for expired deadlines and invalid minimums on initial liquidity.

## Remaining limitations / open risks

- This is an internal review, not an independent external audit.
- Standard ERC-20 behavior is assumed. Fee-on-transfer, rebasing, and non-standard return-value tokens are not supported by this Router.
- The DEX has no oracle. Pool spot ratios must not be used as a secure price oracle.
- Single-hop exact-input swaps only.
- MEV/front-running risk remains inherent to public AMMs.
- Legitimate quote-asset provenance has not yet been approved.
- No treasury or liquidity amount has been authorized.
- No public price exists until a real, disclosed market with legitimate reserves exists.

## Required internal gate before any controlled liquidity pilot

All of the following must be true:

- [ ] Revision 4 CI is green on the exact commit intended for deployment.
- [ ] No unresolved Critical/High internal findings.
- [ ] Chain ID 22028 and block progression are re-verified immediately before signing.
- [ ] Canonical WKAM address/runtime relationship is verified.
- [ ] Factory/Router deployment artifacts are generated from the exact reviewed commit.
- [ ] Counter-asset provenance is independently verified; no imitation USDT/USDC.
- [ ] Treasury owner explicitly approves source wallet and maximum pilot amount.
- [ ] Initial reserve ratio and resulting implied price are reviewed and disclosed as pool-derived, not externally guaranteed.
- [ ] Small add/remove liquidity, wrap/unwrap, buy, and sell smoke tests are prepared.
- [ ] Public swap remains disabled until those smoke tests pass.

## Authorization state

`INTERNAL_REVIEW_REV4_COMPLETED = pending_ci`

`INDEPENDENT_AUDIT_COMPLETED = false`

`FACTORY_DEPLOYMENT_AUTHORIZED = false`

`ROUTER_DEPLOYMENT_AUTHORIZED = false`

`LIQUIDITY_AUTHORIZED = false`

`PUBLIC_SWAP_AUTHORIZED = false`

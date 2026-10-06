# Phase 15F — Cross-Surface Product Alignment

Status: **IMPLEMENTED ON REVIEW BRANCH**

## Objective

Carry the production command-center language from HomeV10 across the principal KriptoAman ecosystem surfaces without collapsing their functional identities.

The aligned surfaces are:

1. Market
2. Intelligence
3. ZEVARYQ Network
4. Portfolio
5. Security
6. ZEVARYQ Wallet

## Shared continuity contract

Every aligned surface exposes:

- `data-product-release="phase15f"`
- a canonical `data-product-surface` identifier
- the shared `CrossSurfaceRail`
- the same ordered surface destinations:
  `Command → Market → Intelligence → Network → Portfolio → Security → Wallet`

The active destination is marked with `aria-current="page"`.

## Visual alignment

KriptoAman intelligence surfaces use the same command-center visual language:

- midnight/cosmic production background
- compact data-first layout
- `ka-command-hero` for primary context
- canonical truth-state language
- compact continuity navigation
- shared spacing and border vocabulary

Security now uses the same command hero contract instead of a separate one-off hero shell.

Market now uses the command hero contract rather than its older isolated card shell.

## Product identity boundary

ZEVARYQ Wallet remains intentionally distinct:

- it keeps the blue/gold execution-interface identity;
- it keeps wallet-specific navigation;
- its protected `src/pages/Wallet.jsx` implementation remains byte-for-byte on the accepted production baseline;
- the unprotected `/wallet-app` route shell supplies the compact KriptoAman continuity rail and Phase 15F markers;
- signing and broadcasting rules are unchanged.

This preserves the architecture:

- KriptoAman = intelligence and control
- ZEVARYQ Wallet = user execution interface
- ZEVARYQ Network = blockchain and settlement
- ZEVARYQ Explorer = evidence and verification

## Route correction

Intelligence Network navigation now points to the canonical `/ZEVARYQ` production surface instead of the legacy `/KAMNetwork` route.

The Portfolio architecture route is corrected from `/dashboard` to `/PortfolioOverview`. The base product architecture contract remains version `2026.1`; Phase 15F is tracked separately through `CROSS_SURFACE_RELEASE`.

## Browser acceptance

The cross-surface browser gate now verifies all six aligned surfaces at:

- mobile: 390 × 844
- desktop: 1440 × 1000

For each surface it requires:

- Phase 15F surface marker
- Phase 15F continuity rail
- correct active surface
- all seven continuity destinations
- no document-level horizontal overflow

The authenticated surfaces use the existing browser-only auth fixture. No real credentials are used.

## Safety boundary

Phase 15F does not alter market data collection, authentication policy, KYC state, wallet signing, transaction broadcast, balances, token state, RPC write policy, genesis, validator configuration, DNS, or chain state. The protected Wallet implementation is also left unchanged.

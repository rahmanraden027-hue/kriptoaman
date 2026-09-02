# KriptoAman Global Readiness 100 Scorecard

Status: evidence-driven improvement program — not a marketing certification.

This scorecard defines what must be demonstrably true before KriptoAman can internally describe the ecosystem as reaching a 100/100 global-readiness target. The score is intentionally evidence-based: repository code, a design, a checklist, or an ambition does not earn full credit unless the corresponding production or independently verifiable evidence exists.

A score of 100 does **not** mean zero future risk, guaranteed market leadership, guaranteed uptime, guaranteed liquidity, guaranteed token value, regulatory approval, or one million simultaneous users. It means every gate in this scorecard has current evidence and no known critical blocker remains within the defined scope.

## Scoring model — 100 points

### 1. Product experience & international UI — 12 points
- [ ] 3 pts — Core web journeys are visually consistent on mobile and desktop and pass regression checks.
- [ ] 2 pts — Indonesian and English experiences are complete for all primary public/user journeys.
- [ ] 2 pts — Accessibility evidence covers keyboard, contrast, labels, focus, reduced-motion and responsive layouts.
- [ ] 2 pts — Market, portfolio, AI/risk context, wallet and paper-trading surfaces use factual loading/error/degraded states.
- [ ] 1 pt — Public landing/crawler state does not confuse loading with failure or fabricate metrics.
- [ ] 2 pts — Physical-device UX review records no unresolved P0/P1 usability blockers.

### 2. Production reliability & failover — 12 points
- [ ] 3 pts — Primary application origin has current production-health evidence tied to exact commit SHA.
- [ ] 3 pts — Independent standby origin is deployed from the same approved revision and passes web/auth checks.
- [ ] 3 pts — Controlled primary-origin drain proves public web, login and registration remain available.
- [ ] 2 pts — Shared auth/session/data topology is proven to avoid split brain.
- [ ] 1 pt — Recovery time, failed requests and rollback evidence are archived.

Primary tracker: #275.

### 3. Security & change control — 12 points
- [ ] 2 pts — CI, dependency audit, secret scan and production security checks are required on protected main.
- [ ] 2 pts — CodeQL and security audit are required and current.
- [ ] 2 pts — Sensitive KAM paths remain under freeze/change-control gates until promotion.
- [ ] 2 pts — Force pushes/deletion are blocked and PR/conversation-resolution controls are enforced.
- [ ] 2 pts — CODEOWNERS approval is required for security-sensitive paths where supported.
- [ ] 2 pts — Incident, credential-leak, account-takeover and emergency-session procedures are tested/documented.

Primary tracker: #166.

### 4. KAM Mainnet production readiness — 14 points
- [ ] 2 pts — Exactly four persistent production validator hosts with unique production identities are proven.
- [ ] 2 pts — Four independent failure domains and persistent storage/time synchronization are proven.
- [ ] 2 pts — Dedicated RPC sentry/origin is separate from validators; management RPC remains private.
- [ ] 2 pts — Protected Cloudflare RPC origin (`KAM_RPC_ORIGIN`) is verified without exposing the origin.
- [ ] 2 pts — At least 24 consecutive real hours of passing block-production/public-endpoint evidence is archived.
- [ ] 1 pt — Public RPC Chain ID, namespace blocking, HTTPS and block progression pass.
- [ ] 1 pt — Explorer/RPC height alignment and indexing pass.
- [ ] 1 pt — Backup/restore and monitoring evidence are current.
- [ ] 1 pt — Chain ID registry, network docs, logo and official verification channels are current.

Primary tracker: #115. Public-mainnet status must not be promoted until every mandatory #115 gate is complete.

### 5. Scalability & 1M-user architecture evidence — 12 points
- [ ] 2 pts — Truly isolated staging exists with dedicated non-production AUTH_DB/session configuration and synthetic data only.
- [ ] 2 pts — Staging attestation returns `ready:true` and proves all isolation checks before load generation.
- [ ] 2 pts — Progressive baseline 10x100, 25x500, 50x2000 and 100x10000 passes without regression.
- [ ] 2 pts — Higher controlled concurrency stages are measured with p50/p95/p99, error rate, DB and upstream telemetry.
- [ ] 1 pt — Restore drill/RPO/RTO evidence exists for the application data plane.
- [ ] 1 pt — External dependency degraded modes and rate-limit behavior are tested.
- [ ] 1 pt — Canary/rollback works under synthetic traffic.
- [ ] 1 pt — Final capacity statement clearly distinguishes registered-user architecture from simultaneous concurrency.

Primary trackers: #299 and #301. Never load-test production.

### 6. Mobile release & distribution — 10 points
- [ ] 2 pts — Android signed release artifact is produced from the approved release revision.
- [ ] 2 pts — Google Play listing/review status is independently verified before being called published.
- [ ] 1 pt — Android physical-device acceptance test passes.
- [ ] 2 pts — iOS signed distribution build is produced from the approved revision.
- [ ] 2 pts — App Store listing/review status is independently verified before being called published.
- [ ] 1 pt — iOS physical-device acceptance test passes.

Unsigned/preflight compilation alone does not earn store-publication credit.

### 7. Global network/market discovery — 8 points
- [ ] 2 pts — Canonical EVM network registry metadata remains accepted/current.
- [ ] 1 pt — MetaMask/wallet discovery status is independently verified.
- [ ] 1 pt — Trust Wallet or equivalent wallet discovery status is independently verified.
- [ ] 2 pts — CoinGecko KAM/network status is independently verified before claiming listing.
- [ ] 2 pts — CoinMarketCap KAM/network status is independently verified before claiming listing.

Primary tracker: #305.

### 8. KAM liquidity & transaction-market infrastructure — 8 points
- [ ] 2 pts — Liquidity architecture has reviewed contracts, ownership/multisig, emergency controls and monitoring.
- [ ] 2 pts — Any wrapped/canonical asset used in a pool is provenance-verified; no unofficial asset is presented as canonical USDT/USDC.
- [ ] 2 pts — A real pool can execute buy/sell swaps with archived transaction evidence and measured slippage/depth.
- [ ] 1 pt — Treasury/liquidity policy documents funding, limits, reconciliation and incident controls.
- [ ] 1 pt — Public wording makes no promise of guaranteed buyer, guaranteed volume, price or profit.

Liquidity availability is not the same as guaranteed market demand.

### 9. Corporate, legal & public trust — 6 points
- [ ] 2 pts — Company/legal/founder/product identities are consistently separated and factual across public surfaces.
- [ ] 1 pt — Public legal positioning does not claim exchange/custody/advisory/regulatory permissions without verification.
- [ ] 1 pt — Official contact, office, privacy, terms and verification channels are current.
- [ ] 1 pt — Material regulatory/compliance claims are linked to authoritative evidence.
- [ ] 1 pt — Public incident/status communication process is documented.

### 10. Research, documentation & developer trust — 6 points
- [ ] 2 pts — KAM architecture/readiness research distinguishes design, evidence and final activation state.
- [ ] 1 pt — Developer/network documentation is current and bilingual where appropriate.
- [ ] 1 pt — Canonical metadata and verification-channel documentation are current.
- [ ] 1 pt — Release/evidence artifacts are traceable to exact commit SHAs.
- [ ] 1 pt — Material architecture/readiness claims are reproducible or independently verifiable.

## Hard gates that block a 100/100 declaration

Even if arithmetic would otherwise total 100, the score must remain below 100 while any of the following is unresolved:

1. KAM remains `mainnet-candidate-not-public` because required #115 infrastructure/evidence is incomplete.
2. No independently proven web/auth failover exists.
3. No isolated staging + measured capacity evidence exists for the 1M-user architecture claim.
4. A critical/high production security blocker is open.
5. Public claims state external listings/store publication/liquidity/regulatory approval that cannot be independently verified.
6. A material production release cannot be traced to its tested commit.

## Current baseline interpretation — 2 September 2026

The working review estimate prior to this formal scorecard was approximately **82/100**. That value is a prioritization estimate, not a certification. Current strengths include production web quality gates, security automation, KAM public RPC/explorer operation, canonical Chain ID metadata, research/documentation, corporate/public identity, and increasingly factual UI status semantics.

The largest remaining value gaps are external/provider-side or evidence-side: persistent four-host KAM proof and protected RPC origin, continuity window, application failover, isolated staging/capacity measurement, signed/store mobile distribution, external market/wallet discovery, and real liquidity-market infrastructure.

## Promotion rule

A future 100/100 declaration requires a dated review that:
- links every completed checkbox to current evidence;
- records the exact production/application and KAM revisions tested;
- identifies any assumptions and third-party dependencies;
- confirms no hard gate above is open;
- is repeated after any material architecture, auth, KAM consensus, liquidity, or hosting change.

The objective is not to manufacture a perfect score. The objective is to make the evidence strong enough that the score follows naturally.
# KAM Roadmap

Status: Working roadmap — milestones are gated by technical, security, compliance, and operational readiness. This document is not a promise of listing, price, liquidity, exchange availability, or regulatory approval.

## Phase 1 — KAM Points Foundation

**Objective:** establish a transparent, auditable off-chain participation system before any public token functionality.

- KAM Points ledger per authenticated user.
- Immutable reward history with source, reason, reference ID, metadata, and timestamp.
- Automatic one-time rewards for verifiable account milestones.
- Anti-duplication through deterministic reward references.
- KAM Points displayed separately from crypto asset balances.
- No transfer, withdrawal, trading, redemption, or market-price claim.

**Current reward rules**
- Verified email: 100 KAM Points.
- Completed basic profile: 50 KAM Points.
- Approved KYC: 500 KAM Points.
- Official campaign/community rewards: configurable by authorized admin with audit trail.

**Release gate:** ledger integrity, authentication/session security, D1 persistence, reward abuse testing, and clear user disclosures.

## Phase 2 — Reward & Community Layer

**Objective:** expand participation while preserving traceability and anti-abuse controls.

- Campaign IDs and one-grant-per-user campaign protection.
- Verified referral event model; reward only after referral validity criteria are satisfied.
- Community missions with published eligibility criteria.
- Admin reward dashboard with 2FA-protected controls.
- Reward caps, rate limits, anomaly detection, and abuse review.
- User-visible reward history and campaign terms.

**Release gate:** anti-fraud controls, campaign auditability, privacy review, and operational monitoring.

## Phase 3 — KAM Network Readiness

**Objective:** prepare the technical foundation required before any KAM on-chain distribution.

- Freeze and document final network architecture.
- Define genesis/network parameters and validator/node strategy.
- Establish secure key-management and signing procedures.
- Prepare public RPC, explorer, monitoring, backups, and incident response.
- Define final KAM token economics, supply rules, allocation, vesting, and governance policy.
- Independent security review of network and token-related code.
- Public technical documentation and official verification channels.

**Release gate:** reproducible network build, security review completion, stable public infrastructure, incident-response readiness, and approved final token parameters.

## Phase 4 — Migration Design & Snapshot

**Objective:** create a controlled bridge from eligible KAM Points participation records to any future on-chain distribution model.

- Define eligibility and exclusion rules.
- Publish conversion methodology only after final approval.
- Take a signed, timestamped eligibility snapshot.
- Run duplicate-account, sanctions/compliance, fraud, and integrity checks as applicable.
- Provide user verification and dispute/review process.
- Produce an auditable migration manifest without exposing unnecessary personal data.

**Important:** KAM Points do not automatically guarantee KAM tokens. Any conversion or migration requires separately published final rules.

**Release gate:** finalized distribution policy, verified snapshot integrity, legal/compliance review, and security sign-off.

## Phase 5 — Public Network Launch

**Objective:** launch only when the network is technically and operationally ready.

- Public mainnet genesis and validator activation.
- Official RPC and explorer publication.
- Official contract/token/network identifiers published through verified KriptoAman channels.
- Monitoring, alerting, backups, and status reporting active.
- Controlled initial distribution according to published rules.
- Post-launch security monitoring and incident-response procedures.

**Release gate:** stable mainnet operation and verified public endpoints. No exchange or liquidity claims are made by this milestone alone.

## Phase 6 — Ecosystem & Market Access

**Objective:** expand utility only after core network stability.

- Wallet integrations and verified network metadata.
- Developer documentation, SDK/API support, and ecosystem tooling.
- Utility features based on technically and legally validated use cases.
- DEX/CEX integration considered only through independent listing/integration processes.
- Liquidity programs, if any, disclosed transparently with risks and terms.
- Ongoing security, compliance, governance, and transparency reporting.

## Non-Negotiable Launch Principles

1. **No invented price or guaranteed return.** Market value is not presented before a real market exists.
2. **No fake listing status.** Exchange availability is published only after independently verifiable confirmation.
3. **No hidden migration rule.** Any KAM Points conversion methodology must be published before execution.
4. **No seed phrase/private-key collection.** KriptoAman monitoring and reward flows do not require users to surrender private credentials.
5. **Auditability first.** Reward and migration events must be traceable and protected from duplication.
6. **Security gates before growth.** Public launch follows infrastructure, security, and operational readiness—not a calendar deadline alone.

## Current Position

KriptoAman is in **Phase 1 — KAM Points Foundation**, with the first Reward Engine controls being implemented. Phase advancement should occur only after the preceding release gates are met and documented.

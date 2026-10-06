# Phase 16G — Governance Decision Required for ZVQ Tokenomics v2

Phase 16G has completed the read-only reconciliation available from the repository. Two material economic decisions remain and must not be inferred from legacy files.

## Decision 1 — Initial circulating target

Historical KAM target:

**50,000,000 KAM / 5%**

Proposed ZVQ migration target:

**70,000,000 ZVQ / 7%**

The proposal can become canonical only after explicit approval and supply-accounting evidence.

## Decision 2 — Allocation policy

The repository contains two incompatible historical allocation schedules. Neither is automatically promoted to ZVQ.

A ZVQ Tokenomics v2 decision must select or define one versioned allocation schedule whose categories total exactly 1,000,000,000 ZVQ and whose release/lock rules are documented.

## Preconditions before approval

- Phase 16F long-run stability accepted.
- Production genesis aggregate-supply attestation complete.
- Allocation accounting/wallet evidence complete.
- Vesting and lock evidence complete.
- Reproducible circulating-supply methodology complete.
- No contradiction between supply policy, treasury records, wallet display, explorer metadata and external listing package.

## Template

The machine-readable decision template is:

`chain/zevaryq-mainnet/registry/zvq-tokenomics-v2-governance.template.json`

It intentionally defaults every approval field to `false` or `null`.

Completing the template requires a separate explicit governance decision. Merely merging Phase 16G does not approve tokenomics v2.

## Safety boundary

This governance preparation does not mint, burn, transfer, unlock, lock, deploy, alter genesis, modify balances, or change network consensus.

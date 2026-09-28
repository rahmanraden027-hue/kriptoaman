# ZEVARYQ Asset Layer — Backing Evidence Schema v1

Status: **FORMAT DESIGN / NO BACKING CLAIM**

The contracts consume hashes and numeric ceilings; they do not prove off-chain reserves. This document defines the minimum external evidence package that must exist before an attestation is considered operationally acceptable.

## ZUSD reserve evidence

Each reserve epoch should have a signed evidence package containing:

- asset: `ZUSD`;
- epoch;
- observation timestamp;
- reserve currency/currencies;
- reserve amount in source units;
- normalized reserve amount in 6-decimal USD units;
- custodian/bank identifier that does not expose sensitive account credentials;
- legal account owner/entity;
- statement period or as-of time;
- attestation expiry;
- evidence-document hashes;
- attestor quorum record;
- previous epoch reference;
- incident/exception field;
- public disclosure class (public / auditor-only / confidential reference).

The on-chain `attestationHash` should commit to the canonical evidence manifest.

A reserve attestation is not a substitute for an independent reserve audit or legally enforceable redemption right.

## BTC backing evidence

Each zBTC backing epoch should record:

- asset: `zBTC`;
- source network: Bitcoin mainnet;
- custody model;
- verified locked satoshis;
- custody addresses or auditable custody reference, where disclosure is safe;
- source-chain observation height;
- required confirmation/finality depth;
- evidence hash;
- epoch and expiry;
- attestor quorum record.

Each deposit observation should bind:
- source domain;
- transaction ID;
- output index;
- amount in satoshis;
- recipient on Chain 22028;
- observation/finality height;
- source-proof/evidence hash.

## ETH backing evidence

Each zETH backing epoch should record:

- asset: `zETH`;
- source chain ID;
- custody/bridge contract or auditable custody reference;
- verified locked wei;
- observation/finality block;
- evidence hash;
- epoch and expiry;
- attestor quorum record.

Each deposit event should bind:
- source chain/domain;
- transaction hash;
- log index;
- amount in wei;
- recipient on Chain 22028;
- finalized block reference;
- source-proof/evidence hash.

## Release/redemption evidence

A settlement or source release reference MUST be unique and single-use.

For ZUSD, settlement evidence should prove that the corresponding redemption payout was completed through the documented redemption rail.

For zBTC/zETH, release evidence should bind the exact source-chain release transaction to the previously burned redemption claim.

## Evidence lifecycle

1. Collect source evidence.
2. Canonicalize manifest.
3. Hash manifest.
4. Obtain required quorum/signatures off-chain.
5. Verify freshness/finality.
6. Submit only the approved hash + numeric ceiling to the controller.
7. Archive the evidence package under access controls.
8. Reconcile the next epoch against prior inflows/outflows.

## Hard blockers

Backing cannot be marked proven while any of these are unresolved:
- custodian/bridge identity is unknown;
- account/asset ownership is unverified;
- evidence cannot be independently reconciled;
- attestor quorum is not configured;
- redemption/release path is untested;
- finality policy is undefined;
- evidence is stale or internally inconsistent.

Current state:

`RESERVE_CUSTODY_PROVEN = false`  
`BTC_BRIDGE_BACKING_PROVEN = false`  
`ETH_BRIDGE_BACKING_PROVEN = false`

# Phase 15B — Command Center & Data Contract Implementation

Status: **IMPLEMENTED ON REVIEW BRANCH**

## Objective

Apply the Final Product Architecture v1.0 to visible production data surfaces so users can distinguish current, verified, partial, snapshot, checking, and unavailable information without relying on promotional copy.

## Visible data contract

Every live production panel must expose:

1. **State** — canonical truth-state.
2. **Source** — attributable system/source label.
3. **Timestamp** — source observation/capture time where available.
4. **Freshness** — age derived from the source timestamp/cache metadata.

Canonical truth-state vocabulary remains:

`LIVE / VERIFIED / SYNCED / PARTIAL / SNAPSHOT / UNAVAILABLE / CHECKING`

## Implemented surfaces

- Featured Market Asset
- Market Pulse
- Top Movers
- Live Intelligence
- ZEVARYQ On-Chain Evidence
- ZEVARYQ Network Proof

## Source boundaries

Market provenance is derived from the existing KriptoAman market boundary.

On-chain evidence is derived from the existing first-party ZEVARYQ JSON-RPC intelligence endpoint.

Network proof is derived from the existing verified ZEVARYQ network status endpoint.

No new market values, block heights, contract counts, token metadata, or network status values are generated in the UI.

## Fail-closed behavior

If the source is absent or verification fails:

- state becomes `UNAVAILABLE` or remains `CHECKING`;
- source is explicitly shown as unavailable;
- timestamp is shown as unavailable;
- production metrics are not synthesized.

## Protected boundary

Phase 15B does not change genesis, validator/private keys, balances, transactions, DNS, RPC write policy, wallet signing/broadcasting, token state, or protected network runtime files.

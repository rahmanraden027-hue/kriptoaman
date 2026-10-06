# Phase 16B — Production Data Binding & Live State Mapping

## Objective

Bind the final KriptoAman command-center UI to explicit production truth states so no visual surface can claim LIVE without a verified source, valid identity, and bounded freshness.

## Canonical state vocabulary

- `LIVE` — verified source, valid data contract, and within freshness budget.
- `VERIFIED` — source identity is verified but the surface is not fully live/synced.
- `SYNCED` — ZEVARYQ RPC reports `eth_syncing === false`.
- `INDEXED` — reserved for indexer-backed data that is confirmed indexed.
- `CALCULATED` — derived metric with explicit calculation provenance.
- `DELAYED` — verified data exists but exceeds freshness budget.
- `PARTIAL` — only part of the required evidence is available.
- `SNAPSHOT` — non-live/cached market snapshot.
- `CHECKING` — probe in progress.
- `UNAVAILABLE` — source unavailable, invalid, unverified, or contract mismatch.

## Source map

| Surface | Endpoint/source | Refresh | Freshness | LIVE rule |
| --- | --- | ---: | ---: | --- |
| Market | KriptoAman Market DB | existing market collector cadence | 30 min | first-party market DB + valid assets + fresh cache |
| ZEVARYQ network | `/api/kam/network-status` | 30 sec | 90 sec | HTTP OK + `live=true` + `verified=true` + Chain ID 22028 / 0x560c + valid block + synced |
| ZEVARYQ on-chain evidence | `/api/zvq-token-intelligence` | 15 sec | 45 sec | HTTP OK + status live + Chain ID 22028 + valid head + first-party rpc.kriptoaman.com provenance |

## Fail-closed behavior

- A failed probe clears the live payload for that surface.
- Chain ID mismatch never renders LIVE.
- Missing/invalid block data never renders LIVE.
- Stale verified evidence becomes DELAYED, never LIVE.
- Missing source renders an em dash or UNAVAILABLE; no synthetic metric is inserted.
- ZEVARYQ price, validators, TPS, latency, uptime, and node counts remain absent unless a verified production source exists.

## Implementation

- Adds shared `useZevaryqSurface` so HomeV10 performs one network probe stream and one on-chain evidence probe stream.
- Removes duplicated component-local polling from `ZevaryqLiveStrip` and `OnChainNow`.
- Adds machine-readable refresh/freshness/state attributes for browser acceptance.
- Extends the shared data-state vocabulary with INDEXED, CALCULATED, and DELAYED.
- Market stale first-party data now maps to DELAYED rather than appearing as a generic snapshot.
- Raises low-contrast supporting text to WCAG-friendly slate levels.

## Safety boundary

Read-only UI/data-binding change only. No genesis, validators, private keys, balances, token supply, transactions, wallet signing/broadcasting, RPC write policy, DNS, custody, or chain-state mutation.

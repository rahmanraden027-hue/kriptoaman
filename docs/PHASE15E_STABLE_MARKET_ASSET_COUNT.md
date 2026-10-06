# Phase 15E — Stable Market Asset Count

Status: **IMPLEMENTED ON REVIEW BRANCH**

## Finding

Phase 15D production screenshots proved the command center was live, but the visual audit caught a progressive-hydration artifact:

- mobile proof could render an intermediate loaded-page count;
- desktop proof could render a different intermediate count;
- the market database metadata already exposed the authoritative total immediately on page 0.

The card label **Assets Tracked** describes the production dataset, so it must not represent browser pagination progress.

## Implementation

`useCoinMarkets` now stores the authoritative `totalAssets` returned by `/api/market-snapshot-page?page=0&limit=500`.

The value is:

- bounded by the public UI limit of 5,000 assets;
- persisted with the verified local market cache;
- restored from cache where available;
- replaced by authoritative page-0 metadata as soon as the server responds.

`useMarketSurface` uses that authoritative total for `rawAssetCount` and only falls back to currently loaded coins when no authoritative metadata exists.

## Production proof

Market Pulse exposes `data-assets-tracked` for machine-readable acceptance.

The production browser proof fetches the same first-party page-0 metadata and requires:

`visible Assets Tracked === min(totalAssets, 5000)`

on both 390px mobile and 1440px desktop.

## Boundary

This changes only market presentation metadata and read-only proof logic. It does not change the market database, collectors, snapshot payload, upstream provider logic, ZEVARYQ network, balances, transactions, wallet signing, RPC write policy, or chain state.

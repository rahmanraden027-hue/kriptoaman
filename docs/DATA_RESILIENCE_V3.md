# KriptoAman Data Resilience V3

Status: implementation hardening. This document defines availability behavior; it is not a claim that stale market values remain current.

## Objective

Keep KriptoAman accessible and useful during prolonged upstream market-data outages while preserving data integrity. The application may display the last successfully persisted market observation for up to 365 days when external market providers are unavailable, but it must visibly distinguish old data from live data.

## Market freshness states

- `live`: observation age <= 60 seconds.
- `stale`: observation age > 60 seconds and <= 1 hour.
- `archived`: observation age > 1 hour and <= 365 days.
- `expired`: observation age > 365 days.

`archived` data is an availability fallback only. It must never be described as a current quote, current 24-hour market condition, guaranteed execution price, or live trading signal.

## Current resilience layers

1. Provider failover: CoinLore -> CoinGecko for the persisted 5,000-asset catalog.
2. D1 last-known-good primary market snapshot with no hard expiry on the primary catalog read path.
3. Rolling D1 full-row backup (`global-backup`) copied only from a validated primary snapshot before a refresh replaces `global`.
4. Chunked D1 delivery for bounded public reads, with captured-at consistency checks that reject mixed-generation chunks.
5. Paged market reads automatically fall back from primary chunks/full payload to the rolling full-row backup when the primary read is invalid or incomplete.
6. Cloudflare edge cache and one-day page rescue cache.
7. Browser `localStorage` market snapshot with no hard expiry and explicit stale UI state.
8. `market-hot` emergency availability extended to 365 days and able to recover from either the primary or rolling D1 backup; `healthy` remains false once data is older than the normal one-hour health window.
9. Home Market Movers reads the KriptoAman persisted snapshot rather than calling CoinGecko directly.
10. Bitcoin wallet display pricing now reads KriptoAman-owned durable market endpoints and does not expose a CoinGecko API key in browser code.

## Integrity boundary

Long-lived fallback applies only to informational market observations where an explicit `capturedAt` timestamp is retained.

It does **not** apply to:

- KAM RPC online/offline status,
- validator health,
- block production,
- wallet balances,
- transaction state,
- authentication/session state,
- KYC state,
- order execution or swap quotations.

Those systems must fail closed or report unavailable/degraded when live verification cannot be performed.

## Provider-outage behavior

If all external market providers fail:

1. Existing D1 primary snapshot remains authoritative as the last-known-good observation while valid.
2. If the primary snapshot becomes unreadable or incomplete, eligible market read paths can recover from the rolling D1 backup.
3. Market pages continue serving persisted data and verify that chunk timestamps match the active snapshot generation before using them.
4. `/api/market-hot` returns HTTP 200 while a complete core-asset snapshot is available and <= 365 days old from either durable snapshot.
5. Once older than one hour, `/api/market-hot` returns `healthy: false`, `available: true`, `freshness: archived`, a stale header and an HTTP Warning header.
6. Browser market state continues to retain the last successful snapshot without a hard expiry.

No synthetic prices are generated to hide missing data.

## Remaining hardening work

The primary market catalog, Market Movers, and Bitcoin wallet display price are protected by KriptoAman-owned persisted data paths. Some secondary widgets and historical/chart components still call external providers directly. Their failure is non-fatal today, but they should be progressively migrated behind KriptoAman-owned read endpoints or provided with persisted last-known-good fallbacks.

Priority migration targets include:

- Market Overview global statistics,
- OHLC/history widgets,
- portfolio benchmark history,
- remaining wallet display-price helpers.

The separate web-origin failover plan also remains an infrastructure activation item: provision a second application origin, bind the same production auth database/secrets, place it behind health-checked active-standby routing, then require secondary readiness in monitoring.

These changes must not weaken authentication, RPC truthfulness, stale-data disclosure, or the separation between informational market fallback and live blockchain state.

## Release gate

`tests/data-resilience-v3.test.mjs` simulates a complete provider outage with a 90-day-old persisted market snapshot. `tests/market-chunk-read.test.mjs` additionally verifies the rolling backup, mixed-generation chunk guard, backup recovery paths, and browser API-key removal.

The gates require:

- HTTP 200 availability for a valid persisted market observation,
- `available: true`,
- `healthy: false` for archived data,
- `freshness: archived`,
- stale/Warning headers,
- retained BTC/core-market observations,
- explicit 365-day maximum fallback age,
- rolling backup support before replacing the primary snapshot,
- rejection of mixed-generation chunk pages,
- no direct CoinGecko dependency in Home Market Movers or the Bitcoin wallet display-price helper,
- unchanged service-worker anti-stale API boundary.

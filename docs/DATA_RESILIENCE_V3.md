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
2. D1 last-known-good market snapshot with no hard expiry on the primary catalog read path.
3. Chunked D1 delivery for bounded public reads.
4. Cloudflare edge cache and one-day page rescue cache.
5. Browser `localStorage` market snapshot with no hard expiry and explicit stale UI state.
6. `market-hot` emergency availability extended to 365 days while `healthy` remains false once data is older than the normal one-hour health window.
7. Home Market Movers reads the KriptoAman persisted snapshot rather than calling CoinGecko directly.

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

1. Existing D1 snapshot remains authoritative as the last-known-good observation.
2. Market pages continue serving the persisted snapshot.
3. `/api/market-hot` returns HTTP 200 while a complete core-asset snapshot is available and <= 365 days old.
4. Once older than one hour, `/api/market-hot` returns `healthy: false`, `available: true`, `freshness: archived`, a stale header and an HTTP Warning header.
5. Browser market state continues to retain the last successful snapshot without a hard expiry.

No synthetic prices are generated to hide missing data.

## Remaining hardening work

The primary market catalog and Market Movers are protected by the persisted KriptoAman data path. Some secondary widgets and historical/chart components still call external providers directly. Their failure is non-fatal today, but they should be progressively migrated behind KriptoAman-owned read endpoints or provided with persisted last-known-good fallbacks.

Priority migration targets include:

- Market Overview global statistics,
- OHLC/history widgets,
- portfolio benchmark history,
- selected wallet display-price helpers.

These should be migrated without weakening authentication, RPC truthfulness, or stale-data disclosure.

## Release gate

`tests/data-resilience-v3.test.mjs` simulates a complete provider outage with a 90-day-old persisted market snapshot. The test requires:

- HTTP 200 availability,
- `available: true`,
- `healthy: false`,
- `freshness: archived`,
- stale/Warning headers,
- retained BTC/core-market observations,
- explicit 365-day maximum fallback age,
- no direct CoinGecko dependency in Home Market Movers,
- unchanged service-worker anti-stale API boundary.

# KriptoAman Market Time-Series Policy

Status: Phase 1 storage/query contract. Production ingestion is **not authorized by this document**.

## Purpose

The historical market layer exists to preserve attributable timestamped observations without fabricating candles, volume, continuity, or provider agreement. It is separate from the current customer-facing live-price path until storage population, provider-rights review, and production evidence are complete.

## Storage schema

- Storage schema version: `1`.
- Primary observation identity: provider + provider asset ID + quote currency + interval + candle open time.
- Canonical asset key is stored separately from provider identity so future cross-provider reconciliation does not erase provenance.
- Every observation records retrieval time, ingest run ID, ingest mode, provenance, and optional provider-observed timestamp.
- Volume is nullable. Missing volume is never manufactured from price data.

## Supported Phase 1 query surface

Initial explicit asset map: BTC, ETH, BNB, SOL, XRP, USDT, USDC.

Intervals:

| Interval | Maximum query range | Target technical raw-retention horizon* |
| --- | ---: | ---: |
| 1h | 31 days per request | 90 days |
| 4h | 180 days per request | 730 days |
| 1d | 5 years per request | 5 years |

`*` Retention is a technical ceiling, not a provider-rights claim. Provider licensing/redistribution/caching terms can require a shorter horizon or prohibit persistence. No ingestion should be enabled for a provider until those rights are recorded.

Maximum page size is 500 observations. Default page size is 250.

## Missing intervals

KriptoAman must not interpolate, forward-fill, back-fill, or synthesize a candle merely to make a chart continuous.

The query API returns compressed gap ranges containing:

- gap start time,
- gap end time,
- expected interval count.

A partial data set must remain visibly partial.

## Backfill provenance

Each import/backfill run must retain:

- provider,
- provider asset ID,
- canonical key,
- quote currency,
- interval,
- requested range,
- request/completion timestamps,
- ingest mode,
- provenance description,
- received and persisted record counts,
- failure code/detail when applicable.

Re-running a backfill for the same provider/asset/interval/open-time may update the provider-scoped observation only through an attributable ingest run. Cross-provider observations must never overwrite one another.

## Downsampling

Phase 1 does not manufacture higher-timeframe candles from incomplete lower-timeframe data.

A future downsampling job may derive 4h or 1d candles from stored lower-timeframe records only when every required source interval is present for the aggregation window. Derived rows must use a distinct provenance/ingest mode and must not be represented as provider-native candles.

## Data licensing gate

Before production historical ingestion is enabled for any provider, record whether its terms permit:

1. commercial display,
2. server-side caching,
3. historical retention,
4. derived aggregation/downsampling,
5. redistribution through public or institutional APIs,
6. required attribution.

Until that review is complete, the Phase 1 implementation may be deployed as an empty/read-only schema and query contract, but should not be used to claim historical coverage.

## Customer semantics

Historical data is market information only. It is not an investment signal, valuation, best-execution representation, or guaranteed tradable price. The historical API must never replace the existing customer-facing live price without a separately reviewed migration and evidence gate.

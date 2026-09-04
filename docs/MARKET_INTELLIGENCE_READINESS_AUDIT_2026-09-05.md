# KriptoAman Market Intelligence Readiness Audit — 2026-09-05

## Objective
Build a customer-grade market intelligence foundation that prioritizes trustworthy data, freshness, resilience, transparency, and measurable quality rather than asset-count marketing alone.

## Current strengths observed
- Server-side market snapshot designed for up to 5,000 assets.
- Minimum server acceptance threshold of 4,500 unique assets.
- Provider failover with circuit-breaker state and retry/backoff controls.
- Persisted D1 snapshots with chunked delivery for mobile/browser efficiency.
- Edge cache, stale-while-revalidate, stale-if-error, and rescue-cache behavior.
- Live Binance WebSocket pricing for major assets with stale-feed watchdog.
- Server-controlled hot-market fallback to avoid exposing provider API keys to clients.
- Market UI already exposes source, freshness, cadence, and market-information scope.

## Priority findings

### MI-01 — Stablecoin synthetic-price masking — HIGH data-integrity priority
The browser live-price hook injected USDT and USDC at exactly USD 1.00 when an observed value was unavailable. A market-intelligence product should never silently replace an unavailable stablecoin market observation with a synthetic peg because doing so can hide a depeg event.

**Action in this change:** remove synthetic 1.00 values. Stablecoins must use observed provider/snapshot data or remain unavailable.

### MI-02 — Data-quality score is not independently visible — MEDIUM
Current infrastructure carries freshness/source metadata, but customers and operators do not yet have one machine-readable quality endpoint summarizing freshness, coverage, completeness, and anomaly checks.

**Action in this change:** add `/api/market-quality` with deterministic component metrics. The score is operational data quality, not an investment signal.

### MI-03 — Mixed feed semantics need explicit provenance — MEDIUM
Major assets may use Binance WebSocket values while the broader universe uses KriptoAman snapshots sourced from upstream market providers. This is legitimate, but product and API consumers should be able to distinguish live-major feed data from snapshot-market data.

**Action in this change:** expose feed-source and last-live-update metadata from the live hook.

### MI-04 — Symbol-only deduplication can hide asset identity collisions — MEDIUM architecture risk
The broad market snapshot currently deduplicates by ticker symbol. Distinct assets can share a symbol. This protects the current UI map from collisions but can omit legitimate assets and can make ticker identity ambiguous.

**Phase 2:** design a canonical asset registry keyed by provider/network/contract identity, with ticker as a display attribute rather than the primary identity. Do not migrate production identity semantics without regression evidence.

### MI-05 — Cross-provider consensus is not yet measured — MEDIUM roadmap
Provider failover improves availability but does not prove that independent providers agree on a price.

**Phase 2:** sampled consensus checks for major assets using at least two independent sources, deviation thresholds, anomaly quarantine, and operator alerts. Do not blindly average venues with different market structure.

### MI-06 — Enterprise market-data SLA/SLO needs formalization — MEDIUM commercial readiness
Public resilience controls exist, but enterprise customers need measurable service objectives before contractual SLA numbers are promised.

**Phase 2:** separate SLOs for hot-price freshness, broad-snapshot freshness, API availability, stale-data signaling, incident acknowledgement and recovery.

## Market-intelligence target architecture
1. **Identity layer** — canonical asset ID, network, contract, provider IDs, aliases.
2. **Ingestion layer** — independent provider adapters with rate-limit isolation and circuit breakers.
3. **Normalization layer** — consistent price, market cap, volume, high/low, timestamps and provenance.
4. **Quality layer** — completeness, freshness, anomalies, identity collision checks and cross-source deviation controls.
5. **Persistence layer** — versioned snapshots and historical observations.
6. **Delivery layer** — edge cache, bounded pagination, rescue cache and API versioning.
7. **Intelligence layer** — breadth, momentum, liquidity, volatility, trend and risk indicators with published methodology.
8. **Observability layer** — provider health, latency, stale age, error rates and data-quality score.
9. **Customer layer** — transparent source/freshness, API docs, service status and data-lineage disclosure.

## Immediate implementation in this branch
- Remove synthetic USDT/USDC peg injection.
- Expose live-feed provenance metadata.
- Add server-side market-quality endpoint.
- Add deterministic tests for quality scoring and anti-synthetic stablecoin policy.

## Phase 2 backlog
- Canonical asset registry and symbol-collision migration.
- Cross-provider consensus/deviation monitoring for major assets.
- Exchange-level liquidity/order-book intelligence.
- Historical OHLCV/time-series storage and query API.
- On-chain network metrics and stablecoin flow analytics.
- News/event provenance and sentiment with source citations.
- Institutional API keys, quotas, usage analytics and formal SLO dashboard.
- Data lineage and provider-license review for commercial redistribution.

## Integrity principle
KriptoAman should prefer an explicit `data unavailable` or `stale` state over fabricated precision. Market intelligence earns trust by showing what is known, when it was observed, where it came from, and what quality checks passed.

# KriptoAman Scale + AI Intelligence V2

Status: production-hardening implementation. This document is not a public capacity claim.

## Goal

Prepare KriptoAman for a planning target of up to 1,000,000 registered accounts while keeping the public market path fast, bounded and failure-tolerant. One million registered accounts does not mean one million simultaneous users. Concurrent production capacity must be proven by staged load evidence.

## 1–10 implementation map

1. **Decouple provider refresh from user requests** — the 5,000-asset database remains snapshot-backed. Interactive reads use persisted pages; refresh is background/scheduled and single-flight inside the worker isolate.
2. **Two-tier market data** — `/api/market-hot` provides a small high-frequency major-asset feed while the 5,000-asset catalog remains a slower persisted snapshot.
3. **Multi-layer cache** — hot market and paged market endpoints use Cloudflare Cache API plus explicit public cache headers; browser fallback traffic terminates on KriptoAman instead of calling multiple public providers.
4. **Database read scaling** — the code path now removes repeated D1 reads for cache hits and keeps queries bounded. Cloudflare D1 Read Replication remains an infrastructure activation item and must only be enabled after the production project is connected and Sessions API semantics are reviewed.
5. **Bounded responses** — market pages remain capped at 500 assets; the high-load profile uses 100-asset pages for representative public-read traffic.
6. **Refresh coordination** — full and hot refresh code uses an in-flight single-flight guard. A globally serialized Cloudflare Queue/Durable Object coordinator is an optional next infrastructure step if observed refresh contention requires it; it is not fabricated as active without a configured binding.
7. **Fail-safe fallback** — hot market uses a live provider first and falls back to the persisted KriptoAman market snapshot. Client WebSocket failure falls back to the edge-cached hot endpoint and then existing saved data.
8. **Production SLO evidence** — load profile requires <1% errors, overall p95 <1500 ms, hot-market p95 <750 ms and market-page p95 <1000 ms for the environment under test.
9. **KriptoAman AI Intelligence V2** — AI remains grounded only in verified market data, adds deterministic breadth/average/dispersion metrics, keeps non-advisory language, and caches an identical insight for five minutes per session to reduce repeated model calls.
10. **Staged capacity proof** — existing smoke → 1,000 → 2,500 → 5,000 → 10,000 concurrent-user profiles now include homepage, hot market, paged market, platform status, network health and KAM status. High-load production tests remain explicit opt-in and read-only.

## Data path

```text
Live major-asset provider
        |
        v
/api/market-hot ----> Cloudflare edge cache ----> browser fallback
        |                                      \
        | failure                               +-> AI verified snapshot
        v
persisted market snapshot

Scheduled catalog refresh -> D1 market_snapshots -> /api/market-snapshot-page -> edge cache -> users
```

The browser WebSocket continues to provide immediate live ticks where available. If it is disconnected or stale, clients poll the KriptoAman hot endpoint every 15 seconds rather than directly multiplying fallback calls to external REST providers.

## Failure policy

- A provider outage must not blank the market while a last-known-good snapshot exists.
- AI failure must never stop price or market rendering.
- KAM RPC/explorer is independent from market data and AI.
- No user request triggers a blockchain transaction, wallet signature or financial state change in any load-test path.
- No synthetic market values are inserted to hide missing data.
- Stale data must remain timestamped/observable rather than represented as fresh.

## Capacity evidence gate

Run stages in order and stop on the first failure:

1. smoke
2. 1,000 concurrent virtual users
3. 2,500
4. 5,000
5. 10,000

Record RPS, p50/p95/p99, HTTP error rate, origin CPU/memory, D1 utilization, cache-hit ratio, upstream rate limits/timeouts and queue/backlog metrics if a queue is later enabled.

Do not publish “supports one million users” until retained benchmark evidence and production topology metrics justify that claim.

## Infrastructure activation items

The repository changes are safe to deploy independently. Two scale controls require connected Cloudflare project-level access before activation:

- D1 Read Replication + Sessions API validation.
- Optional Queue/Durable Object global refresh coordinator if measurements show that per-isolate single-flight is insufficient.

These are intentionally not represented as active until they are verifiably configured in the production Cloudflare account.

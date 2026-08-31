# KriptoAman Production Capacity Model

Status: design target only — not a public capacity claim.

## Scope

The initial scale objective is architecture suitable for up to 1,000,000 registered accounts. This does **not** mean 1,000,000 simultaneous users. Production capacity must be demonstrated by repeatable load-test evidence before any public claim is made.

## Planning envelope

| Dimension | Planning assumption | Evidence required before GO |
| --- | ---: | --- |
| Registered accounts | 1,000,000 | database/storage sizing and index review |
| Daily active users | 50,000 (5% planning case) | telemetry after launch; adjust model from real usage |
| Peak concurrent sessions | 5,000 baseline; test to 10,000 | staged load-test artifact |
| Public read traffic | CDN/edge first | cache-hit and origin RPS evidence |
| Auth traffic | rate-limited, stateful only at session/database layer | auth p95, DB connections, error rate |
| Market traffic | snapshot/cache backed, paginated | no synchronous 5,000-asset refresh on user request |
| KAM status traffic | read-only and bounded | RPC/explorer latency and error rate |

## Architecture requirements

1. Static assets and cacheable public content terminate at CDN/edge wherever safe.
2. Application/API handlers remain stateless so horizontal scaling is possible.
3. Database access uses bounded queries, pagination, indexes and connection pooling.
4. Expensive market refresh work is decoupled from interactive user requests.
5. Upstream calls use explicit timeout, bounded retry/backoff and fail-safe fallback behavior.
6. Abuse controls are enforced per IP/user where appropriate without disabling legitimate read traffic.
7. Responses are bounded; no unbounded asset arrays or memory caches are allowed.
8. Critical health endpoints remain read-only.

## Staged evidence gate

Run these stages in order and stop at the first failed stage:

- 1,000 virtual/concurrent users
- 2,500 virtual/concurrent users
- 5,000 virtual/concurrent users
- 10,000 virtual/concurrent users

For each stage record:

- requests/sec
- p50, p95 and p99 latency
- HTTP/network error rate
- CPU and memory at the origin/application tier
- database connection utilization
- cache hit ratio
- upstream timeout/rate-limit events

Baseline acceptance target for the read-heavy test profile:

- error rate < 1%
- no sustained database connection exhaustion
- no memory leak or runaway queue growth
- no cascading outage when a supporting provider is degraded
- critical API p95 target documented and met for the environment under test

## Safety

The repository load-test profile defaults to a small smoke stage. Any high-load run against production requires explicit operator opt-in and a controlled maintenance/observation window. Load tests must never submit blockchain transactions, wallet signatures, KYC submissions, purchases, transfers, or other state-changing financial actions.

## Final capacity wording

Allowed before benchmark evidence:

> Designed with a scale target of up to one million registered accounts; production capacity is being validated through staged performance testing.

Not allowed before benchmark evidence:

> Supports one million users.

A one-million-user support claim requires retained benchmark artifacts plus reviewed infrastructure metrics for the target production topology.

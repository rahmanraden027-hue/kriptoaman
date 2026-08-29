# KriptoAman production readiness for 1M registered users

Status: planning baseline, not a capacity certification.

This document defines the minimum architecture, release, monitoring, recovery, and office-network controls needed before KriptoAman treats one million registered users as a supported production target. It does not change KAM chain state, validator configuration, RPC production configuration, DNS, secrets, wallets, balances, token supply, or external registries.

## 1. Capacity model

One million registered users does not mean one million simultaneous sessions. Capacity must be measured from real traffic, not assumed from registration count.

Initial engineering targets for load testing:

- 1,000,000 registered-user records.
- 100,000 daily active users as an initial planning scenario.
- 10,000 to 30,000 concurrent authenticated sessions for stress testing.
- 5,000 requests/second sustained API test target before raising public capacity assumptions.
- higher short-duration burst tests for login, market refresh, portfolio refresh, and notification spikes.
- WebSocket or persistent market-stream capacity tested separately from ordinary HTTP traffic.

These are test targets, not claims that the current production platform already supports these numbers.

## 2. Availability architecture

The application must avoid single points of failure.

Required production design:

1. Cloudflare or equivalent edge layer for DNS, WAF, CDN, bot controls, TLS, and rate limiting.
2. At least two application origins, with three preferred for high-traffic services.
3. Health-checked load balancing with automatic removal of unhealthy origins.
4. A shared production authentication/data plane; never create independent writable user databases during failover.
5. Managed or replicated database with automated failover, point-in-time recovery, tested backup restore, and read-scaling where supported.
6. Shared cache/rate-limit/session infrastructure where server-side state is required.
7. Queue-based workers for email, notifications, analytics, webhooks, and other non-interactive jobs.
8. Object storage for documents, exports, evidence, logs, and large user-generated files instead of relying on a single application filesystem.
9. A second region or provider as disaster-recovery capacity once primary redundancy is proven.

The existing `docs/ACCESS_FAILOVER.md` remains the authoritative conservative active-standby runbook for web/auth continuity.

## 3. Release strategy: no direct all-user updates

Every production change should follow:

`pull request -> automated tests -> security checks -> staging -> synthetic tests -> canary -> production -> post-deploy smoke -> automatic/manual rollback`

Required controls:

- immutable build artifact or exact commit identification for each deployment;
- staging environment using production-equivalent configuration but non-production data/secrets;
- canary release to a small traffic percentage before full rollout;
- error-rate, latency, login, registration, and critical API thresholds that block expansion;
- one-command or provider-native rollback to the last known-good build;
- database migrations designed for backward compatibility during rolling deployment;
- feature flags for high-risk features so they can be disabled without redeploying the whole application;
- no simultaneous risky application, database, auth, and network changes in one release window.

A recommended canary progression is 1% -> 5% -> 25% -> 50% -> 100%, with automatic hold or rollback if service-level thresholds regress.

## 4. Database readiness

Before a 1M-user capacity claim, verify:

- current database engine and hard platform limits are documented;
- indexes exist for login identity, account lookup, portfolio queries, notifications, audit records, and other high-frequency paths;
- connection concurrency and transaction limits are known;
- slow-query logging is enabled where supported;
- backups are automated and encrypted;
- point-in-time recovery is available or an equivalent recovery method is documented;
- a restore drill has succeeded into an isolated environment;
- write failover behavior is tested;
- data retention and deletion procedures are documented;
- privileged database access uses least privilege and audited credentials.

If the current authentication database remains Cloudflare D1, its current production limits and failover characteristics must be measured against expected writes, reads, storage, and concurrency before treating 1M users as certified capacity.

## 5. Market-data resilience

Market data must not depend on one external provider in the user request path.

Required pattern:

`external providers -> ingestion layer -> normalized cache -> application API -> clients`

Controls:

- at least two independent data sources for critical market information where licensing permits;
- provider-specific rate limiting and retry with exponential backoff;
- circuit breakers so one failing provider does not exhaust application resources;
- cache with explicit freshness timestamps;
- stale-but-safe fallback when upstream data is unavailable, clearly marked with the last update time;
- no fabricated prices when all sources fail;
- background refresh rather than every client independently polling third-party APIs;
- metrics for provider latency, error rate, quota usage, and stale-data age.

## 6. Authentication and account safety

Authentication must remain available and safe under traffic spikes and abuse.

Required controls:

- secure HttpOnly session cookies or an equivalent hardened token model;
- session validation that works across all active origins;
- consistent session-signing secrets across authorized failover origins;
- rate limits for login, registration, OTP, password reset, and account recovery;
- bot/credential-stuffing defenses at the edge and application layer;
- password policy and breached-password checks where practical;
- no authentication or password-reset response caching;
- complete audit logs for security-sensitive account events;
- emergency session invalidation procedure;
- load tests for login and registration that do not send real email or create uncontrolled production data.

## 7. Observability and service-level objectives

A high-scale platform cannot be operated from CPU/RAM graphs alone.

Minimum telemetry:

- request rate and concurrency;
- p50, p95, and p99 latency;
- HTTP 4xx/5xx rates;
- authentication success/failure and readiness;
- database latency, errors, storage, and connection/transaction pressure;
- cache hit rate and eviction rate;
- queue depth, worker lag, retry count, and dead-letter failures;
- external API latency, error rates, quota exhaustion, and stale-data age;
- frontend JavaScript error rate and release version;
- synthetic checks from more than one geographic region;
- security events, WAF blocks, rate-limit events, and abnormal traffic spikes.

Initial public-service objective:

- target 99.95% monthly availability for the main web/auth experience after redundancy is validated;
- define separate SLOs for market data, KYC, email, wallet connectivity, and third-party integrations because upstream providers may have different availability.

Alerting must identify the responsible service and include a runbook link. Alert volume should be tuned so real incidents are not hidden by noise.

## 8. Load and resilience testing gates

No 1M-user claim should be made until repeatable tests exist.

Create non-production tests for:

1. homepage/static asset burst;
2. login readiness and authenticated session validation;
3. registration validation path without real user creation;
4. market list and market-detail reads;
5. portfolio/dashboard reads using synthetic accounts;
6. API rate-limit behavior under abuse;
7. dependency outage: market provider unavailable;
8. one application origin unavailable;
9. cache unavailable or degraded;
10. database latency/failover scenario where supported;
11. deployment during active traffic;
12. rollback during active traffic.

Every test report must record commit SHA, environment, timestamp, test duration, request rate/concurrency, p95/p99 latency, error rate, and bottleneck observed.

## 9. Disaster recovery

Define recovery targets before adding a second region.

Initial engineering goals to validate:

- RTO: documented target for restoring the main application and auth service;
- RPO: documented acceptable data-loss window per datastore;
- encrypted off-site backups;
- quarterly restore exercise at minimum until operational maturity improves;
- infrastructure/configuration inventory sufficient to rebuild from source-controlled definitions;
- DNS/edge failover plan that does not depend on access to one employee laptop or office network;
- emergency contact and credential-recovery process.

Do not call a backup strategy complete until a restore has been successfully tested.

## 10. Office and operations network

The office must support operations but must not be a production dependency.

Recommended office baseline:

- two independent fixed-line ISPs where available;
- business firewall/router with automatic WAN failover;
- separate VLANs for staff, engineering/admin devices, guest Wi-Fi, CCTV/IoT, and lab equipment;
- WPA3/WPA2-Enterprise or centrally managed business Wi-Fi where practical;
- no production databases or primary public servers hosted on office laptops;
- UPS for router/firewall/switch/access points and critical workstations;
- 4G/5G backup connectivity for emergency administration;
- Zero Trust/VPN access to administrative systems with MFA;
- managed endpoint protection, full-disk encryption, screen lock, and device inventory;
- restricted administrator accounts; daily work should use non-admin accounts;
- documented joiner/mover/leaver access process;
- physical visitor control and secure storage for hardware/security keys.

If the office loses power and both ISPs fail, KriptoAman production should continue serving users.

## 11. Security and secrets

Before scaling traffic:

- all production secrets must be stored in provider secret managers or protected CI/CD secret stores, never committed to source;
- rotate secrets with documented ownership and expiry where applicable;
- enforce MFA for GitHub, Cloudflare, cloud providers, email, domain registrar, and app stores;
- apply least-privilege service accounts;
- maintain dependency scanning, CodeQL/static analysis, and production security smoke tests;
- document incident response for account takeover, data exposure, credential leakage, DDoS, and third-party compromise;
- protect admin interfaces with stronger access policy than ordinary user pages;
- retain immutable or tamper-resistant audit evidence for critical administrative actions where feasible.

## 12. Data governance and compliance readiness

For user growth, maintain a current data inventory covering:

- account/profile information;
- authentication and security logs;
- KYC-provider data and what is stored locally versus held by the provider;
- wallet public addresses and derived balances;
- analytics identifiers;
- support communications;
- marketing/email consent;
- device/IP/security metadata;
- retention periods;
- user deletion/export procedures;
- sub-processors and cross-border data flows where applicable.

Public claims must match actual licenses, registrations, product scope, and operational state. High-scale readiness is an engineering capacity goal, not a regulatory approval or investment-performance statement.

## 13. Delivery phases

### Phase A — prove current architecture

- inventory every production dependency and owner;
- document database limits and storage growth;
- activate/verify secondary web/auth origin from `ACCESS_FAILOVER.md`;
- create dashboards for availability, p95/p99 latency, 5xx, auth, database, external APIs, and frontend errors;
- define SLOs and incident severity levels;
- perform first controlled failover and restore exercises.

### Phase B — safe release system

- production-equivalent staging;
- canary deployment;
- automated post-deploy smoke tests;
- automatic rollback threshold;
- backward-compatible migration policy;
- feature-flag framework for high-risk functions.

### Phase C — scale data and async work

- database indexes/capacity validation;
- cache layer where measurements show benefit;
- queue/worker architecture for background work;
- centralized market-data ingestion/cache and multi-provider fallback;
- object storage for large/non-relational files.

### Phase D — certify traffic envelope

- repeatable load-test suite;
- progressive tests through expected peak concurrency;
- record bottlenecks and increase capacity only from measured results;
- chaos/failure tests for origin loss and upstream-provider outage;
- sign-off based on evidence, not estimated server specifications.

### Phase E — disaster recovery and operational maturity

- second-region warm standby where justified;
- tested data restore and regional recovery;
- office/network redundancy completed;
- 24/7 on-call and incident escalation coverage appropriate to actual user volume;
- quarterly capacity and disaster-recovery review.

## 14. Definition of ready for a 1M registered-user target

KriptoAman may internally mark the platform as `1M-user-capacity-ready` only when all of the following are evidenced:

- no single application-origin failure causes public outage;
- shared auth/data dependencies have documented and tested recovery behavior;
- load tests meet the agreed peak envelope with acceptable p95/p99 latency and error rate;
- canary deployment and rollback are tested under traffic;
- production monitoring and actionable alerts are live;
- backup restore has succeeded;
- major external dependencies have degraded-mode behavior;
- security controls and secrets management are validated;
- office/network failure cannot take production offline;
- disaster-recovery targets are documented and tested to the maturity level required by real traffic;
- capacity evidence is reviewed after every material architecture change.

Until those gates are met, the one-million-user number remains a business growth target rather than a verified technical capacity statement.

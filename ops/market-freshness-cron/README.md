# Independent market freshness heartbeat (not deployed)

Status: PREPARED / REVIEW ONLY. GitHub Actions Market Snapshot Warm is not reliable enough as the sole scheduler.

This isolated Cloudflare Worker runs every five minutes without exposing HTTP routes. It calls the existing public market snapshot health-and-refresh endpoint, which already owns the provider circuit breaker, single-flight refresh, D1 chunk storage, and normal provider-rate budget. The Worker fails closed unless at least 4,500 assets, a capture age of at most ten minutes, and complete snapshot chunks are verified. No simulated prices or token balances.

## Approval and rollout

1. Confirm the target Cloudflare account and verify no existing Worker uses this name. Check provider quota and projected invocation/D1 usage.
2. Review the Worker and settings with an authorized Cloudflare operator. Validate the Wrangler configuration and scheduled handler without deploying.
3. After approval, deploy this isolated Cron Worker only. Do not change existing Pages routes, RPC, DNS, validator settings or chain configuration.
4. Inspect actual Cron Trigger executions, failures, and age of market captures. Require 24 hours of timely independent scheduled runs before claiming global readiness. Retain the historical Phase 16F failure.
5. GitHub's existing Market Snapshot Warm workflow remains a secondary watchdog. Monitor both sources.

## Safety and rollback

No genesis, token supply, RPC writes, custody, treasury, keys, validators, chain IDs or liquidity touched. The existing market D1 refresh is intentionally invoked under the already enforced data provider limits. Disable the independent Cron Trigger or roll back only this Worker if provider-rate or cost limits are exceeded.

Test from the repository root: node --test tests/market-freshness-cron.test.mjs

**This repository addition does not deploy or activate anything in Cloudflare.**

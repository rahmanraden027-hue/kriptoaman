# KriptoAman staging load-test baseline

This procedure establishes a repeatable HTTP baseline before higher-scale capacity testing.

## Safety boundary

Run only against a dedicated staging or preview origin that is isolated from production traffic and production write data.

`scripts/load-test-staging.mjs` refuses `kriptoaman.com` and all `*.kriptoaman.com` hostnames, including the production RPC and explorer. The script performs GET requests only to:

- `/`
- `/login`
- `/api/auth/readiness`

It does not exercise registration writes, OTP/email delivery, KYC, wallet operations, trading, KAM RPC/explorer, admin endpoints, or other state-changing operations.

## First baseline

```bash
LOAD_TEST_TARGET=https://YOUR-STAGING-OR-PREVIEW-ORIGIN \
LOAD_TEST_CONCURRENCY=10 \
LOAD_TEST_REQUESTS=100 \
node scripts/load-test-staging.mjs
```

Record the JSON output with the staging revision, timestamp, region, and staging topology.

## Controlled progression

Do not jump directly to thousands of virtual users. Establish a clean baseline first and increase load only when the previous stage has no request failures and infrastructure metrics remain healthy.

Suggested initial sequence:

1. 10 concurrent / 100 requests
2. 25 concurrent / 500 requests
3. 50 concurrent / 2,000 requests
4. 100 concurrent / 10,000 requests

The built-in script caps concurrency at 100 and total requests at 10,000. Higher-scale testing requires a dedicated load-testing environment/tool and an approved capacity-test plan; do not remove these caps merely to create a larger number.

## Measurements

The script reports:

- success and error rate
- aggregate requests per second
- p50, p95, p99 and maximum latency
- failure counts by HTTP status/error

At the same time, staging infrastructure should record CPU, memory, database connections, database latency, cache hit rate, queue depth, upstream/provider latency, HTTP 5xx, and edge/origin errors where applicable.

## Interpretation

A baseline is not evidence of one-million-user capacity. It is only the first measured point in the capacity model. Bottlenecks should be corrected at the relevant dependency rather than hidden by increasing client concurrency.

Do not establish latency release gates until repeated staging measurements provide a realistic baseline. Any request failure in this conservative script currently fails the run.

## Production rule

Never run this script against production. Production availability is verified by the existing low-rate smoke/readiness monitoring, not by load generation.

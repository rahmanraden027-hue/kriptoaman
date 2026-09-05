# KriptoAman Blockscout Recovery Runbook

Use this when `https://explorer.kriptoaman.com` loads but the homepage shows an error banner, latest blocks/transactions are missing, or indexed data appears stale.

## Safety boundary

This runbook is diagnostic-first and read-only until an operator intentionally performs a service restart. Do not change validator keys/set, genesis, Chain ID, treasury, balances, token supply, wallet state, DNS, or secrets. Do not delete PostgreSQL volumes, truncate Blockscout tables, or force a full reindex without verified backup evidence.

## 1. Verify public RPC and explorer

Run:

```bash
node scripts/diagnose-blockscout.mjs
```

Healthy core evidence requires:
- `eth_chainId` = `0x560c`
- `eth_blockNumber` returns a valid block height
- known transaction receipt is retrievable
- Blockscout `/api/v2/blocks` returns indexed blocks
- Blockscout height is within 5 blocks of the RPC head

The diagnostic also probes the Blockscout stats and chart endpoints so a presentation-only chart failure can be separated from a chain/indexer failure.

## 2. Classify before changing anything

- `rpc_unhealthy_or_wrong_chain`: repair protected RPC/sentry path first.
- `blockscout_backend_or_api_unhealthy`: inspect Blockscout backend/API and database connectivity.
- `blockscout_indexer_not_populating_blocks`: inspect indexer RPC configuration and logs.
- `blockscout_indexer_lagging`: inspect indexer throughput, RPC latency, database load and restart loops.
- `blockscout_stats_chart_api_unhealthy`: core RPC, blocks and indexer are healthy, but one or more optional homepage chart endpoints are unhealthy. Do not restart validators or alter chain state for this condition.
- `healthy`: no recovery action required.

## 3. Explorer host checks

On the Blockscout host, inspect running services and non-secret configuration only:

```bash
docker compose ps
docker compose ps --services
docker compose logs --tail=200 backend 2>&1 || true
docker compose logs --tail=200 indexer 2>&1 || true
docker compose logs --tail=100 db 2>&1 || true
```

Look for RPC timeout/refused/TLS errors, wrong chain identity, PostgreSQL failures, migration failures, JSON-RPC errors, or crash loops.

Do not print or paste `DATABASE_URL`, private keys, tokens, passwords, or secret values.

## 4. Chart-only presentation fallback

If the diagnostic returns `blockscout_stats_chart_api_unhealthy` while RPC identity, block progression, known transaction receipt, `/api/v2/blocks`, and height alignment are healthy, keep the backend/indexer/database running.

The optional homepage charts may be disabled until the chart API is repaired:

```bash
NEXT_PUBLIC_HOMEPAGE_CHARTS=[]
```

The repository helper `scripts/apply-kam-explorer-branding.sh` now applies this fail-open presentation setting before recreating only the Blockscout frontend and proxy. This does not fabricate chart values and does not change any on-chain state. Re-enable specific charts only after their required stats endpoints are independently verified healthy.

## 5. Safe backend/indexer restart gate

Only when RPC identity, database connectivity, and Blockscout environment are confirmed correct, and the classification indicates a backend/indexer problem rather than a chart-only problem, a stopped or stale Blockscout application/indexer service may be restarted:

```bash
docker compose restart backend 2>/dev/null || true
docker compose restart indexer 2>/dev/null || true
```

Use the actual service names shown by `docker compose ps --services`. Avoid restarting PostgreSQL unless the database itself is unhealthy.

Then re-run:

```bash
node scripts/diagnose-blockscout.mjs
```

## 6. Definition of recovered

Core explorer recovery is complete only when RPC chain ID and block height are valid, block height advances, Blockscout returns indexed blocks, explorer height tracks RPC within tolerance, and the known transaction receipt remains available across repeated checks.

Presentation recovery additionally requires the public homepage to render without the generic error banner. Optional charts should stay disabled until their underlying stats/chart APIs are verified healthy; hiding a broken optional chart is acceptable, but replacing it with fabricated market or transaction data is not.

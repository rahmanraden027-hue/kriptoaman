# KriptoAman Blockscout Recovery Runbook

Use this when `https://explorer.kriptoaman.com` loads but shows no latest blocks/transactions.

## 1. Confirm chain health first

Run from any trusted Linux host with outbound HTTPS:

```bash
node chain/kam-mainnet/scripts/diagnose-blockscout.mjs
```

Expected healthy RPC identity:

- `eth_chainId` = `0x560c`
- `eth_blockNumber` returns a valid advancing block height

If the diagnostic classifies the problem as `rpc_unhealthy_or_wrong_chain`, do not restart/reindex Blockscout first. Repair the protected KAM RPC/sentry origin or its Cloudflare path.

## 2. Verify Blockscout environment on the explorer host

Do not print secrets. Inspect only the non-secret values actually consumed by the running Blockscout backend/indexer:

```bash
cd /path/to/blockscout

docker compose config | grep -E 'ETHEREUM_JSONRPC|CHAIN_ID|NETWORK|SUBNETWORK|COIN|DATABASE_URL|REDIS' | sed -E 's#(DATABASE_URL|SECRET_KEY_BASE)=.*#\1=[REDACTED]#'
```

The Blockscout backend/indexer must use the KAM production RPC/sentry path for Chain ID 22028. Do not point it at localhost, a phone/Termux node, or a validator admin endpoint.

## 3. Check containers and logs

```bash
docker compose ps

docker compose logs --tail=200 backend 2>&1 || true
docker compose logs --tail=200 indexer 2>&1 || true
docker compose logs --tail=100 db 2>&1 || true
```

Look for:

- RPC connection refused / timeout / TLS errors
- wrong chain ID / genesis mismatch
- PostgreSQL connection or migration failures
- repeated JSON-RPC method failures
- indexer crash/restart loops

Container names vary by Blockscout release. Use `docker compose ps --services` if `backend`, `indexer`, or `db` are named differently.

## 4. Test RPC from inside the Blockscout network

From a container with curl available, or a temporary curl container attached to the same Docker network, POST:

```json
{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}
```

and:

```json
{"jsonrpc":"2.0","id":2,"method":"eth_blockNumber","params":[]}
```

The results must match the public KAM network (`0x560c`) and an advancing block height.

## 5. Safe restart before any destructive action

If RPC, database, and environment are correct but the indexer is stopped or stale:

```bash
docker compose restart backend 2>/dev/null || true
docker compose restart indexer 2>/dev/null || true
```

If the deployment uses a combined backend/indexer service, restart that service only. Avoid restarting PostgreSQL unless the database itself is unhealthy.

Then watch logs:

```bash
docker compose logs -f --tail=100
```

## 6. Re-check public explorer

```bash
node chain/kam-mainnet/scripts/diagnose-blockscout.mjs
```

A recovered explorer should classify as `healthy`, with the explorer height within 5 blocks of the RPC head.

## 7. Database/reindex caution

Do **not** delete PostgreSQL volumes, truncate Blockscout tables, or run a full reindex merely because the homepage says `No data`. Those actions are destructive and can erase indexed history. Only perform a database reset after a verified backup and after confirming the database/index is irreparably inconsistent.

## 8. Production acceptance gate

Do not mark explorer recovery complete until all are true:

- public RPC reports Chain ID `0x560c`;
- RPC blocks advance;
- Blockscout `/api/v2/blocks` returns indexed blocks;
- explorer height tracks RPC head within the configured tolerance;
- latest transactions populate when the chain has transactions;
- privileged RPC namespaces remain blocked at the public edge;
- `verify-public-endpoints.mjs` passes.

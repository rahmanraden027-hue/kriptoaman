# KAM Public RPC Gateway Deployment

Status: **MAINNET CANDIDATE / NOT YET PUBLIC**

This document deploys only the public RPC edge gateway. It does not activate the KAM mainnet by itself.

## Prerequisites

- A protected RPC origin or sentry node that is not directly exposed to the public internet.
- Cloudflare account access for the `kriptoaman.com` zone.
- Wrangler authenticated to the correct Cloudflare account.
- The protected origin must return Chain ID `0x560c`.

## Required secret

From this directory, configure the RPC origin as a Worker secret:

```bash
npx wrangler secret put KAM_RPC_ORIGIN
```

Enter the protected HTTPS origin URL when prompted. Do not commit this value to GitHub and do not use a public validator/admin endpoint as the origin.

## Deploy

```bash
npx wrangler deploy
```

The Worker route is configured for:

`rpc.kriptoaman.com/*`

The deployment must remain labeled `mainnet-candidate-not-public` until every activation gate in `../PUBLIC_ACTIVATION.md` passes.

## Post-deploy verification

Run from the repository root:

```bash
node chain/kam-mainnet/scripts/verify-public-endpoints.mjs
```

Expected conditions:

- `eth_chainId` = `0x560c`
- block height advances
- `admin_peers` is rejected at the public gateway
- explorer endpoint is reachable

## Origin hardening

- Prefer a sentry/read RPC node rather than a validator.
- Restrict origin ingress to trusted Cloudflare/Tunnel paths where practical.
- Keep admin, QBFT, personal, debug, tracing, wallet/private-key and node-management APIs disabled on the public path.
- Apply host firewall rules and rate limits at both the origin and edge.
- Never store validator keys, treasury keys or keystores in Worker secrets.

## Rollback

If the gateway returns the wrong Chain ID, exposes a forbidden method, or the upstream is unstable, remove/disable the public route and keep network status as `mainnet-candidate-not-public`.

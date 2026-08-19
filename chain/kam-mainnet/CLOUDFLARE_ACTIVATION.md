# KAM Mainnet — Cloudflare RPC Activation

Status remains **MAINNET CANDIDATE / NOT YET PUBLIC** until every production gate in Issue #115 passes.

## Preconditions

- A protected production RPC sentry/origin exists and is not a publicly exposed validator admin interface.
- Wrangler is authenticated to the Cloudflare account that owns `kriptoaman.com`.
- The Worker secret `KAM_RPC_ORIGIN` points to the protected RPC origin.
- `rpc.kriptoaman.com` is configured as the Worker custom domain by `wrangler.jsonc`.
- Four production validators and the explorer remain separate activation gates.

## Guarded activation helper

From the repository root run:

```bash
bash chain/kam-mainnet/scripts/activate-cloudflare-rpc.sh
```

The helper intentionally refuses deployment when:

- Wrangler authentication is unavailable,
- `KAM_RPC_ORIGIN` is missing,
- the network profile has already been changed away from `mainnet-candidate-not-public`.

If those guards pass, it deploys the Worker, checks the public health endpoint and runs `verify-public-endpoints.mjs`.

## Secret setup

Do not commit the RPC origin URL to Git. Configure it interactively from `chain/kam-mainnet/public-rpc-gateway`:

```bash
npx wrangler secret put KAM_RPC_ORIGIN
```

The value should be the HTTPS URL of the protected RPC sentry/origin. Do not use a validator admin interface that is reachable from the public Internet.

## Promotion remains separate

A successful Worker deployment does **not** promote KAM Mainnet. Public-mainnet promotion still requires the full Issue #115 evidence set, including 4 validators, correct Chain ID `0x560c`, explorer indexing, 24-hour continuity, backup/restore, monitoring and final Chain ID collision verification.

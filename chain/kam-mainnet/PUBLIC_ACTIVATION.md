# KriptoAman Mainnet — Public Activation Runbook

Current status: **MAINNET CANDIDATE / NOT YET PUBLIC**

This runbook defines the evidence required before KriptoAman Mainnet may be described publicly as an active production network or submitted as a live chain to third-party directories.

## Target public endpoints

- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`
- Expected Chain ID: `22028` / `0x560c`
- Native currency: `KAM`
- Decimals: `18`

## Required infrastructure evidence

1. Four production validators run on persistent Linux hosts using unique production keys.
2. Validator RPC/admin ports are not directly exposed to the public internet.
3. A dedicated RPC origin or sentry node is used behind the public gateway.
4. Public RPC is HTTPS-only, rate limited, request-size limited and method allowlisted.
5. `eth_chainId` returns exactly `0x560c`.
6. `eth_blockNumber` advances continuously and the chain remains stable for at least 24 hours.
7. QBFT validator set reports the expected four validators through private operational tooling.
8. Explorer indexes the same chain and displays current blocks and transactions.
9. Backup and restore procedures are tested.
10. External uptime/latency monitoring is enabled for RPC and explorer.
11. Chain ID 22028 is re-checked against the public EVM chain registry immediately before publication.

## Public RPC policy

The Cloudflare gateway configuration under `public-rpc-gateway/` intentionally exposes a restricted read-oriented JSON-RPC method set. Administrative, QBFT, personal, debug and node-management methods are blocked at the public edge.

`KAM_RPC_ORIGIN` must be configured as a protected origin endpoint. Do not point the Worker directly at a validator interface reachable from the public internet.

## Automated verification

Run:

```bash
node chain/kam-mainnet/scripts/verify-public-endpoints.mjs
```

The verifier checks:

- public RPC responds,
- Chain ID equals `0x560c`,
- block height advances,
- an administrative method is rejected,
- explorer returns a successful HTTP response.

A passing script is necessary but not sufficient for public activation; the full infrastructure evidence above must also be complete.

## DNS / Cloudflare publication

Only after the protected origins exist:

- Route `rpc.kriptoaman.com` to the RPC gateway Worker.
- Route `explorer.kriptoaman.com` to the production explorer origin through Cloudflare HTTPS protection.
- Keep origin addresses private where practical and restrict direct origin access.

Do not create placeholder DNS records that resolve to validators or development devices.

## Status transition

The file `network-profile.json` must remain:

```json
"status": "mainnet-candidate-not-public"
```

until all activation gates are verified.

Only after verification may a separate reviewed commit change the status to a public-mainnet value and enable public directory/listing submissions.

## CoinGecko readiness gate

Do not submit KriptoAman Network as an active chain until:

- RPC is publicly reachable and returns the correct chain,
- explorer is publicly reachable and indexing correctly,
- network documentation is published,
- chain identity and logo assets are final,
- chain registry/ChainList metadata is prepared where applicable,
- public verification channels are active.

This runbook does not authorize a token sale, exchange listing, custody, staking, investment promotion, or a claim of market value.

# KriptoAman Mainnet DNS & Origin Plan

Current status: **MAINNET CANDIDATE / NOT YET PUBLIC**

## Public names

- `rpc.kriptoaman.com` → Cloudflare Worker `kam-mainnet-public-rpc`
- `explorer.kriptoaman.com` → production explorer service behind Cloudflare HTTPS protection

## RPC publication rule

The public RPC hostname must terminate at the edge gateway. It must not resolve directly to a validator RPC port.

The Worker uses a protected `KAM_RPC_ORIGIN` secret. Recommended origin patterns are:

1. Cloudflare Tunnel to a private sentry/read RPC node, or
2. HTTPS reverse proxy on a dedicated RPC/sentry host with firewall restrictions.

Do not use localhost, Termux, a development laptop/phone, or a validator admin interface as the production origin.

## Explorer publication rule

`explorer.kriptoaman.com` must point to a production explorer instance that indexes Chain ID 22028 and current blocks from the same network served by the public RPC.

Before publication verify:

- explorer reports current blocks,
- chain identity is KriptoAman Mainnet / KAM,
- indexed block height tracks the RPC height,
- HTTPS certificate is valid,
- no testnet labels or development data remain.

## Cloudflare checks

Before enabling public traffic:

- HTTPS only
- origin IP not unnecessarily exposed
- WAF/rate limiting appropriate for RPC/explorer
- request body limits compatible with RPC policy
- DNS records contain no validator private addresses or development endpoints

## Activation evidence

Do not change `network-profile.json` from `mainnet-candidate-not-public` until all of the following are recorded:

- protected origin reachable by gateway
- RPC Chain ID `0x560c`
- blocks progressing continuously
- four production validators confirmed privately
- explorer indexing correctly
- 24-hour stability observation complete
- backup/restore test complete
- monitoring active
- Chain ID collision re-check complete

After all gates pass, make a separate reviewed status-transition commit. CoinGecko/ChainList submissions should reference only the verified public endpoints.

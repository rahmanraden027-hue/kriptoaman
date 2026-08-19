# KAM Mainnet — Firewall and Origin Policy

Status: candidate deployment policy.

## Validators

Public inbound access must be minimized. Validator JSON-RPC, QBFT/admin, debug and account-management interfaces must not be Internet-facing.

Allow only:
- required peer-to-peer traffic between the approved validator/sentry topology;
- administrative SSH from a controlled management network or bastion;
- monitoring traffic from approved monitoring hosts.

Deny public access to JSON-RPC/admin interfaces by default.

## RPC sentry/origin

The public gateway must reach a dedicated RPC/sentry origin, not an Internet-exposed validator RPC endpoint.

Preferred origin pattern:

`Cloudflare Worker -> protected Cloudflare connectivity -> RPC sentry -> validator network`

Cloudflare Tunnel is suitable for publishing an internal HTTP service through outbound-only connectivity without opening inbound ports on the origin host. The Worker/origin integration must be tested before public activation.

## Public RPC edge

The Worker already maintains an explicit JSON-RPC allowlist. Administrative, QBFT, personal and debug methods must remain absent from that list.

Required edge controls:
- HTTPS only;
- method allowlist;
- body-size limit;
- batch-size limit;
- rate limiting/WAF as operationally appropriate;
- no cache for JSON-RPC responses;
- CORS support required by supported wallets/browser clients;
- external uptime and latency monitoring.

## Explorer origin

Blockscout should consume a protected RPC interface. Public users should access only `https://explorer.kriptoaman.com` through the front proxy/Cloudflare path. Database and Redis ports must not be public.

## Promotion evidence

Before public-mainnet promotion, record evidence that:
- validator/admin RPC ports are not publicly reachable;
- RPC edge blocks a known privileged method;
- `eth_chainId` returns `0x560c`;
- blocks advance;
- explorer indexes the same chain;
- origin bypass is not available from the public Internet.

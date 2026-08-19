# KriptoAman Mainnet — Final Infrastructure Deployment Package

Status: **EXTERNAL ACTIVATION REQUIRED / NOT YET PUBLIC**

This package is the final operator handoff for activating the KriptoAman Mainnet candidate. It does not change the network to public-mainnet by itself.

## Target topology

1. Validator-1 .. Validator-4: private production nodes with unique production keys.
2. RPC sentry/origin: dedicated non-validator RPC node or protected RPC interface reachable only from trusted infrastructure.
3. Cloudflare Worker custom domain: `rpc.kriptoaman.com`.
4. Explorer: Blockscout-compatible deployment at `explorer.kriptoaman.com` using the same chain.
5. Monitoring: external RPC + explorer uptime and latency checks.

## Required host separation

- Do not publish validator JSON-RPC directly.
- Do not expose QBFT/admin/debug/personal APIs publicly.
- Keep validator keys and treasury keys off repository and out of public environment variables.
- Use a dedicated RPC/sentry origin for public read traffic.
- Use outbound-only Cloudflare Tunnel where possible for the origin path.

## Network identity

- Network: KriptoAman Mainnet Candidate
- Chain ID: `22028` / `0x560c`
- Native currency: KAM
- Decimals: 18
- Consensus target: QBFT
- Validators target: 4
- Block period target: 3 seconds

## External activation sequence

1. Provision four persistent Linux validator hosts.
2. Generate unique production validator keys on the hosts.
3. Generate the production treasury key offline.
4. Produce and independently review final genesis/configuration.
5. Start all four validators and confirm the private validator set.
6. Start dedicated RPC/sentry origin and bind RPC only to the protected interface.
7. Connect the RPC origin to Cloudflare through the approved private path.
8. Deploy `public-rpc-gateway/` Worker with Custom Domain `rpc.kriptoaman.com`.
9. Deploy the explorer against the same RPC chain.
10. Publish `explorer.kriptoaman.com` behind Cloudflare HTTPS.
11. Run `node chain/kam-mainnet/scripts/verify-public-endpoints.mjs`.
12. Confirm `eth_chainId == 0x560c` and block progression.
13. Confirm public `admin_*`, QBFT, debug and personal APIs are blocked.
14. Confirm Blockscout indexes current blocks from Chain ID 22028.
15. Run continuous stability monitoring for at least 24 hours.
16. Re-check Chain ID 22028 against the public EVM chain registry.
17. Test backup/restore and incident response.
18. Only then change `network-profile.json` from candidate to public-mainnet in a separate reviewed commit.

## Cloudflare routing decision

The public RPC Worker is configured as a **Custom Domain** because the Worker is the public origin for `rpc.kriptoaman.com`. Current Cloudflare documentation states that Custom Domains create the required DNS record and certificate for the Worker hostname automatically. The Worker may then fetch its protected RPC dependency separately.

For the protected RPC origin itself, Cloudflare Tunnel is preferred when feasible because it uses outbound-only connections and does not require exposing the origin service on a public IP.

## Explorer deployment

Blockscout requires a running Ethereum-compatible JSON-RPC client. For production, provide:

- `CHAIN_ID=22028`
- RPC HTTP URL pointing to the protected KAM RPC/sentry origin
- RPC WS URL only if required by the selected deployment profile
- PostgreSQL with persistent storage and backups
- Redis and Blockscout microservices as appropriate
- public proxy/hostname `explorer.kriptoaman.com`
- HTTPS and monitoring

Use the official Blockscout Docker Compose or another supported deployment method. Do not hard-code database passwords or secret keys in Git.

## Public-mainnet promotion gate

Promotion is allowed only when ALL are true:

- four production validators confirmed;
- chain ID verified externally as `0x560c`;
- blocks advance continuously;
- 24-hour stability window passes;
- RPC hostname resolves and serves valid JSON-RPC;
- explorer hostname resolves and indexes the same chain;
- privileged RPC methods are blocked at the public edge;
- backup/restore test passes;
- external monitoring is active;
- Chain ID collision check passes immediately before publication.

Until then, every external description must use **KAM Mainnet Candidate**.

## Listing readiness

CoinGecko/ChainList submissions remain blocked until the public-mainnet promotion gate passes. This package does not authorize a token sale, exchange listing, custody, staking, redemption, guaranteed market value, or any claim of regulatory approval.

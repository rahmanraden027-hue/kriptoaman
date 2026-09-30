# ZEVARYQ Hybrid Node Mining — guarded implementation specification

Status: DESIGN / NOT DEPLOYED. Chain ID: 22028 (0x560c).

## Scope
Add a read-only Node Mining dashboard to ZEVARYQ Wallet. Mobile app monitors server-hosted community/validator nodes; it does not mine blocks or store validator keys. All live values must come from verified node telemetry, RPC and Blockscout. No placeholder statistics, rewards, uptime, satellite links or transaction counts presented as real.

## Components
1. Wallet UI: Node Mining route, node enrollment, explicit connect/disconnect, uptime, sync, last indexed block, and rewards with independent verified/pending/unsupported states.
2. Node management API: authenticated node enrollment, challenge-response proof of node control, authorization and rate limits. Separate admin interface.
3. Telemetry: signed node heartbeat, peer status, RPC height and Blockscout indexed height, source timestamps, stale-data alert, chain ID check, bounded retries.
4. Rewards: disabled by default until consensus, tokenomics, contract security and treasury authorization pass. No guaranteed yield.
5. Satellite telemetry: only display verified source data, otherwise NOT CONNECTED.
6. Shared registry: ZVQ native; zUSD/zBTC/zETH planned; zUSDT proposed pending issuer/bridge provenance, backing and legal review.

## API contract (read-only)
GET /api/zvq/nodes/health -> {status,chainId,rpcHeight,indexedHeight,indexerLag,checkedAt,sources}
GET /api/zvq/nodes -> authenticated user's registered node summaries
GET /api/zvq/nodes/:id -> authenticated owner node telemetry
GET /api/zvq/nodes/:id/rewards -> {status:'disabled'|'pending'|'verified',amount,source,checkedAt}
Never expose validator private keys, RPC admin methods or unrestricted origin endpoints.

## Release gates
1. Verify consensus client and validator enrollment rules without changing genesis or validator set.
2. RPC chain ID == 0x560c, height advances in two spaced reads, and Blockscout indexer lag is measured.
3. Wallet address/balance reads succeed on real device; receive/send previews do not submit.
4. Threat model, key isolation, authz, rate limits and telemetry forgery tests pass.
5. Asset registry and three mandatory logo assets zUSD/zBTC/zUSDT are reviewed.
6. Reward mechanism and tokenomics independently audited before activation.
7. Manual treasury approval is required to unlock liquidity, even after all other gates pass.

## Safety / rollback
No DNS, genesis, validator, private key, balance, token mint, transfers or liquidity unlock changes. Feature flag NODE_MINING_ENABLED defaults false. If telemetry is unavailable show UNKNOWN/OFFLINE, never invented values. Retain backups and recovery infrastructure; do not delete recovery resources.

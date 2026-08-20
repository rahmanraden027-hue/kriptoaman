# KAM Mainnet Activation Status — 2026-08-21

## Current technical result

**STATUS: PUBLIC RPC/EXPLORER VERIFIED — MAINNET CANDIDATE**

The public endpoint gate is now passing. This supersedes the DNS-unresolved observation recorded in `ACTIVATION_STATUS_2026-08-20.md`.

Latest archived evidence from GitHub Actions:

- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`
- Chain ID: `0x560c` / 22028
- Block production: advancing during the external probe
- Public admin method: disabled by the gateway
- Endpoint evidence result: `ready: true`

## Security hardening in this update

The public verifier now probes all sensitive namespaces that must not be available through the public gateway:

- `admin_*`
- `debug_*`
- `personal_*`
- `qbft_*`

The evidence records HTTP status, JSON-RPC error code/message, and latency for each probe. Any exposed result or ambiguous successful response fails the gate.

## Status boundary

`network-profile.json` remains `mainnet-candidate-not-public`.

Passing public RPC and explorer checks is necessary but not sufficient for final public-mainnet promotion. Commercial launch remains disabled, no market price is published, and this status does not authorize token sale, custody, exchange, staking, bridge, redemption, or investment-return claims.

## Remaining promotion evidence

1. Confirm the private QBFT validator set contains exactly four unique production validators.
2. Retain at least 24 consecutive hours of passing scheduled endpoint artifacts.
3. Complete and record a backup/restore test.
4. Confirm external uptime and latency monitoring is operational.
5. Re-check Chain ID 22028 against the public EVM chain registry immediately before publication.
6. Review final network metadata and official verification channels.

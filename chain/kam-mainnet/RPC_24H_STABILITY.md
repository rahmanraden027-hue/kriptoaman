# KAM RPC 24-Hour Stability Evidence

## Purpose

The hourly `KAM Mainnet Promotion Gate` records independent public evidence for RPC, block progression, sensitive-method blocking, explorer availability, and response latency.

## Required observation window

Final promotion requires at least 24 consecutive scheduled runs with:

- `ready: true`
- Chain ID exactly `0x560c`
- advancing block height
- all `admin_*`, `debug_*`, `personal_*`, and `qbft_*` probes blocked
- explorer HTTPS available
- no unexplained monitoring gap

Each workflow artifact is retained for 30 days under the name `kam-mainnet-public-readiness`.

## Promotion rule

A single passing run proves current endpoint readiness. It does not prove 24-hour stability. Public-mainnet status must remain unchanged until 24 consecutive hourly artifacts and the remaining Issue #115 infrastructure evidence have been reviewed.

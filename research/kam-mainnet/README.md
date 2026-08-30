# KAM Mainnet Research Evidence Protocol

This directory contains a read-only measurement protocol for the KAM Mainnet research manuscript.

## Scope

The collector reads only public endpoints:

- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`

It does not use private keys, validator administration, SSH, DNS changes, secrets, transaction signing, or state-changing RPC methods.

## Per-sample measurements

Each scheduled run records:

- `eth_chainId` and whether it equals 22028
- `eth_blockNumber`
- `eth_syncing`
- `net_peerCount` when publicly exposed
- RPC HTTP status and latency per method
- Explorer head block and latency
- Absolute RPC-to-explorer block delta
- A conservative explorer consistency indicator (delta <= 5 blocks)
- Timestamp and sample-health flag

## 72-hour research window

The GitHub Actions workflow runs once per hour. A 72-hour observation window therefore produces approximately 72 independent timestamped artifacts, subject to GitHub Actions scheduling delays or outages. Each artifact is retained for 30 days.

The per-run `summary.json` is intentionally limited to the sample(s) produced in that run. The manuscript-level 24-72h statistics must be calculated only after downloading and combining all artifacts from the selected fixed observation window. This prevents accidental treatment of one observation as a longitudinal result.

## Intended manuscript metrics

After the fixed observation window, combine the timestamped samples and calculate:

- sample availability percentage
- chain ID consistency
- RPC latency median, p95, and maximum
- explorer latency median, p95, and maximum
- block progression across the window
- explorer-to-RPC consistency percentage
- timestamped failures and recovery observations

Transaction/receipt retrieval is deliberately not guessed. It should be added only after selecting a fixed, public, reproducible transaction sample set.

## Research-claim boundary

These measurements establish technical observations of public interfaces. They do not establish investment suitability, regulatory approval, economic value, guaranteed uptime, or future network performance.

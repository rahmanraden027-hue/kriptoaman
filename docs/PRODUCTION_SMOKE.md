# KriptoAman production smoke check

This check is deliberately low-rate and read-only. It verifies public availability without load testing or mutating KAM chain state.

Run:

```bash
node scripts/production-smoke.mjs
```

Checks:

- `https://kriptoaman.com/`
- `/api/auth/readiness`
- `/SystemStatus`
- explorer UI reachability
- KAM RPC `eth_chainId` (must be `0x560c`, decimal 22028)
- KAM RPC `eth_blockNumber` (must decode to a valid non-negative height)

A failed check exits non-zero and prints structured JSON for diagnosis.

## Safety boundary

The script does not submit transactions, sign messages, access private keys, change validator configuration, alter treasury/balances/supply/genesis, change DNS/secrets, or generate production load. It must remain a low-rate availability check.

## Issue #302 recovery gate

Before closing #302, separately verify Blockscout indexer progression and a known transaction receipt. Do not claim explorer recovery merely because the explorer HTML page returns HTTP 200.

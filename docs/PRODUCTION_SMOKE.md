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
- Blockscout `/api/v2/blocks` reachability with a non-empty blocks payload
- Blockscout `/api/v2/stats` reachability with a JSON object payload
- KAM RPC `eth_chainId` (must be `0x560c`, decimal 22028)
- KAM RPC `eth_blockNumber` (must decode to a valid non-negative height)

The probes run independently so a timeout on one RPC or Explorer endpoint does not hide evidence from the others. A failed check exits non-zero and prints structured JSON for diagnosis. Timeouts remain failures; this check is fail-closed.

## Safety boundary

The script does not submit transactions, sign messages, access private keys, change validator configuration, alter treasury/balances/supply/genesis, change DNS/secrets, or generate production load. It must remain a low-rate availability check.

## Incident recovery gate

The integrated blocks/stats probes establish current API reachability, but a single smoke run is not proof of indexer continuity. Before closing an RPC/Explorer production incident such as #587, separately verify Blockscout indexer progression across fresh samples and a known transaction receipt. Do not claim Explorer recovery merely because the Explorer HTML page returns HTTP 200.

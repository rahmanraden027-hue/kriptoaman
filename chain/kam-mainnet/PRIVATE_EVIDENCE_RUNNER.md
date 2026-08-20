# KAM Private Mainnet Evidence Runner

This package collects the promotion evidence that must never be exposed through the public RPC gateway.

## Security model

- Run only on a protected self-hosted GitHub Actions runner labelled `kam-mainnet-evidence`.
- Install the runner on a private validator or protected operations host.
- Bind the evidence RPC to `127.0.0.1:8545`; do not create a public DNS record.
- Do not commit validator keys, enodes, private IPs, RPC credentials, database archives, or raw backup files.
- The uploaded evidence contains counts, block heights, and SHA-256 fingerprints only.

## Runner prerequisites

1. Linux x64 host with Node.js-compatible networking.
2. GitHub Actions runner labels: `self-hosted`, `linux`, `x64`, `kam-mainnet-evidence`.
3. Local RPC at `http://127.0.0.1:8545` with:
   - `eth_chainId`
   - `eth_blockNumber`
   - `net_peerCount`
   - `qbft_getValidatorsByBlockNumber`
4. A completed isolated restore evidence file at:
   `/var/lib/kam-evidence/backup-restore-evidence.json`

Use `backup-restore-evidence.example.json` as the schema. The restore must target an isolated non-production node. Never test restoration over a live validator data directory.

## Execution

Run the **KAM Private Mainnet Evidence** workflow manually after the runner and evidence file are ready.

A passing run proves:

- Chain ID is `0x560c`.
- Exactly four validators are present.
- At least three private peers are visible.
- Blocks advance.
- Backup and isolated restore evidence is recent and checksum-valid.

This workflow does not promote the network automatically. The result is reviewed together with 24 consecutive public endpoint artifacts and the remaining Issue #115 gates.

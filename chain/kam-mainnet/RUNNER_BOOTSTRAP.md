# KAM Evidence Runner Bootstrap

This package prepares a protected Linux x64 host for the private KAM mainnet evidence workflow without exposing validator secrets.

## What the bootstrap validates

Run:

```bash
sudo bash chain/kam-mainnet/scripts/bootstrap-evidence-runner.sh
```

The script refuses to continue unless all of the following are true:

- the private RPC is loopback-only (`127.0.0.1` or `localhost`)
- Chain ID is exactly `0x560c` (22028)
- the QBFT validator query returns exactly four validators
- at least three private peers are visible
- block height advances during the preflight window

A redacted preflight record is written to:

`/var/lib/kam-evidence/runner-bootstrap-check.json`

It contains counts and block heights only. It must never contain private keys, validator addresses, enodes, private IP addresses, RPC credentials, seed phrases, or backup archives.

## GitHub runner registration

After the preflight passes, register a repository self-hosted runner from the repository settings page using GitHub's current Linux x64 instructions. Install it under `/opt/kam-actions-runner` and add the custom label:

`kam-mainnet-evidence`

Do not commit or share the short-lived registration token.

## Backup/restore gate

The evidence workflow also requires:

`/var/lib/kam-evidence/backup-restore-evidence.json`

This file must be produced only after a real backup is restored onto an isolated non-production node. Do not restore over a live validator data directory.

The verifier requires a recent timestamp, SHA-256 checksums, restored height at or above the snapshot height, and `restoreTarget` equal to `isolated-non-production`.

## Final execution

Once the runner service is online and the restore evidence exists, run the GitHub Actions workflow **KAM Private Mainnet Evidence** manually.

A successful workflow provides the private evidence needed for Issue #115. It does not by itself promote the network to public mainnet; the 24-hour public endpoint evidence and all remaining promotion gates still apply.

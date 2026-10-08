# KAM Evidence Runner Bootstrap

This package prepares a protected Linux x64 host for the private KAM mainnet evidence workflow without exposing validator secrets.

## 2026-10-08 protected-runner recovery — do not run blindly

The GitHub repository runner list currently shows only `kam-explorer-blockscout-01` with label `kam-explorer-host`. The protected workflow needs a **different** runner with label `kam-mainnet-evidence`; the Explorer runner must not be relabelled. Workflow #29 is queued and #32 is waiting under concurrency. Do not repeatedly dispatch runs or weaken branch/runner safeguards.

A DigitalOcean inventory reports an active recovery Droplet, but **metadata does not prove its suitability**. An authorized infrastructure operator must first verify that the chosen host is a dedicated, trusted audit operations environment, not a busy Explorer/indexer or live validator. Check its actual network isolation, local constrained evidence proxy, filesystem access, OS architecture, running services, protected backup/restore artifacts and existing runner registrations. Do not share secrets, private addresses or operator credentials in GitHub logs.

**Important:** The workflow and the private evidence runner specification use `127.0.0.1:8648`, not the validator's management RPC on `8545`. The bootstrap's default is now the constrained evidence-only loopback port `8648`. It rejects public URLs, wrong ports and URL suffixes **before** it mutates the host. The bootstrap itself still installs packages and creates local service directories: execute it only with explicit operations approval after the following preflight passes.

Read-only preflight on the approved host (output must stay private until sanitized):

```bash
# No sudo, no installs and no state changes:
uname -m
command -v curl
command -v jq
ss -lnt | grep -E '127[.]0[.]0[.]1:8648|\[::1\]:8648' || true
curl --noproxy '*' --connect-timeout 2 --max-time 5 -fsS \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  http://127.0.0.1:8648 | jq -r '.result // "UNAVAILABLE"'
```

Only proceed when the protected proxy is local-only, responds with `0x560c`, and the host has the required private evidence files. Do **not** expose `qbft_*` on the public RPC; the private evidence proxy needs its own authorized narrowly scoped access.

Required private evidence inputs include the four-host topology, protected-origin input, and isolated restore proof under `/var/lib/kam-evidence/`. A separate canonical finality proof is required by the current GitHub workflow. The operator must perform a non-production restore test; never restore a backup over a running validator.

If the old private runner service exists on the approved host, repair its registration/service before provisioning a replacement. A new runner must be registered only on the chosen trusted host using GitHub's time-limited token locally, never pasted into chat. Once the runner reports Online, let the serialized workflow queue progress (#29 before #32 unless explicitly reviewed). Review redacted outputs for QBFT, finality, four-host topology, protected RPC, and restore. A green runner registration alone never certifies mainnet readiness.

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

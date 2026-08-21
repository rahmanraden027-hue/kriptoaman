# KAM Four Production Validators — Zero-Downtime Reconciliation

Status: operator runbook for the existing KAM Mainnet Candidate chain.

## Non-negotiable continuity rule

The public KAM candidate chain is already producing blocks. Do **not** replace genesis, delete chain data, or start a second genesis with Chain ID 22028. Production validator work must join and reconcile the existing chain so RPC and explorer remain on the same history.

## Target end state

- Exactly four production validator addresses.
- Four addresses are valid and unique.
- Each production validator uses a key generated locally on its own persistent host.
- At least three private peers are visible from the evidence RPC.
- Chain ID remains `0x560c`.
- Blocks continue advancing during and after reconciliation.
- Public RPC remains behind the existing protected gateway; validator management APIs remain private.
- Final private evidence fingerprint matches the pre-declared production validator fingerprint.

## Phase A — Prepare four persistent hosts without touching consensus

For `validator-1` through `validator-4`:

1. Provision persistent Linux x64 storage and a stable private-network identity.
2. Install the same reviewed Besu release used by the KAM deployment baseline.
3. Generate the node key **on that host**. Never copy testnet keys or generate all four private keys on one shared machine.
4. Export only the validator address/public identity required for coordination. Never commit the private key.
5. Copy the **existing chain genesis** and approved peer/bootstrap configuration from the running KAM candidate environment. Do not generate a new genesis.
6. Start the new host as a non-validator peer first.
7. Keep JSON-RPC bound to loopback/private interfaces only; do not expose QBFT/admin/debug/personal APIs publicly.
8. Wait until the new host is synchronized to the current chain height and has healthy private peers.

No validator vote/change is allowed until all four new hosts are synchronized non-validator peers.

## Phase B — Bind evidence to the intended production set

Create a temporary local file with the four production validator addresses, one per line. On the protected operations host run:

```bash
node chain/kam-mainnet/scripts/build-production-validator-fingerprint.mjs /secure/path/validator-addresses.txt \
  | sudo tee /var/lib/kam-evidence/expected-validator-fingerprint.txt >/dev/null
sudo chmod 0640 /var/lib/kam-evidence/expected-validator-fingerprint.txt
```

Delete the temporary address file if operational policy requires the addresses to remain redacted. The stored SHA-256 fingerprint is sufficient for the promotion evidence gate.

## Phase C — Reconcile consensus one validator at a time

Before **every** validator-set change:

1. Confirm public `eth_chainId` is `0x560c`.
2. Confirm public block height is advancing.
3. Confirm explorer height is within the promotion-gate tolerance of RPC.
4. Confirm current private QBFT validator set and peer health.
5. Confirm no other validator transition is in progress.

Then use the private Besu QBFT validator-voting interface from the existing validator network to add one synchronized production validator. Wait for the validator set to converge and for several blocks to finalize before the next change.

After a new production validator is active and stable, remove at most one superseded validator using the same private QBFT governance process. Never remove multiple validators at once. Maintain a functioning QBFT quorum throughout the process.

Repeat until the active QBFT set consists of exactly the four intended production validator addresses.

## Phase D — Hard final proof

On the protected self-hosted runner, keep the evidence RPC at `http://127.0.0.1:8545` and run the `KAM Private Mainnet Evidence` workflow.

The private evidence collector only passes when all of these are true:

- Chain ID is `0x560c`.
- The QBFT result contains exactly four validators.
- All four validator addresses are syntactically valid EVM addresses.
- All four validator addresses are unique.
- The observed validator-set fingerprint equals `/var/lib/kam-evidence/expected-validator-fingerprint.txt`.
- At least three private peers are visible.
- Block height advances during the probe.
- Backup/restore evidence also passes the workflow gate.

The evidence artifact redacts validator addresses and publishes only counts, boolean checks, block heights and the SHA-256 fingerprint.

## Zero-downtime rollback rule

If block progression stalls, peer count drops unexpectedly, explorer falls materially behind RPC, or the current validator set does not converge after a governance change:

- stop making further validator-set changes;
- do not restart all validators together;
- keep the existing public RPC/sentry path untouched;
- restore the last known healthy validator membership using the private governance path;
- verify public block progression before resuming.

A validator transition is complete only after both private evidence and the public promotion gate pass. Until then the network remains `mainnet-candidate-not-public`.

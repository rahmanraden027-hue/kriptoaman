# KAM Mainnet Four-Host Validator Migration Runbook

Status: operational runbook only. This document does not promote KAM to public mainnet and does not authorize resetting genesis, Chain ID, or chain history.

## Objective

Move the current four-validator topology from one shared failure domain to four persistent Linux hosts while preserving the existing KAM chain, Chain ID `22028` (`0x560c`), QBFT consensus, block history, public RPC, and explorer continuity.

## Non-negotiable safety rules

- Do not create a new genesis file for production migration.
- Do not reset Chain ID `22028`.
- Do not replace or truncate chain history.
- Do not expose validator JSON-RPC, admin, debug, personal, or QBFT management interfaces publicly.
- Do not upload validator private keys, enodes, private IPs, SSH keys, secrets, backup archives, or raw production config to GitHub.
- Migrate one validator identity at a time. Never take multiple voting validators out of service together.
- After every validator move, verify block progression and explorer alignment before continuing.
- Abort the migration if finality stalls, peer count collapses, chain ID mismatches, or explorer divergence exceeds the approved threshold.

## Target topology

- Validator host 1: existing production host, one validator identity only.
- Validator host 2: new persistent Linux host, one validator identity.
- Validator host 3: new persistent Linux host, one validator identity.
- Validator host 4: new persistent Linux host, one validator identity.
- Public RPC: dedicated protected sentry/origin path, separate from validator management RPC.
- Explorer: follows the same KAM chain and remains externally reachable through HTTPS.

Each validator host must have an independent failure domain, persistent storage, time synchronization, firewalling, and a unique production validator key.

## Phase 0 — pre-migration evidence gate

Before touching the running validator set, collect and retain redacted evidence that:

1. Public RPC returns `0x560c`.
2. Public block height advances.
3. Explorer indexes the same chain within the accepted distance.
4. Sensitive namespaces are blocked from the public RPC.
5. Private QBFT validator set contains exactly four unique expected validator addresses.
6. Private peer count meets the production minimum.
7. Current backup/restore verification is `ready: true`.
8. Existing validator-set fingerprint matches the declared production fingerprint.

If any item fails, stop and repair the existing topology before migration.

## Phase 1 — provision three additional hosts

For validator hosts 2-4:

- Use persistent Linux servers suitable for long-running Besu/QBFT workloads.
- Patch the OS and enable automatic security updates appropriate for production policy.
- Configure NTP/system time synchronization.
- Create a dedicated non-root service account for the node process.
- Mount persistent node data storage.
- Allow only required P2P traffic between approved peers and operational SSH from approved administration sources.
- Bind node management/JSON-RPC interfaces to loopback or a protected private interface only.
- Install the same compatible Besu release line used by the running network.
- Do not start a validator vote until the node is fully synchronized with the existing chain.

## Phase 2 — synchronize replacement hosts as non-disruptive peers

For each new host, one at a time:

1. Start from the existing production genesis and network configuration without changing chain parameters.
2. Join the existing KAM network as a synchronized peer.
3. Verify Chain ID `0x560c`.
4. Wait until the new host reaches the current chain height.
5. Verify stable peer connectivity and continuous block import.
6. Keep public RPC disabled on the validator host.

Do not proceed to validator identity migration until all three new hosts are fully synchronized peers.

## Phase 3 — migrate validator identities one at a time

Perform the following sequence separately for validator 2, then validator 3, then validator 4. Validator 1 remains on the original host.

For each identity:

1. Confirm the destination host is synchronized and healthy.
2. Take a fresh protected backup of the destination node data and record redacted restore evidence where required.
3. Securely transfer only the intended validator identity using an approved out-of-band secret-handling process. Never commit or upload it.
4. Stop only the source process for that single validator identity.
5. Start that validator identity on the destination host using the same production network configuration.
6. Confirm the private QBFT validator set is still exactly the intended four unique validators.
7. Confirm peer count remains healthy.
8. Confirm block height advances across multiple probes.
9. Confirm public RPC remains `0x560c`, sensitive namespaces remain blocked, and explorer stays aligned.
10. Observe stability before migrating the next identity.

If the existing topology requires an explicit QBFT membership change rather than moving the same validator key, make changes one validator at a time and require independent readiness checks after every vote. Never rotate several voting identities simultaneously.

## Phase 4 — remove duplicate processes from the old host

Only after validators 2-4 are verified healthy on their new hosts:

- Disable and remove the superseded validator processes from the original shared host.
- Keep only validator 1 on the original host.
- Verify the old host no longer has active duplicate validator identities.
- Verify all four validator identities are distributed one-per-host.

## Phase 5 — post-migration private evidence

Run the protected KAM private evidence workflow and require:

- Chain ID exactly `0x560c`.
- Exactly four unique expected QBFT validators.
- Validator-set fingerprint matches the pre-declared production fingerprint.
- At least the required private peer count.
- Blocks advance during the probe.
- Backup/restore evidence is current and `ready: true`.

Do not mark the four-host Issue #115 gate complete from process lists alone; require evidence from the actual protected infrastructure.

## Phase 6 — restart the public 24-hour stability window

After topology migration is complete and private evidence is green:

- Start a new 24-hour consecutive public evidence window.
- Require at least one valid `ready: true` evidence artifact in each consecutive UTC hour bucket.
- A missing hour, `ready: false`, chain ID mismatch, stalled block height, explorer divergence, sensitive namespace exposure, or invalid artifact breaks the streak.
- Do not reuse historical evidence from before the topology migration as proof of the new production topology.

## Phase 7 — final registry and publication gate

Only after the four-host topology and the complete 24-hour evidence window pass:

1. Re-check Chain ID `22028` against the public EVM registry immediately before publication.
2. Confirm the public RPC and explorer metadata in the external chain registry PR are still correct.
3. Confirm final network documentation, logo, website, and verification channels are publicly reachable.
4. Review and merge the controlled status change from `mainnet-candidate-not-public` only after all Issue #115 gates are complete.
5. Continue MetaMask/ChainList/Trust Wallet registration from the verified final metadata.

## Rollback principle

Rollback means returning the single validator identity being migrated to its previously known-good host/configuration while preserving the same genesis, Chain ID, validator set intent, and chain history. It never means creating a new chain or resetting the production history.

## Evidence record

For each migrated validator record, outside public GitHub where sensitive details are involved:

- source host identifier (non-secret internal record),
- destination host identifier,
- maintenance timestamp,
- pre/post block height,
- pre/post peer count,
- validator-set fingerprint,
- backup/restore evidence timestamp,
- public RPC/explorer readiness result,
- operator approval and rollback outcome if used.

Public repository evidence should remain redacted and contain only non-sensitive pass/fail facts, timestamps, hashes/fingerprints, and workflow references.
# KAM Mainnet Four-Host Evidence Collection

Status: **operator evidence procedure — does not itself promote KAM to public mainnet**.

This procedure produces the private redacted evidence consumed by `KAM Four-Host Redundancy Gate`. It is designed to prove that the four production validator identities actually run on four distinct persistent Linux hosts / failure domains and that the RPC sentry is on a fifth, separate host identity.

## Security boundaries

Never place any of the following in GitHub, issue comments, screenshots, or uploaded workflow artifacts:

- validator private keys or keystore passwords;
- treasury/private wallet keys or seed phrases;
- SSH private keys;
- raw private IP addresses or enodes;
- RPC credentials or Cloudflare secrets;
- backup archives or database credentials.

The collector only emits SHA-256 fingerprints, boolean host checks, filesystem type, an operator-defined failure-domain label, and timestamps. The five source attestations and the combined input file remain on protected infrastructure. The workflow uploads only the already-redacted verifier result.

## Prerequisite topology

Before collecting evidence, the real running infrastructure must already be:

- validator 1: one persistent Linux host, one production validator identity;
- validator 2: a second persistent Linux host / independent failure domain;
- validator 3: a third persistent Linux host / independent failure domain;
- validator 4: a fourth persistent Linux host / independent failure domain;
- RPC sentry/origin: a separate protected host identity, not one of the validator hosts.

Do not invent different failure-domain labels for processes that are actually on the same VPS. Four validator processes on one machine still fail the gate.

## 1. Collect one attestation on each validator host

Run from the checked-out repository on the actual validator host. Replace the validator ID, failure-domain label, and node-data directory with the real values for that host.

Example:

```bash
sudo env \
  KAM_ATTESTATION_ROLE=validator \
  KAM_VALIDATOR_ID='0xREAL_VALIDATOR_ADDRESS' \
  KAM_FAILURE_DOMAIN='real-provider-region-host-1' \
  KAM_NODE_DATA_DIR='/var/lib/besu' \
  KAM_PERSISTENT_STORAGE_ATTESTED=true \
  KAM_MANAGEMENT_RPC_PORTS='8545,8546,8648' \
  bash chain/kam-mainnet/scripts/collect-host-attestation.sh \
  > /var/lib/kam-evidence/validator-host-attestation.json
```

Repeat on validator hosts 1-4.

The command refuses to emit an attestation unless:

- the role is valid;
- a validator identity and real failure-domain label are supplied;
- the node-data directory exists;
- persistent storage is explicitly attested by the operator;
- NTP synchronization is reported active;
- the data filesystem is not `tmpfs`/`ramfs`;
- configured management RPC ports are not listening on wildcard public interfaces.

`KAM_VALIDATOR_ID` is used only to derive a SHA-256 identity fingerprint. No validator private key is read.

## 2. Collect the RPC-sentry attestation

On the dedicated protected RPC/sentry host:

```bash
sudo env \
  KAM_ATTESTATION_ROLE=rpc-sentry \
  KAM_NODE_DATA_DIR='/var/lib/besu' \
  KAM_PERSISTENT_STORAGE_ATTESTED=true \
  KAM_MANAGEMENT_RPC_PORTS='8545,8546,8648' \
  bash chain/kam-mainnet/scripts/collect-host-attestation.sh \
  > /var/lib/kam-evidence/rpc-sentry-attestation.json
```

This host must genuinely be separate from all validator hosts. The final assembler verifies that its host fingerprint does not match any validator host fingerprint.

## 3. Transfer the five redacted source attestations only to the protected evidence runner

Use the approved private administration path. Do not upload the source files to public GitHub.

Example protected paths on the evidence runner:

```text
/var/lib/kam-evidence/validator-1.json
/var/lib/kam-evidence/validator-2.json
/var/lib/kam-evidence/validator-3.json
/var/lib/kam-evidence/validator-4.json
/var/lib/kam-evidence/rpc-sentry.json
```

## 4. Assemble the private four-host evidence file

On the protected evidence runner:

```bash
node chain/kam-mainnet/scripts/assemble-four-host-topology-evidence.mjs \
  /var/lib/kam-evidence/validator-1.json \
  /var/lib/kam-evidence/validator-2.json \
  /var/lib/kam-evidence/validator-3.json \
  /var/lib/kam-evidence/validator-4.json \
  /var/lib/kam-evidence/rpc-sentry.json \
  /var/lib/kam-evidence/four-host-topology-evidence.json
```

The assembler rejects:

- duplicate validator host fingerprints;
- duplicate validator identity fingerprints;
- duplicate failure-domain labels;
- an RPC sentry sharing a validator host fingerprint;
- stale or future-dated attestations;
- attestations missing persistent storage, time sync, or private management-RPC checks.

The output file is written with mode `0600`.

## 5. Verify locally before running the GitHub gate

```bash
node chain/kam-mainnet/scripts/verify-four-host-topology.mjs \
  /var/lib/kam-evidence/four-host-topology-evidence.json
```

Proceed only if the result contains:

```json
{
  "ready": true
}
```

The verifier's public-safe output includes only aggregate pass/fail facts and set fingerprints. It does not expose individual host or validator identities.

## 6. Run the protected workflow

Run the GitHub Actions workflow:

`KAM Four-Host Redundancy Gate`

The job must run on the protected self-hosted runner labelled:

`kam-mainnet-evidence`

Retain the `kam-four-host-redundancy-evidence` artifact and record its workflow run ID / artifact digest in Issue #115.

## 7. Protected RPC-origin proof

Four-host redundancy alone is not enough. Before setting `dedicatedProtectedRpcOrigin=true`, also verify operationally that:

- the Cloudflare Worker reaches the dedicated RPC/sentry origin rather than a validator management RPC;
- validator JSON-RPC/admin/debug/personal/QBFT management interfaces are not Internet-facing;
- public `rpc.kriptoaman.com` continues to block privileged namespaces;
- the protected origin cannot be bypassed directly from the public Internet;
- explorer traffic uses the approved protected RPC path.

Do not commit `KAM_RPC_ORIGIN` or reveal the origin URL in public evidence.

## 8. Start a new continuity window after topology is final

After both four-host topology and protected RPC-origin evidence pass, begin a new continuous evidence window. Historical samples collected before the final topology must not be reused as proof of the final production architecture.

The public-mainnet promotion remains blocked until the repository's active continuity rule reports PASS and every Issue #115 gate is independently supported.

## Final promotion rule

Only when all gates are current and true may a separate reviewed PR change the authoritative network state from `mainnet-candidate-not-public` to public mainnet. That PR must not change genesis, Chain ID, supply, balances, validator signing material, treasury state, or chain history.

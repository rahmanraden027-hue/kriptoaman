# Collecting ZVQ Genesis Attestation from Termux

The production genesis may remain only on the private Termux/server environment. Do **not** upload the genesis file, private keys, mnemonics or keystore files.

Phase 16G provides a read-only collector:

```bash
node scripts/collect-zvq-genesis-attestation.mjs /absolute/path/to/genesis.json
```

Optional explicit output and RPC:

```bash
node scripts/collect-zvq-genesis-attestation.mjs /absolute/path/to/genesis.json \
  --rpc=https://rpc.kriptoaman.com \
  --output=$HOME/zvq-genesis-attestation.json
```

The output contains only:

- SHA-256 of the local genesis artifact;
- Chain ID;
- number of `alloc` entries;
- aggregate genesis allocation;
- consensus-config key names;
- whether `extraData` exists;
- public RPC Chain ID;
- public block-0 hash;
- current public block height;
- explicit non-claims for total/circulating/maximum-supply verification.

It does **not** emit allocation addresses, private keys, mnemonics, keystores or the genesis file itself.

## Before sharing the output

Run:

```bash
cat $HOME/zvq-genesis-attestation.json
```

Confirm there are no fields you consider sensitive. The standard collector intentionally omits allocation addresses.

## Meaning of aggregate alloc

The aggregate genesis `alloc` value proves what the referenced local genesis allocated at genesis. It does **not** automatically prove current total supply or current circulating supply. Issuance/reward/burn behavior and current allocation/lock evidence must still be reconciled.

## Safety

This collector performs no transaction, no signing, no balance change, no genesis change, no validator change and no RPC write/admin/debug call.

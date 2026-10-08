# P0–P1: KAM → ZEVARYQ genesis and account continuity (read-only)

**Date:** 2026-10-08 · **Status:** EVIDENCE COLLECTION, NOT VALIDATED CONTINUITY.

## Why this gate comes before DEX and liquidity

A secp256k1 EVM wallet legitimately has the **same public address** across networks. This alone does not cause a malicious-token warning, a balance error, or break a chain. The material risks are (1) ambiguous network metadata after renaming KAM to ZEVARYQ with the same Chain ID 22028, (2) a different genesis/chain history using that ID, (3) importing a WKAM ERC-20 contract as if it were the ZVQ native coin, and (4) an unconfirmed genesis allocation account.

No fund movement, genesis edits, new token mint, new blockchain, contract deployment, or transaction signature can resolve an unproven chain identity.

## Sources already in the repository

- Rebrand policy: `chain/kam-mainnet/zevaryq-rebrand.json` requires in-place continuation, no new genesis, and preservation of balance and block history. It documents intent, not independently measured current continuity.
- Recorded WKAM deployment: `chain/kam-mainnet/deployments/wkam.json`, block **240024**, tx `0x571063f1f9d031ac9ae6f22b861ff6766c5c6ee78b2d49d0b93e151acde0e7cf`, address `0x0d8848ce88bb09a81a4248efdd574d50b98b544a`.
- The existing `scripts/verify-zvq-same-block-balances.mjs` checks labels **legacy KAM Treasury** and **historical WKAM deployer**, not an owner-confirmed genesis public address. It explicitly marks wallet ownership unverified.
- Recent `docs/ZVQ_FOUR_SCOPE_EVIDENCE_AUDIT_2026-10-08.md` reports missing latest WKAM bytecode, ERC-20 historical reconciliation PARTIAL, and absent configured liquidity. A missing current contract is not proof of absent historical deployment.
- Some historical notes mention several accounts and at least one truncated address. **Do not guess, pad, or use those strings as wallet identities or destination addresses.**

## New bounded P0–P1 verifier

`scripts/probe-zvq-genesis-continuity-readonly.mjs` makes only allowlisted read methods against two **public** first-party endpoints. Both may share a backend, so endpoint agreement is not an independent consensus or custody audit.

It reads:
1. `eth_chainId` and `eth_blockNumber`;
2. block 0 and block 240024 hashes and their agreement;
3. recorded WKAM deployment transaction receipt, its block hash and number;
4. WKAM current runtime-code presence at observed heads;
5. **only when an owner-confirmed full public address is explicitly provided:** `eth_getBalance` and `eth_getTransactionCount` at each observed head, without claiming same-block balance agreement or wallet ownership.

Methods for signing/sending/admin/debug are denied by the script. Budget is limited to 20 calls and 10 seconds per request; there is no private RPC/validator connection and no key input.

Run regression tests:

```bash
node --test tests/probe-zvq-genesis-continuity-readonly.test.mjs
```

Run public historical observation **without** wallet address:

```bash
node scripts/probe-zvq-genesis-continuity-readonly.mjs
```

For **local, public-address-only observation** after independent wallet identity confirmation:

```bash
ZVQ_GENESIS_PUBLIC_ADDRESS=0xYOUR_40_HEX_PUBLIC_ADDRESS node scripts/probe-zvq-genesis-continuity-readonly.mjs
```

The published CI workflow never supplies any wallet address. Never supply seed phrase, private key, keystore, signer credentials, mnemonic, password, or raw genesis material that contains secrets. Be aware that a shell command can be retained in shell history; this value is a public address only.

## Required owner/archival evidence before P0 may pass

- [ ] Exact **42-character public wallet address** confirmed from the wallet account and original genesis allocation record, not an imported token contract.
- [ ] Original, trusted **KAM block-0 hash** recorded from an offline pre-incident backup/archive, with provenance and date. Compare with observed ZVQ block-0 hash.
- [ ] Trusted old KAM hash of block 240024 or the recorded transaction receipt, from an **independent pre-incident artifact**. A current explorer alone cannot independently prove unchanged history.
- [ ] Verified genesis allocation, measured current native balance and nonce; reconcile any historical KAM/ZVQ transaction hashes.
- [ ] Exact MetaMask network settings and full warning text, with **no secrets**, to distinguish chain metadata, native coin, and historical WKAM import.

**Do not claim 4 validator health, finality or chain continuity solely from matching public endpoint hashes.** A historical mismatch is a STOP for liquidity deployment and requires protected operator review.

## Decision rule

- P0/P1 remain **PARTIAL / HOLD** without the original archived fingerprints and verified genesis public address.
- Wrong chain/hash, contradictory receipt, or endpoint mismatch is **FAIL-CLOSED**; preserve the evidence and do not attempt a corrective transfer.
- On P0/P1 PASS, proceed to protected validator/finality check and separately audited WZVQ+quote-asset review; no automated transfer, swap, bridge or pool creation.

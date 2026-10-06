# Public Identity Cleanup Pack — Prepared During Phase 16F

Status: **PREPARED / NOT APPLIED**

This pack separates public identity cleanup from compatibility and historical evidence so the KriptoAman ecosystem can remove visible KAM drift without breaking production.

## Apply only after Phase 16F 24H PASS

The production baseline remains frozen while Phase 16F is collecting. This pack is documentation and regression evidence only. It does not authorize deployment or a protected runtime change.

## Public text to change

After the 24H gate passes, the following user-visible strings should be updated:

- `KAM RPC` → `ZEVARYQ RPC` in the readiness surface.
- `RPC KAM belum terverifikasi...` → `RPC ZEVARYQ belum terverifikasi...`.
- `KAM publication state` → `ZEVARYQ publication state`.
- `KAM tetap berstatus kandidat mainnet` → `ZEVARYQ tetap berstatus kandidat mainnet`.
- `Dedicated KAM RPC` → `Dedicated ZEVARYQ RPC` on the Enterprise surface.

These changes are presentation-only. They do not alter Chain ID, RPC behavior, block production, validator state, balances, supply, custody, or transaction policy.

## Compatibility identifiers to retain

Do not mechanically rename:

- `/api/kam/network-status` while legacy clients still depend on it;
- source filenames/routes such as `KAMNetwork.jsx` when they are compatibility identifiers;
- `chain/kam-mainnet/` operational paths;
- legacy workflow names and internal `X-KAM-*` markers that are part of deployment compatibility.

A future canonical `/api/zvq/network-status` route may coexist with the legacy endpoint. The old path should be removed only after measured client migration and a separate deprecation decision.

## Historical content to retain

KAM research, campaign and legacy DEX pages that are explicitly marked historical/legacy should remain intact. Rewriting historical records would reduce auditability.

## KAM Points

`KAM Points` is an off-chain reward/ledger product and is not ZVQ. It must not be renamed to ZVQ automatically. If the reward brand changes later, that should be a separate product decision with migration rules for existing balances and campaign records.

## Post-24H acceptance

The cleanup passes when the primary production surfaces expose KriptoAman + ZEVARYQ + ZVQ consistently, historical archives remain historical, compatibility paths continue working, KAM Points remain clearly off-chain, and no protected chain or financial state is changed.

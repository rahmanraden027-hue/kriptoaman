# KriptoAman Final Product Architecture 2026 — v1.0

Status: **IMPLEMENTATION BASELINE**

## Product roles

- **KriptoAman** — Intelligence & Control Platform.
- **ZEVARYQ Wallet** — User Execution Interface. Signing and broadcasting stay governed by release policy.
- **ZEVARYQ Network** — Blockchain & Settlement Infrastructure.
- **ZEVARYQ Explorer** — Evidence & Verification Layer.
- **ZVQ** — Native Network Asset.

## Product DNA

**OBSERVE → UNDERSTAND → DECIDE → EXECUTE → VERIFY**

The user should see data before explanatory copy. UI may never imply live state when the source is unavailable.

## Final screen order

1. Command Center
2. Markets
3. Intelligence
4. Network
5. Portfolio
6. Security
7. Wallet
8. Explorer

The canonical machine-readable contract is `src/lib/productArchitecture.js`.

## Truth-state contract

All production surfaces must resolve their visible data state through the existing canonical vocabulary:

`LIVE / VERIFIED / SYNCED / PARTIAL / SNAPSHOT / UNAVAILABLE / CHECKING`

A missing source must render an unavailable/checking state instead of a simulated production number.

## Boundaries

This phase does **not** change:

- genesis;
- validator keys or private keys;
- balances or token state;
- transactions;
- DNS;
- RPC write policy;
- wallet signing or broadcasting;
- protected network identity.

Chain identity remains ZEVARYQ Mainnet, Chain ID 22028 (0x560c), native symbol ZVQ.

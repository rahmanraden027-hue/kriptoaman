# ZEVARYQ Platform ↔ Wallet Synchronization Device Gate

Status: **PREPARED / NOT DEPLOYED DURING PHASE 16F 24H COLLECTION**

## Purpose

Keep KriptoAman Platform and ZEVARYQ Wallet on one verified ZEVARYQ network-status contract without breaking legacy clients.

## Compatibility plan

- Canonical preferred route: `/api/zvq/network-status`
- Compatibility route retained: `/api/kam/network-status`
- Both routes resolve to the same verified read-only handler.
- No duplicated chain logic or independently generated values are allowed.
- Chain identity remains ZEVARYQ Mainnet, Chain ID 22028 (`0x560c`), native symbol ZVQ.
- The compatibility route is not removed during this gate.

## Production freeze rule

This preparation branch must not be merged or deployed while the active Phase 16F 24H stability window is still collecting unless a separately reviewed production incident requires it.

## Device Gate after 24H PASS

1. Open KriptoAman Platform and confirm ZEVARYQ network state is LIVE/VERIFIED with Chain ID 22028.
2. Open standalone ZEVARYQ Wallet.
3. Connect an external wallet; confirm address appears and network identity is Chain 22028.
4. Confirm native ZVQ balance is read from the verified network path.
5. Open Assets and confirm only indexed holdings are shown; planned ecosystem assets remain clearly labeled PLANNED.
6. Open Receive and confirm the connected address/QR is generated without custody.
7. Open Send and create a Preview Send only.
8. Confirm the release still shows `Broadcast Locked` and signing/broadcasting disabled.
9. Open Swap and verify `/api/zvq-swap-preview` remains non-broadcasting.
10. Open Explorer from the Wallet and confirm the public Explorer is LIVE/INDEXED.
11. Compare Platform network block and Wallet network block; both must resolve through the same status handler and remain consistent with Explorer within the accepted lag.
12. Record screenshots/evidence for Android and desktop/web.

## PASS criteria

- No KAM-branded visible network identity on Platform or Wallet.
- Preferred ZVQ endpoint works.
- Legacy endpoint remains backward-compatible.
- No split-brain block height or chain identity.
- Wallet signing and broadcasting remain governed by the current release policy.
- No genesis, validator, private-key, balance-state, token-supply, liquidity, custody, DNS, consensus, or RPC write-policy mutation.

# ZEVARYQ Identity Migration — 2026-09-22

## Final canonical identity

- Network: **ZEVARYQ Mainnet**
- Native asset: **ZEVARYQ**
- Symbol: **ZVQ**
- Chain ID: **22028** (`0x560c`)
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`
- Ecosystem / platform: **KriptoAman**

## Migration model

This is an **in-place identity rebrand** of the existing Chain ID 22028 network. It is not a new chain and it does not authorize destructive state migration.

The migration preserves:

- genesis and consensus parameters;
- full block and transaction history;
- account addresses and native balances;
- validator identities and validator private keys;
- smart-contract addresses and indexed receipts;
- Explorer history and existing chain state.

## Legacy compatibility

Legacy `KAM` route names, filenames, database field names, monitoring identifiers, headers and workflow filenames may remain temporarily where changing them would break integrations. They are compatibility identifiers only and are not the canonical public network identity.

Canonical public routes now include:

- `/api/zevaryq/network-status`
- `/api/zevaryq/address-profile/:address`
- `/zevaryq-mainnet.json`

Legacy `/api/kam/*` and `/kam-mainnet.json` paths remain compatibility aliases during the transition.

## Historical and on-chain assets

Historical KAM documentation remains an audit record of the network before the rebrand and must not be rewritten as though it was originally published under ZEVARYQ.

Existing WKAM, sKAM or other deployed/minted assets are not renamed merely by changing UI copy. Any contract or mint identity that already exists on-chain remains address-bound and must be treated as a legacy asset unless a separately reviewed migration is approved.

## Safety boundary

This migration must never reset Chain ID, create a replacement production genesis, wipe Blockscout/PostgreSQL data, truncate chain history, replace validator keys, alter account balances, or rewrite smart-contract addresses.

Formal public-mainnet promotion readiness remains governed separately by production evidence gates. Identity consistency does not by itself mark those gates complete.

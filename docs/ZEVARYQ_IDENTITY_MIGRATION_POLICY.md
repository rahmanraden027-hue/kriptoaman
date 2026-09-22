# ZEVARYQ identity migration policy

This repository treats ZEVARYQ as an in-place identity migration of the existing
Chain ID `22028` (`0x560c`). It is not a new chain and must not reset or replace
genesis, balances, addresses, validator keys, smart contracts, or block history.

## Canonical active identity

- Platform: KriptoAman
- Legal operator: PT Kripto Aman Indonesia
- Network: ZEVARYQ Network
- Mainnet: ZEVARYQ Mainnet
- Native asset: ZEVARYQ (`ZVQ`, 18 decimals)
- Chain ID: `22028` / `0x560c`
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`

## Legacy handling

KAM is retained only in historical records, immutable deployed contract names,
database/API identifiers, compatibility routes, and operational filenames where
renaming could break consumers. Public active-network surfaces must label the
network ZEVARYQ and the native asset ZVQ. Historical KAM publications must be
marked as legacy rather than rewritten as if they originally referred to ZVQ.

## Production safety boundary

Identity-only releases must not change chain state, genesis, Chain ID, validator
or private keys, RPC method policy, database contents, contract addresses, token
supply, or custody behavior. Deployment requires route-level Explorer checks,
wallet metadata validation, application tests, and a reversible frontend release.

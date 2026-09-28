# ZEVARYQ Asset Layer v1

Status: **IMPLEMENTATION CANDIDATE v0.2 HARDENING / NOT DEPLOYED**

Chain: ZEVARYQ Mainnet  
Chain ID: 22028 (`0x560c`)

The Asset Layer defines three first-party financial representations for the ZEVARYQ ecosystem:

- **ZUSD** — ZEVARYQ USD, 6 decimals, reserve-backed target unit of account.
- **zBTC** — Bitcoin representation on ZEVARYQ, 8 decimals, mintable only against verified locked BTC.
- **zETH** — Ethereum representation on ZEVARYQ, 18 decimals, mintable only against verified locked ETH.

This directory contains the reviewed specification plus a source-only implementation candidate and Foundry tests. It does **not** authorize or perform deployment, minting on mainnet, bridging, custody, liquidity creation, treasury movement, or public trading.

## Naming policy

ZUSD, zBTC, and zETH are ZEVARYQ ecosystem assets. They must never be presented as issuer-native USDT, USDC, BTC, or ETH.

Issuer assets may only be displayed with issuer/bridge provenance after a legitimate bridge or issuer integration exists. Examples such as `USDC.zvq` or `USDT.zvq` are reserved for future provenance-verified integrations and must not be created as imitation tokens.

## Core invariants

1. No unbacked mint path.
2. No arbitrary owner mint.
3. No hidden transfer tax.
4. No arbitrary blacklist.
5. No proxy/delegatecall upgrade path in the token core for v1.
6. Every bridge deposit identifier is single-use.
7. Every reserve or bridge attestation is epoch-bound and replay-protected.
8. Public token transfers remain independent of bridge/custody control.
9. Emergency controls are scoped and time-bounded.
10. Liquidity and market price are outside token contracts.

Additional v0.2 hardening:
- reserve/bridge outflows reduce effective mint backing until a fresh attestation;
- settlement and release evidence are replay-protected;
- pending bridge releases reserve backing before the underlying asset leaves custody;
- controller migration requires a contract-bound successor and zero outstanding obligations;
- zero-value ERC-20 transfers remain compatible.

See [SMART_CONTRACT_SPEC_V1.md](./SMART_CONTRACT_SPEC_V1.md) for the normative specification. Candidate contracts live under `contracts/`; no deployment script is permitted in this directory while authorization remains closed.

Current state:

`ZUSD_DEPLOYMENT_AUTHORIZED = false`  
`ZBTC_DEPLOYMENT_AUTHORIZED = false`  
`ZETH_DEPLOYMENT_AUTHORIZED = false`  
`RESERVE_BACKING_VERIFIED = false`  
`BRIDGE_BACKING_VERIFIED = false`  
`LIQUIDITY_AUTHORIZED = false`

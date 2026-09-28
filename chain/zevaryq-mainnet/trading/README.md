# ZEVARYQ DEX Candidate

Status: **PRE-DEPLOYMENT / NO PUBLIC LIQUIDITY**

This directory is the ZEVARYQ-native migration of the previously reviewed KAM DEX candidate. It deliberately uses new contract identities so historical KAM deployments cannot be confused with ZEVARYQ production contracts.

## Chain binding

- Network: ZEVARYQ Mainnet
- Native asset: ZVQ
- Chain ID: 22028 (`0x560c`)
- Wrapped native candidate: WZVQ
- AMM fee: 0.30%
- Routing: single-hop exact-input in the first production candidate

## Contracts

- `contracts/WZVQ.sol` — 1:1 native ZVQ wrapper with no owner/admin mint, tax, blacklist, or upgrade path.
- `dex/ZVQFactory.sol` — pair registry/factory.
- `dex/ZVQPair.sol` — constant-product pool and LP token.
- `dex/ZVQRouter.sol` — liquidity, quote, ZVQ/token and token/token routing.

## Production gates

No deployment, treasury movement, liquidity seeding, or public swap activation is authorized by this source tree.

Before production:
1. Foundry format/build/unit/fuzz/deployment-simulation gates must pass on the exact commit.
2. Independent smart-contract review must have no unresolved Critical/High findings.
3. Chain ID 22028, RPC stability, and Explorer indexing must be re-verified.
4. WZVQ, Factory and Router deployment addresses must be source-verified on Explorer.
5. A legitimate counter-asset must have documented provenance; imitation USDT/USDC is prohibited.
6. Treasury owner must explicitly approve the source wallet, token pair, maximum pilot amount and reserve ratio.
7. Small wrap/unwrap, add/remove liquidity, buy and sell smoke tests must pass.
8. Only after those checks may the wallet transaction gate be enabled.

`PUBLIC_SWAP_AUTHORIZED = false`
`LIQUIDITY_AUTHORIZED = false`
`ONCHAIN_DEPLOYMENT_AUTHORIZED = false`

# ZEVARYQ DEX Candidate

Status: **SOURCE / TEST CANDIDATE ONLY — NO MAINNET DEPLOYMENT AUTHORIZED**

This directory is an isolated ZEVARYQ-native migration candidate derived from the reviewed KAM DEX design. It does not deploy contracts, move treasury assets, create liquidity, mint a quote asset, or enable public trading.

## Network identity

- Network: ZEVARYQ Mainnet
- Native asset: ZEVARYQ (ZVQ)
- Wrapped native candidate: WZVQ
- Chain ID: 22028 (`0x560c`)
- RPC target: `https://rpc.kriptoaman.com`
- Explorer target: `https://explorer.kriptoaman.com`

## Candidate contracts

- `WZVQ.sol`: 1:1 native ZVQ wrapper with no owner/admin mint/tax/blacklist/upgrade.
- `ZVQFactory.sol`: unique pair factory.
- `ZVQPair.sol`: constant-product pair with 0.30% swap fee and reentrancy lock.
- `ZVQRouter.sol`: single-hop router with deadlines, minimum-output checks, liquidity functions, and explicit ZVQ native routes.

The router exposes `WETH()`, `swapExactETHForTokens`, and `swapExactTokensForETH` only as **V2 tooling compatibility aliases**. They operate on native ZVQ/WZVQ and must never be represented to users as Ethereum or WETH.

## Migration rule

The recorded legacy WKAM/KAM DEX deployment is not automatically canonical for ZEVARYQ. A production WZVQ/Factory/Router deployment must use the exact audited ZEVARYQ candidate source and produce new explorer-verifiable addresses.

## Quote asset gate

No quote asset is approved by this candidate. In particular:

- do not create an imitation token using the USDT, USDt, USDC, or other issuer branding;
- do not display an external stablecoin price unless the exact destination-chain asset has independently verified issuer/bridge provenance and backing;
- bridge/custody contracts, source token, supply accounting, and emergency authorities must be publicly documented before pool creation.

## Production gates

All must be completed before public swap can be enabled:

- [ ] Foundry format/build/unit/fuzz/deployment-simulation CI passes on the exact commit.
- [ ] Independent smart-contract review has no unresolved Critical/High findings.
- [ ] RPC Chain ID 22028 and block progression are re-verified immediately before deployment.
- [ ] Exact WZVQ runtime/source relationship is explorer-verified after deployment.
- [ ] Factory and Router are bound to the verified WZVQ address.
- [ ] Quote-asset provenance and backing are independently verified.
- [ ] Treasury owner explicitly approves source wallet and maximum pilot liquidity.
- [ ] Small wrap/unwrap and add/remove-liquidity smoke tests succeed.
- [ ] Small real buy and sell smoke tests succeed from separate test wallets.
- [ ] Pool/reserve/liquidity-wallet addresses are published.
- [ ] Wallet production environment is updated with verified addresses.
- [ ] `VITE_ZEVARYQ_TRANSACTIONS_ENABLED=true` is enabled only after the above gates pass.

## Authorization state

`WZVQ_DEPLOYMENT_AUTHORIZED = false`

`FACTORY_DEPLOYMENT_AUTHORIZED = false`

`ROUTER_DEPLOYMENT_AUTHORIZED = false`

`QUOTE_ASSET_APPROVED = false`

`LIQUIDITY_AUTHORIZED = false`

`PUBLIC_SWAP_AUTHORIZED = false`

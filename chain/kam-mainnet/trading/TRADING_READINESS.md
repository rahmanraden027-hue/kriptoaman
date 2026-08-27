# KAM Trading Readiness

Status: design/readiness only — no production deployment, no treasury movement, no market launch.

## Objective
Prepare KAM native coin for transparent, auditable public trading once KriptoAman Mainnet is independently verified as public-ready.

## Preconditions
- RPC `https://rpc.kriptoaman.com` must return Chain ID `22028` (`0x560c`) consistently.
- Explorer `https://explorer.kriptoaman.com` must be publicly reachable and synchronized.
- Blocks must continue advancing with no material stalls.
- Target 4 validators must be healthy and independently operated/configured as intended.
- No unresolved critical/high security findings.
- Mainnet commercial/public launch flag must be explicitly approved before enabling trading.

## Trading architecture
1. Native KAM remains the gas/native asset.
2. Deploy a minimal wrapped-native asset, `WKAM`, with 1:1 wrap/unwrap semantics.
3. Use a battle-tested AMM design compatible with EVM/QBFT; do not invent custom pricing logic.
4. Initial trading pair should use a legitimate counter-asset that actually exists on KAM Mainnet through a reviewed bridge or issuer-approved deployment.
5. Do not create a fake stablecoin or misleading token that imitates USDT/USDC branding.
6. All pool, router, factory, bridge, and token addresses must be publicly documented in explorer-verifiable metadata.

## WKAM requirements
- 18 decimals.
- 1 KAM deposited = 1 WKAM minted.
- 1 WKAM burned = 1 KAM withdrawn.
- No owner minting.
- No arbitrary blacklist/freeze unless explicitly justified, disclosed, audited, and approved.
- No transfer tax, rebasing, hidden fee, or upgrade path by default.
- Reentrancy-safe withdrawal path.
- Full source verification on explorer.

## AMM requirements
- Prefer a widely audited constant-product implementation or another mature audited AMM architecture.
- Factory, router, pair/pool contracts must be source-verified.
- Protocol fee configuration must be explicit and public.
- Emergency controls, if any, must be narrowly scoped and disclosed.
- No hidden admin capability to alter user balances or pool reserves.

## Liquidity policy
- Treasury liquidity may only be added after explicit approval of amount, source wallet, counter-asset, target pool, and lock/vesting policy.
- Initial price must arise from the ratio of assets deposited into the pool and subsequent real trading.
- Never fabricate wash trading, circular trades, fake accounts, spoof orders, or synthetic volume.
- Publish pool reserves and liquidity-wallet provenance.
- Consider time-locking or policy-locking a material portion of protocol-owned liquidity where appropriate.

## Market metadata
- Name: KriptoAman
- Symbol: KAM
- Native decimals: 18
- Chain ID: 22028 / 0x560c
- Website: https://kriptoaman.com
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Genesis supply reference: 1,000,000,000 KAM, subject to canonical chain state and published tokenomics
- Consensus: QBFT

## Launch gates
Trading must remain disabled until all are true:
- [ ] RPC verified live and stable
- [ ] Explorer synchronized
- [ ] 4-validator health reviewed
- [ ] Chain ID collision review complete
- [ ] WKAM source reviewed and tested
- [ ] WKAM deployed and explorer-verified
- [ ] Counter-asset provenance verified
- [ ] AMM contracts reviewed and tested
- [ ] AMM contracts deployed and explorer-verified
- [ ] Liquidity amount/source approved explicitly
- [ ] Pool created with real reserves
- [ ] Buy/sell smoke tests completed with small real transactions
- [ ] Public risk/liquidity disclosures published
- [ ] Listing metadata package complete

## Price integrity
KAM has no legitimate live market price until a real public market exists. Any internal scenario value must remain clearly labelled as non-market and must never be submitted as a live exchange price.

# KAM DEX V2 Release Authorization Template

Status: **NOT AUTHORIZED / TEMPLATE ONLY**

This document defines the minimum approvals required before any KAM DEX V2 deployment or first liquidity transaction. Completing this template does not override the external audit or quote-asset gates.

## 1. External audit gate

- Auditor / organization:
- Attributable report URL / hash:
- Reviewed source commit:
- KAMFactoryV2 blob SHA:
- KAMRouterV2 blob SHA:
- KAMPair blob SHA:
- Canonical WKAM source/runtime reference:
- Critical findings remaining: 0 required
- High findings remaining: 0 required
- Fund-safety / launch-integrity Medium findings remaining: 0 unless explicitly accepted with written controls
- Fix review completed: yes / no
- Written deployment GO: yes / no
- Written small-canary-liquidity GO: yes / no

## 2. pairCreator authorization

The `pairCreator` should be an approved multisig or similarly controlled address. Do not silently use a single EOA.

- pairCreator address:
- Control mechanism / wallet type:
- Required threshold:
- Authorized signers / roles recorded in internal governance record: yes / no
- Address independently checksum-verified: yes / no
- Test transaction / operational readiness confirmed: yes / no

## 3. Deployment authorization

- Target chain: KAM Mainnet
- Chain ID: 22028
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Exact compiler version:
- Optimizer settings:
- EVM version: Paris
- Maximum KAM approved for deployment gas:
- Deployment signer / multisig:
- Approved execution date/time window:
- FactoryV2 expected constructor arg (`pairCreator`):
- RouterV2 expected constructor args (`factory`, `WKAM`):

Deployment is **gas-only**. No pair creation or liquidity is included in deployment authorization.

## 4. Post-deployment attestation

Required before proceeding:

- FactoryV2 address:
- FactoryV2 deployment tx:
- RouterV2 address:
- RouterV2 deployment tx:
- Deployment block(s):
- Runtime bytecode exact-match evidence:
- Router `factory()` binding verified: yes / no
- Router `WKAM()` binding verified: yes / no
- Factory `pairCreator()` binding verified: yes / no
- Factory `permissionlessPairCreation()` = false: yes / no
- Factory `allPairsLength()` = 0: yes / no
- Explorer visibility verified: yes / no
- Public deployment manifest committed: yes / no

Any mismatch => **HOLD**.

## 5. Counter-asset authorization

- Provider / issuer:
- Asset symbol:
- Origin network:
- Destination KAM Mainnet contract:
- Decimals:
- Provenance / bridge documentation:
- Mint-burn or escrow model verified:
- Withdrawal-to-origin successfully tested:
- External reviewer accepts bridge assumptions: yes / no

No locally-created asset may be presented as canonical USDC, USDT, WETH, or another issuer-backed asset.

## 6. First pair authorization

- Exact approved pair:
- token0 / token1 ordering verified:
- Pair creator transaction signer:
- Factory still controlled (`permissionlessPairCreation=false`): yes / no
- Pre-state `allPairsLength`:
- Expected pair count after creation:
- Pair deployment/runtime verified:
- Initial reserves = 0 / 0: yes / no
- Unexpected prior pair/history absent: yes / no

Any unexpected state => **ABORT / HOLD**.

## 7. Canary liquidity authorization

- Exact pair address:
- Max token A amount:
- Max token B amount:
- Minimum token A amount:
- Minimum token B amount:
- Transaction deadline:
- LP recipient:
- Treasury signer / multisig:
- Maximum approved value at risk:

Only the approved small canary amount may be seeded.

## 8. Activation gate

Connect Wallet and Swap remain disabled until:

- audited contracts are deployed and attested;
- legitimate counter-asset route is verified;
- small canary liquidity is seeded under authorization;
- wrap/unwrap succeeds;
- add/remove liquidity succeeds;
- buy and sell both directions succeed;
- slippage/minimum and deadline protections are observed;
- reserves, balances, receipts, RPC, and explorer are consistent;
- counter-asset can be withdrawn back to its origin network;
- no unresolved Critical/High finding exists.

Only after all items pass may a separate production activation decision be recorded.

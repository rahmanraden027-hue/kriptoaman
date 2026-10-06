# Phase 16G — ZVQ Production Registry & Liquidity Readiness Package

**Status:** PREPARED ON ISOLATED BRANCH / DO NOT MERGE DURING PHASE 16F COLLECTION

## Objective

Prepare the complete ZEVARYQ/ZVQ registry, exchange, asset-indexing, supply, and liquidity evidence package without changing live production or interrupting the Phase 16F 24H/72H stability window.

## Canonical production identity

- Network: ZEVARYQ Mainnet
- Native asset: ZEVARYQ
- Symbol: ZVQ
- Chain ID: 22028
- Hex: `0x560c`
- Decimals: 18
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`

KAM remains a legacy identity reference where historical records require it. Phase 16G does not rewrite chain history.

## Supply migration policy

The historical KAM Tokenomics v1 project baseline is:

- maximum-supply proposal: 1,000,000,000 KAM;
- target initial circulation: 50,000,000 KAM.

The new ZVQ migration target prepared in Phase 16G is:

- maximum-supply project baseline: 1,000,000,000 ZVQ;
- proposed initial circulating target: 70,000,000 ZVQ (7%).

This is a **policy proposal pending governance and on-chain reconciliation**. It is not yet a verified circulating-supply claim. Before the change becomes canonical externally, production genesis/on-chain state, allocation wallets, lock/vesting evidence, and unlocked balances must be reconciled.

## Asset-indexing position

Available production artwork:

- ZVQ — available;
- zBTC — available;
- zETH — available.

Pending logo/indexing:

- zUSDT;
- zUSDC;
- zBNB;
- zSOL;
- zTRX;
- zXRP;
- zADA;
- zDOGE.

The zUSD artwork remains in the repository only as legacy material and is explicitly classified `DEPRECATED_DO_NOT_INDEX`.

No planned wrapped/backed asset has a production contract address in Phase 16G. No planned asset is executable.

## Liquidity readiness

Candidate markets are prepared for:

- ZVQ/USDT;
- ZVQ/USDC;
- ZVQ/BTC;
- ZVQ/ETH.

They remain planning entries only. Liquidity amount, pool address, transaction hash, and project-declared price are intentionally empty.

Liquidity execution requires, at minimum:

1. Phase 16F long-run stability acceptance;
2. supply reconciliation;
3. allocation/vesting evidence;
4. quote-asset provenance and backing;
5. verified WZVQ/Factory/Router deployment;
6. independent contract-review clearance;
7. treasury/custody evidence;
8. approved maximum pilot liquidity;
9. gas estimation;
10. small wrap/unwrap, liquidity, buy, and sell smoke tests;
11. published pool addresses and transaction evidence;
12. wallet production registry update.

## Market integrity

Phase 16G prohibits wash trading, fabricated volume, artificial price support, and project-declared market prices. Price, volume, liquidity, and market-cap values must originate from genuine verifiable market activity.

## Merge policy

This package is intentionally isolated from `main` while Phase 16F is collecting. It should be reviewed now and merged only after:

- the applicable long-run stability checkpoint is accepted;
- the supply-policy reconciliation is complete;
- any final registry values are backed by evidence.

## Protected boundary

Phase 16G does not deploy contracts, create pools, transfer treasury assets, mint quote assets, change genesis, modify validators/private keys/balances/supply, change DNS, alter consensus, or enable RPC write/admin/debug access.

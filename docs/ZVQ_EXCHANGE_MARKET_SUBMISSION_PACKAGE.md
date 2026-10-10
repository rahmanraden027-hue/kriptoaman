# ZVQ Exchange & Market-Data Submission Package — Phase 16G

**Status:** PREPARED / NOT AUTHORIZED FOR FINAL SUBMISSION

## Canonical network identity

- Network: ZEVARYQ Mainnet
- Native asset: ZEVARYQ
- Symbol: ZVQ
- Chain ID: 22028
- Hex Chain ID: `0x560c`
- Decimals: 18
- EVM compatible: Yes
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Website: https://kriptoaman.com
- Canonical HTTPS mark: https://kriptoaman.com/brand/zevaryq-mark.svg

## Supply package

The project economic baseline historically used a maximum-supply proposal of **1,000,000,000 KAM** and a target initial circulation of **50,000,000 KAM**.

Phase 16G prepares the ZEVARYQ migration policy with:

- Project maximum-supply baseline: **1,000,000,000 ZVQ**
- Proposed ZVQ initial circulating target: **70,000,000 ZVQ (7%)**
- Current verified circulating supply: **NOT YET VERIFIED**
- Current verified total supply: **NOT YET VERIFIED**
- Technically enforced maximum supply: **NOT YET VERIFIED ON-CHAIN**

The 70,000,000 ZVQ figure is a **new migration target**, not a claim that 70,000,000 ZVQ is currently circulating. It must not be entered into an exchange, CoinGecko, CoinMarketCap, wallet registry, or public market feed as current circulating supply until unlocked balances, allocation wallets, vesting/lock evidence, and final genesis/on-chain state are reconciled.

The historical KAM sources also contain **two different allocation baselines**. This drift must be resolved by a versioned ZVQ governance decision before final supply/allocation submission. The archived 70M KAM liquidity allocation is not evidence that 70M ZVQ is circulating.

## Identity migration statement

ZEVARYQ Mainnet is the production identity for the existing Chain ID 22028 network. The identity migration from KriptoAman/KAM to ZEVARYQ/ZVQ is designed as an in-place network identity continuation and does not by itself alter genesis, historical balances, addresses, validator keys, or block history.

## Market-data submission rules

Do not submit unsupported values for:

- current price;
- 24-hour volume;
- circulating market capitalization;
- fully diluted valuation;
- exchange-listing date;
- active trading pairs;
- liquidity amount.

These fields may only be populated from independently verifiable market/on-chain evidence.

## Candidate first markets

The following are **candidate markets only** and are not active-market claims:

- ZVQ/USDT
- ZVQ/USDC
- ZVQ/BTC
- ZVQ/ETH

Each quote asset requires exact destination-chain contract identity, bridge/issuer provenance, custody/backing evidence, and explorer-verifiable deployment before pool creation.

## Logo & asset-indexing status

- ZVQ: canonical HTTPS mark available.
- zBTC: artwork available; token deployment/provenance pending.
- zETH: artwork available; token deployment/provenance pending.
- zUSDT: logo/indexing pending; issuer/bridge provenance pending.
- zUSDC: logo/indexing pending; issuer/bridge provenance pending.
- zBNB: logo/indexing pending.
- zSOL: logo/indexing pending.
- zTRX: logo/indexing pending.
- zXRP: logo/indexing pending.
- zADA: logo/indexing pending.
- zDOGE: logo/indexing pending.
- zUSD: deprecated from the current production plan; legacy artwork must not be submitted as an approved production asset.

## Final submission gate

Final external submission remains blocked until:

1. Phase 16F reaches `LONG_RUN_STABLE` or an explicitly accepted warning variant.
2. ZVQ maximum/total/circulating supply is reconciled against production evidence.
3. Allocation wallet and vesting/lock methodology is published.
4. Canonical ZVQ logo is accepted by the targeted upstream registry or its required immutable asset path is ready.
5. Any submitted quote-asset contract is explorer verified with issuer/bridge/backing provenance.
6. Real market pairs exist if price/volume fields are requested.
7. Treasury/liquidity evidence is complete.
8. No unsupported claim of exchange acceptance, market price, volume, liquidity, or circulating supply is present.

**FINAL_SUBMISSION_AUTHORIZED = false**

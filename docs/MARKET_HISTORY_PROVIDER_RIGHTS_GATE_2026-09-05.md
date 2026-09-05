# Market History Provider Rights Gate — 2026-09-05

Status: **HOLD — production historical ingestion/backfill is not authorized**

Scope: KriptoAman historical OHLCV/time-series Phase 1, initially mapped to CoinGecko provider asset IDs.

This record is a technical/compliance release gate, not legal advice. It records what can and cannot be concluded from the currently published provider terms. Production ingestion remains disabled until the required rights are evidenced for the actual KriptoAman subscription/account.

## Current implementation state

- OHLCV Phase 1 storage/query contract merged in PR #457.
- Merge commit: `23eefa509e4e560be54a9fcfffb98575b7bfe5c1`.
- Versioned D1 migration source exists as `migrations/0007_market_timeseries.sql`.
- Read-only `/api/market-history` source is persisted-storage-only and does not fetch upstream on customer GET requests.
- No production backfill/ingest job is authorized by PR #457.
- No historical coverage may be claimed solely because migration/API source exists.

## Published CoinGecko terms reviewed

Reviewed 2026-09-05:

1. CoinGecko API Terms of Service — https://www.coingecko.com/en/api_terms
2. CoinGecko API pricing / license summary — https://www.coingecko.com/en/api/pricing
3. CoinGecko support: Commercial vs Custom Licenses — https://support.coingecko.com/hc/en-us/articles/16760512207257-What-Are-the-Differences-Between-Commercial-and-Custom-Licenses
4. CoinGecko enterprise data licensing — https://www.coingecko.com/en/api/enterprise/data-license

## Rights matrix

| Intended use | Current public-terms evidence | Gate decision |
| --- | --- | --- |
| Incorporate CoinGecko API into a KriptoAman application | API Terms provide a limited license subject to plan and terms | CONDITIONAL — actual plan must be evidenced |
| Charge for a KriptoAman product that incorporates API data | Standard commercial license documentation says monetization is permitted | CONDITIONAL — attribution/plan requirements remain |
| Public display inside KriptoAman | Commercial plans require prominent `Data provided by CoinGecko` attribution and link | CONDITIONAL — UI attribution must be implemented before using CoinGecko data under that license |
| Server-side caching/storage | Terms state caching/storage is not encouraged; if necessary, cache should be refreshed at least every 24 hours and stored data protected with strong security | CONDITIONAL — storage purpose, retention and actual plan must be reviewed |
| Multi-year historical retention in KriptoAman D1 | Public terms do not provide sufficiently explicit evidence here for the proposed multi-year historical warehouse | HOLD |
| Derive/downsample 1h data into 4h/1d series and retain it | Public terms reviewed do not provide sufficiently explicit permission for this planned persistent derived-data use | HOLD |
| Redistribute raw CoinGecko data through a KriptoAman API | Standard commercial license documentation expressly prohibits resale/re-distribution/syndication of API/raw data | HOLD — custom/enterprise rights or explicit written permission required |
| Offer enterprise/customer data feeds derived from CoinGecko | Could constitute redistribution depending on implementation | HOLD — provider confirmation/custom license required |
| Remove CoinGecko attribution / white-label provider data | Support documentation identifies white-labeling as custom-license territory | HOLD unless custom license permits it |

## Important storage conditions from public terms

Where caching/storage is used, the published API Terms state that cache should be refreshed at least every 24 hours and that strong encryption/security measures should be applied to stored data. The terms also contain broader restrictions on duplication, reproduction, storage and derivation except where expressly permitted. Because the planned KriptoAman design includes long-term historical retention and possible derived/downsampled datasets, the public text alone is not treated as sufficient authorization for production backfill.

## Required evidence before enabling historical ingestion

At least one of the following must be recorded for the actual KriptoAman account:

1. A CoinGecko plan/license whose current terms explicitly permit the exact intended storage/display/derivation use; or
2. An executed custom/enterprise data license covering the intended use; or
3. Written provider confirmation that specifically addresses the KriptoAman use case.

The evidence should address:

- commercial public display;
- required attribution;
- server-side caching;
- historical retention duration;
- persistent storage of provider-native OHLCV;
- derived aggregation/downsampling;
- internal analytics;
- public API exposure or redistribution;
- enterprise/customer-facing data feeds;
- deletion/termination obligations;
- applicable rate/call limits.

## Release flags

- `PRODUCTION_D1_MIGRATION_VERIFIED = false`
- `PROVIDER_PLAN_EVIDENCED = false`
- `HISTORICAL_STORAGE_RIGHTS_CONFIRMED = false`
- `DERIVED_DATA_RIGHTS_CONFIRMED = false`
- `REDISTRIBUTION_RIGHTS_CONFIRMED = false`
- `PRODUCTION_BACKFILL_AUTHORIZED = false`
- `PUBLIC_HISTORY_API_COVERAGE_VERIFIED = false`
- `CUSTOMER_UI_MIGRATION_AUTHORIZED = false`

## Safe next action

Prepare a precise provider-rights inquiry describing the intended KriptoAman architecture without sending or enabling ingestion yet. After written/provider-plan evidence is received, update this gate record, apply/verify the D1 migration through an authenticated Cloudflare path, run a deliberately small provenance-preserving backfill, verify gaps/pagination/retention behavior, and only then consider broader population and UI migration.

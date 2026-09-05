# KAM Market-Data Listing Preflight — 2026-09-05

Purpose: prepare KAM for CoinGecko and CoinMarketCap without submitting unsupported market claims.

## Current external search status

As of 2026-09-05, searches for `KriptoAman` / KAM do not resolve to an existing KriptoAman asset entry in CoinGecko or CoinMarketCap. Similar ticker matches belong to unrelated projects and must not be selected or reused.

## CoinGecko

Official current prerequisite for a new cryptocurrency listing: the cryptocurrency must be actively tradable on an exchange tracked by CoinGecko.

**Current KAM disposition: cryptoasset listing HOLD until a legitimate tracked market exists.**

Required evidence before submission:

- [ ] KAM is publicly tradable on at least one CoinGecko-tracked exchange/venue.
- [ ] Market pair is real and accessible to the public under the venue's rules.
- [ ] Deposit/withdrawal network identity has been technically verified by the venue where applicable.
- [ ] Price and volume are venue-observed; no project-declared or synthetic market values.
- [ ] Website, explorer, RPC, docs and canonical registry references remain reachable.
- [ ] Current supply fields are reconciled to final on-chain/genesis evidence.
- [ ] Official-project verification post is available if requested.

Do not use self-swaps, wash trades, circular treasury transfers, fake stablecoins or fabricated liquidity to satisfy listing requirements.

## CoinMarketCap

CoinMarketCap's official Request Form provides `[New Listing] Add cryptoasset`.

Submission package is technically prepared, but the following must be independently verifiable before they are represented as current facts:

- [ ] circulating supply;
- [ ] total/max supply where applicable;
- [ ] active market pair(s);
- [ ] observed price;
- [ ] observed volume;
- [ ] exchange/venue status;
- [ ] final public-mainnet status if claimed.

Target tokenomics values are planning baselines and must not be entered as measured circulating supply unless final chain state proves them.

## Canonical identity block

- Name: KriptoAman / KAM
- Network: KriptoAman Mainnet
- Symbol: KAM
- Chain ID: 22028 (`0x560c`)
- Decimals: 18
- EVM compatible: yes
- Website: https://kriptoaman.com
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Docs: https://kriptoaman.com/KAMNetworkDocs
- Tokenomics: https://kriptoaman.com/KAMTokenomics
- GitHub: https://github.com/rahmanraden027-hue/kriptoaman
- Canonical chain registry: https://github.com/ethereum-lists/chains/blob/master/_data/chains/eip155-22028.json
- Canonical icon registry: https://github.com/ethereum-lists/chains/blob/master/_data/icons/kriptoaman.json

## Correct sequence

1. close KAM public-mainnet promotion evidence;
2. close independent DEX/security review before public DEX use;
3. establish any legitimate external market only after venue, legal/compliance and technical integration review;
4. collect real market and supply evidence;
5. submit CoinGecko when its tracked-exchange prerequisite is satisfied;
6. submit/update CoinMarketCap using only independently verifiable current data;
7. archive ticket/request IDs and public acceptance evidence.

# KAM Public Listing Submission Pack

Status: **Prepared for submission / network remains mainnet-candidate-not-public until Issue #115 readiness gates pass.**

This document is the canonical copy-paste package for public registry, wallet, market-data and exchange submissions. It must not be used to claim a final public mainnet, official wallet listing, exchange listing, market price, circulating supply, liquidity, or regulatory approval that has not been independently verified.

## Canonical network identity

- Project: KriptoAman
- Network: KriptoAman Mainnet
- Native asset: KAM
- Chain ID (decimal): 22028
- Chain ID (hex): `0x560c`
- Decimals: 18
- EVM compatible: Yes
- Consensus target: QBFT
- Validator target: 4 production validators
- Website: https://kriptoaman.com
- Public RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Network documentation: https://kriptoaman.com/KAMNetworkDocs
- RPC privacy policy: https://kriptoaman.com/RPCPrivacyPolicy
- Tokenomics: https://kriptoaman.com/KAMTokenomics
- GitHub: https://github.com/rahmanraden027-hue/kriptoaman
- Chainlist PR: https://github.com/DefiLlama/chainlist/pull/3089
- ethereum-lists/chains PR: https://github.com/ethereum-lists/chains/pull/8639

## Canonical project description

### One-line description

KriptoAman is an EVM-compatible blockchain network and digital-asset infrastructure ecosystem using KAM as its native network asset.

### Short description

KriptoAman Mainnet is an EVM-compatible network designed for digital-asset infrastructure, wallet interoperability, public RPC access, explorer transparency and application development. KAM is the native asset used by the network. The current publication process is gated by technical readiness evidence, including Chain ID verification, continuous block production, RPC/explorer alignment, validator evidence, backup/restore validation, uptime/latency monitoring and a final public Chain ID collision check.

### Neutral extended description

KriptoAman is developing an EVM-compatible blockchain network with KAM as its native network asset. The network uses Chain ID 22028 (`0x560c`) and is designed to support standard EVM-compatible tooling, wallet connectivity, public JSON-RPC access, explorer indexing and application development.

The project publishes canonical network metadata, RPC privacy information and tokenomics documentation through its official website and public GitHub repository. Public RPC security controls are designed to prevent exposure of sensitive administrative and node-management namespaces. Network-readiness evidence is evaluated independently from listing or market activity and includes block progression, RPC and explorer alignment, validator-set evidence, backup/restore testing and uptime/latency monitoring.

KAM is intended to function as the native asset of the KriptoAman network. The current tokenomics baseline uses a proposed maximum supply of 1,000,000,000 KAM and a target initial circulating supply of 50,000,000 KAM (5%). These supply figures must be reconciled against final on-chain/genesis state before being represented externally as verified circulating or maximum-supply data.

KriptoAman does not treat a manually added custom network, an open pull request, or an application under review as an official public listing. Official registry, wallet, market-data and exchange status is determined by the relevant third-party maintainers or platforms.

## CoinGecko — Chain / Asset Platform submission fields

- Chain name: KriptoAman Mainnet
- Native currency name: KAM
- Native currency symbol: KAM
- Chain ID: 22028
- EVM compatible: Yes
- Website: https://kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Public RPC: https://rpc.kriptoaman.com
- Network docs: https://kriptoaman.com/KAMNetworkDocs
- Tokenomics: https://kriptoaman.com/KAMTokenomics
- Chainlist reference: https://github.com/DefiLlama/chainlist/pull/3089
- GitHub: https://github.com/rahmanraden027-hue/kriptoaman
- Project description: use the neutral extended description above.
- Logo: use the canonical KriptoAman/KAM network logo only; do not substitute unofficial artwork.
- Verification post: **REQUIRED BEFORE FINAL SUBMISSION IF REQUESTED BY COINGECKO. Publish from an official project social account and retain the public URL.**

Submission note:

> KriptoAman Mainnet is being submitted as an EVM-compatible asset platform / chain. Network readiness and public listing status are treated separately. No request is being made to display an unsupported market price.

## CoinMarketCap — Chain submission fields

- Network/project name: KriptoAman Mainnet
- Native asset: KAM
- Ticker: KAM
- Chain ID: 22028 (`0x560c`)
- EVM compatible: Yes
- Website: https://kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- RPC: https://rpc.kriptoaman.com
- Documentation: https://kriptoaman.com/KAMNetworkDocs
- Tokenomics: https://kriptoaman.com/KAMTokenomics
- GitHub: https://github.com/rahmanraden027-hue/kriptoaman
- Relationship to project: Official project representative / project owner
- Description: use the neutral extended description above.

Submission note:

> KAM is the native asset of KriptoAman Mainnet. This chain submission does not claim that KAM currently has a tracked public market price or exchange liquidity.

## CoinMarketCap / CoinGecko — Cryptoasset fields (hold until independently verifiable)

The following may be prepared but must **not** be represented as verified until public evidence exists:

- Maximum supply baseline: 1,000,000,000 KAM
- Target initial circulating supply: 50,000,000 KAM
- Current circulating supply: **DO NOT FILL FROM TARGET; calculate from unlocked on-chain balances.**
- Current total supply: **VERIFY ON-CHAIN / GENESIS BEFORE SUBMISSION.**
- Market pairs: **ONLY REAL ACTIVE MARKETS.**
- Price: **ONLY OBSERVED MARKET PRICE FROM A SUPPORTED VENUE.**
- 24h volume: **ONLY REAL VOLUME.**
- Exchange listing date: **ONLY AFTER ACTUAL LISTING.**
- TGE/genesis date: **USE THE FINAL PUBLICLY VERIFIABLE DATE.**

## Tokenomics baseline

- Maximum supply proposal: 1,000,000,000 KAM
- Target initial circulating supply: 50,000,000 KAM (5%)

Allocation:

| Category | Share | KAM |
| --- | ---: | ---: |
| Ecosystem & Network Development | 30% | 300,000,000 |
| Community & Adoption | 20% | 200,000,000 |
| Validator / Network Incentives | 15% | 150,000,000 |
| Treasury / Foundation | 15% | 150,000,000 |
| Team & Contributors | 10% | 100,000,000 |
| Liquidity & Market Development | 7% | 70,000,000 |
| Strategic Partnerships | 3% | 30,000,000 |
| **Total** | **100%** | **1,000,000,000** |

Team vesting baseline: 12-month cliff, then 36-month vesting.

## US$29 scenario policy

US$29/KAM is an **indicative valuation scenario only**. It must never be entered into CoinGecko, CoinMarketCap, an exchange or a wallet as if it were the current market price unless an independent supported market actually produces that price.

Hypothetical scenario math only:

- 50,000,000 KAM × US$29 = US$1.45 billion hypothetical circulating market capitalization.
- 1,000,000,000 KAM × US$29 = US$29 billion hypothetical fully diluted valuation.

## Exchange integration submission package

Use this only for venues willing to review a native EVM-compatible chain.

- Asset name: KAM
- Network: KriptoAman Mainnet
- Chain ID: 22028 (`0x560c`)
- Decimals: 18
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Website: https://kriptoaman.com
- Network docs: https://kriptoaman.com/KAMNetworkDocs
- Tokenomics: https://kriptoaman.com/KAMTokenomics
- GitHub: https://github.com/rahmanraden027-hue/kriptoaman
- Deposit/withdrawal model: native KAM on KriptoAman Mainnet; exchange integration requires independent technical review.
- Preferred first market if accepted: KAM/USDT.

Exchange application statement:

> KriptoAman requests technical and listing review for KAM as the native asset of KriptoAman Mainnet. We do not request the venue to use fabricated volume, artificial liquidity or a project-declared market price. Deposit, withdrawal and market activation should occur only after the venue independently validates the network, wallet integration and operational controls.

## Wallet / registry metadata

- Name: KriptoAman Mainnet
- Short name: KriptoAman
- Native currency: KAM
- Decimals: 18
- Chain ID: 22028
- Hex: `0x560c`
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Website: https://kriptoaman.com

Manual custom-network support must not be described as official wallet listing.

## Readiness gate before final-public-mainnet wording

Do not replace `mainnet-candidate-not-public` wording with final-public-mainnet language until Issue #115 evidence gates are complete. At minimum, confirm:

1. 24 consecutive UTC hourly buckets with valid `ready=true` evidence;
2. correct Chain ID `0x560c`;
3. continuous block progression;
4. healthy and aligned RPC/explorer;
5. sensitive namespaces blocked;
6. four-validator production evidence remains valid;
7. backup/restore evidence remains valid;
8. uptime/latency monitoring shows no regression;
9. final public Chain ID collision check is complete;
10. final docs/logo/verification channels are public.

## Submission control checklist

Before sending any external form:

- [ ] Verify each public URL resolves successfully.
- [ ] Verify current Chainlist/ethereum-lists PR status.
- [ ] Confirm logo is canonical and high resolution.
- [ ] Confirm no unsupported claim of official wallet/registry acceptance.
- [ ] Confirm no project-declared market price is entered as observed price.
- [ ] Confirm supply fields are reconciled to on-chain evidence if marked verified.
- [ ] Confirm market pair/volume data are real and independently visible.
- [ ] Retain submission reference/ticket ID after sending.

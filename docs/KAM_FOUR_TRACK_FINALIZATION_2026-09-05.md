# KAM Four-Track Finalization — 2026-09-05

Status: **parallel execution active; external acceptance and infrastructure evidence remain authoritative.**

This record coordinates the fastest safe closure path for four workstreams: KAM public-mainnet promotion, KAM DEX independent review, wallet/network discovery, and CoinGecko/CoinMarketCap readiness. It does not convert an external review, wallet acceptance, exchange market, or market-data listing into an internal claim.

## Track 1 — KAM public-mainnet promotion

Canonical Chain ID: `22028` (`0x560c`)
Native asset: `KAM`, 18 decimals
RPC: `https://rpc.kriptoaman.com`
Explorer: `https://explorer.kriptoaman.com`

### Verified gates

- public RPC/explorer evidence: PASS
- private QBFT validator set: 4/4 PASS
- backup/restore evidence: PASS
- hourly external monitoring: ACTIVE
- final Chain ID collision review against canonical ethereum-lists/chains: PASS
- final docs/logo/official verification channels: PASS

### Remaining hard gates

1. **Four distinct persistent production validator hosts** — must be evidenced from the actual production infrastructure; repository configuration alone is insufficient.
2. **Dedicated protected RPC origin/sentry** — must show the Cloudflare-facing origin is separate/protected and validator admin/RPC ports are not publicly exposed.
3. **24 consecutive hours of passing continuity evidence** — requires time-based block-production/RPC/explorer evidence and cannot be shortened or backfilled with fabricated samples.

Promotion rule: keep `mainnet-candidate-not-public` until all three remaining gates are independently evidenced. Once they are true, update the readiness manifest and Issue #115 in one reviewed change before any final-public-mainnet wording.

## Track 2 — KAM DEX independent security review

Current disposition: **AUDIT-READY / PRODUCTION HOLD**.

Frozen review scope is tracked in Issue #441 and includes:

- `KAMFactoryV2.sol`
- `KAMPairV2.sol`
- `KAMRouterV2.sol`
- canonical `WKAM.sol`

Canonical WKAM deployment record:

- address: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Chain ID: 22028
- deployment block: 240024
- recorded state: deployed and wrap/unwrap tested

External GO must include attributable reviewer identity/team, independence statement, exact commit/blob scope, methodology, severity-ranked findings, remediation/re-review status, and an explicit disposition for a deliberately small controlled canary.

Until that evidence exists, the following remain disabled: public Swap, treasury liquidity movement, production pool seeding, and any `KAM DEX live` claim.

## Track 3 — Wallet and network discovery

### Already achieved

- `ethereum-lists/chains` PR #8639 is merged.
- Canonical upstream metadata identifies Chain ID 22028 as KriptoAman Mainnet, native KAM, RPC, explorer, and icon.
- Canonical logo is published through the upstream icon registry/IPFS.
- MetaMask can add the network through custom EVM network metadata / chainid.network because the canonical EVM registry entry exists.

### External acceptance lanes

**MetaMask**

Treat chainid.network/custom-network compatibility as working network access, not as a claim that KAM is preloaded in every MetaMask installation. Wider native presentation is controlled by MetaMask.

**Trust Wallet**

Trust Wallet's current developer documentation states that new blockchain support requires a positive Business Development decision before Wallet Core integration work. For KAM, the correct lane is therefore new-chain/business-development review, not an ERC-20 token submission.

**Coinbase Onchain Wallet**

Coinbase documents local custom EVM network configuration for unsupported networks, but locally configured networks are not equivalent to Coinbase-supported network status. KAM should be described as custom-network compatible only until Coinbase independently accepts the network.

**Other EVM wallets**

Use the canonical metadata pack: Chain ID 22028, symbol KAM, 18 decimals, RPC, explorer, website, canonical icon and ethereum-lists/chains reference. Each wallet controls its own acceptance/release process.

## Track 4 — CoinGecko and CoinMarketCap

### CoinGecko cryptoasset listing gate

CoinGecko's current official listing guidance requires a cryptocurrency to be **actively tradable on an exchange tracked by CoinGecko** before applying for a new cryptocurrency listing. Therefore a KAM coin listing must remain HOLD until a real supported market exists. Do not create artificial volume, self-trading, fabricated liquidity, or a project-declared market price to satisfy this gate.

The chain/network identity package can remain prepared separately from a tracked coin-market listing.

### CoinMarketCap

CoinMarketCap's official Request Form includes `[New Listing] Add cryptoasset`. A submission may be prepared using the canonical KAM identity, but supply, market pair, price and volume fields must use independently verifiable current data. Target tokenomics figures must not be represented as measured circulating supply.

### Canonical submission identity

- Project/network: KriptoAman Mainnet
- Native asset: KAM
- Symbol: KAM
- Chain ID: 22028 (`0x560c`)
- Decimals: 18
- EVM compatible: yes
- Website: `https://kriptoaman.com`
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`
- GitHub: `https://github.com/rahmanraden027-hue/kriptoaman`
- Canonical registry: `ethereum-lists/chains` entry `_data/chains/eip155-22028.json`
- Canonical icon key: `kriptoaman`

## Fastest safe execution order

The four tracks run in parallel, but the critical dependency chain is:

1. maintain public RPC/explorer and production validator evidence continuously;
2. complete the three remaining public-mainnet promotion gates;
3. obtain attributable independent DEX review and remediate any findings;
4. pursue wallet new-chain acceptance using the canonical registry evidence;
5. create a legitimate external KAM market only after applicable legal, technical, custody/deposit-withdrawal and venue review gates are satisfied;
6. submit the KAM cryptoasset to CoinGecko once it is actively traded on a CoinGecko-tracked exchange;
7. submit/update CoinMarketCap only with independently verifiable supply/market evidence.

## Non-negotiable integrity controls

- no fake stablecoin or fake quote asset;
- no wash trading or circular treasury transactions used as market evidence;
- no fabricated price, volume, TVL or circulating supply;
- no statement of external audit/listing/approval before the external party provides evidence;
- no private keys, seed phrases or validator signing secrets in GitHub, forms or support tickets.

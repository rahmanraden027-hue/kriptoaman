# CoinGecko KAM Listing Preparation Package

Status: **PREPARATION READY / NOT YET READY FOR ACTIVE LISTING SUBMISSION**

This package prepares the information required to submit KriptoAman Network as a CoinGecko asset platform and KAM as its native cryptocurrency. It intentionally separates confirmed internal candidate parameters from public claims that still require independent verification.

## 1. Project Identity

- Project: KriptoAman
- Network: KriptoAman Mainnet
- Native asset name: KriptoAman
- Symbol: KAM
- Asset type: Native cryptocurrency of KriptoAman Network
- Website: https://kriptoaman.com
- Organization: PT KRIPTO AMAN INDONESIA
- Primary positioning: crypto market intelligence, wallet monitoring/watch-only, education, security, and KAM ecosystem development

## 2. Current Network Candidate Parameters

Source: `chain/kam-mainnet/network-profile.json` on branch `chain/kam-mainnet-v1`.

- Current status: `mainnet-candidate-not-public`
- Network name: KriptoAman Mainnet
- Candidate Chain ID: `22028`
- Chain ID hex: `0x560c`
- Native currency: KAM
- Decimals: 18
- Consensus: QBFT
- Initial validator topology: 4 validators
- Target block time: 3 seconds
- Candidate genesis supply target: 1,000,000,000 KAM
- Target RPC: `https://rpc.kriptoaman.com`
- Target explorer: `https://explorer.kriptoaman.com`
- Commercial launch: disabled in current candidate profile

**Do not describe these endpoints as live/public until independently verified from outside the validator environment.**

## 3. CoinGecko Asset Platform Submission — KriptoAman Network

CoinGecko requests the following information for a new chain/asset-platform application. Prepare the final submission only after the public mainnet activation gate is passed.

### Proposed submission values

- Official chain/network name: **KriptoAman Mainnet**
- Website URL: **https://kriptoaman.com**
- Explorer: **PENDING PUBLIC VERIFICATION** — target `https://explorer.kriptoaman.com`
- Documentation / whitepaper: **PENDING PUBLICATION OF FINAL MAINNET DOCS**
- ChainList URL: **PENDING** — required/recommended once the EVM-compatible network is publicly registered
- Chain logo: **PENDING FINAL HIGH-RESOLUTION ASSET**
- Current token listings on this chain: **NONE VERIFIED YET**
- EVM-compatible: **Candidate architecture is EVM-compatible; verify at public activation**
- Native currency: **KAM**
- Chain ID: **Candidate 22028; re-check public registry collision before submission**

### Asset-platform submission gate

Do not submit until all items below are true:

- [ ] Four production validators are running on persistent production hosts.
- [ ] `eth_chainId` publicly returns `0x560c` from the official RPC.
- [ ] Blocks advance continuously for at least 24 hours.
- [ ] Public RPC is behind HTTPS, rate limiting, and a safe JSON-RPC allowlist.
- [ ] Public explorer indexes blocks, transactions, addresses, and native KAM balances correctly.
- [ ] Backup/restore test completed.
- [ ] External monitoring and incident alerts enabled.
- [ ] Chain ID 22028 collision re-check completed immediately before public activation.
- [ ] Final network documentation is publicly accessible.
- [ ] Chain logo is published in a stable high-resolution location.
- [ ] ChainList submission is completed or in progress if appropriate.

## 4. CoinGecko Cryptocurrency Submission — KAM

### Proposed identity

- Coin name: **KriptoAman**
- Ticker: **KAM**
- Native chain: **KriptoAman Mainnet**
- Token standard / contract address: **Not applicable for the native KAM asset unless wrapped/bridged versions are separately created**
- Decimals: **18**
- Website: **https://kriptoaman.com**
- Explorer: **PENDING PUBLIC VERIFICATION**
- Project category: **Layer-1 / EVM-compatible blockchain ecosystem candidate**

### Supply fields — candidate, not public-final

- Candidate genesis supply target: **1,000,000,000 KAM**
- Final total supply: **PENDING FINAL GENESIS VERIFICATION**
- Circulating supply: **NOT YET ESTABLISHED / DO NOT INVENT**
- Treasury allocation: **PENDING FINAL TOKENOMICS**
- Team allocation: **PENDING FINAL TOKENOMICS**
- Community/ecosystem allocation: **PENDING FINAL TOKENOMICS**
- Vesting schedule: **PENDING FINAL TOKENOMICS**

CoinGecko submission must use verifiable circulating-supply information. Do not submit estimates as confirmed circulating supply.

## 5. Active Listing Readiness

CoinGecko's current standard-listing prerequisite requires the cryptocurrency to be actively tradable on at least one exchange tracked by CoinGecko.

Current KAM status:

- Active CoinGecko-tracked exchange market: **NOT VERIFIED**
- Public organic liquidity: **NOT VERIFIED**
- Public KAM market price: **NOT VERIFIED**
- Confirmed CoinGecko listing: **NO**

Therefore the correct current status is:

**NOT READY FOR STANDARD ACTIVE COINGECKO LISTING.**

A public mainnet by itself is valuable infrastructure, but it does not replace CoinGecko's market-data prerequisite for standard active listing.

## 6. Preview Listing Option

If KAM has a formally scheduled Token Generation Event or public launch before active exchange trading, CoinGecko supports a Preview Listing process.

Before a Preview Listing request:

- [ ] Exact TGE/public-launch date and time are formally approved.
- [ ] The same date/time is announced on official KriptoAman channels.
- [ ] Announcement is publicly verifiable.
- [ ] Mainnet and native asset parameters are final.
- [ ] Tokenomics and supply disclosure are final.
- [ ] Team is prepared to follow the CoinGecko public-verification process.

Do not publish a speculative TGE date solely to satisfy a listing form.

## 7. Public Verification Post — Draft

Use only when the CoinGecko request is genuinely ready to be submitted.

### English draft

> KriptoAman is preparing an official request to CoinGecko for KriptoAman Network and its native asset KAM. This post is published from an official KriptoAman channel to verify that the request is authorized by the project team. Official project information: https://kriptoaman.com

If a GeckoTerminal URL exists at submission time, add it exactly as shown by CoinGecko. If no valid GeckoTerminal page exists, do not invent one.

After CoinGecko issues a request ID, reply to the original verification post with the exact request ID supplied by CoinGecko.

### Indonesian internal reference

> KriptoAman sedang mempersiapkan pengajuan resmi ke CoinGecko untuk KriptoAman Network dan aset native KAM. Postingan ini diterbitkan melalui kanal resmi KriptoAman sebagai verifikasi bahwa pengajuan tersebut berasal dari tim proyek yang berwenang. Informasi resmi proyek: https://kriptoaman.com

## 8. Suggested CoinGecko Project Description

### Short description

**KriptoAman is developing an EVM-compatible blockchain ecosystem and digital-asset intelligence platform focused on transparent market information, wallet monitoring, security, education, and auditable KAM ecosystem infrastructure. KAM is designed as the native currency of KriptoAman Mainnet.**

### Extended description

**KriptoAman is a digital-asset technology initiative developing market-intelligence, wallet-monitoring, security, education, and blockchain infrastructure. The project is preparing KriptoAman Mainnet, an EVM-compatible network candidate using QBFT consensus. KAM is intended to serve as the network's native currency. Public-mainnet activation, final supply parameters, public RPC/explorer availability, market liquidity, and exchange availability remain subject to separate technical, security, operational, and compliance readiness gates.**

This wording deliberately avoids unverified claims about exchange listings, price, liquidity, regulatory approval, or guaranteed launch timing.

## 9. Evidence Folder Checklist

Create or publish the following before submission:

- [ ] Final mainnet technical documentation
- [ ] Public RPC verification evidence
- [ ] Explorer verification evidence
- [ ] Final genesis hash / chain genesis evidence
- [ ] Validator health/status evidence without exposing private keys or sensitive topology
- [ ] Final tokenomics/supply document
- [ ] Circulating-supply methodology
- [ ] Allocation and vesting disclosure
- [ ] Official logo files and stable public image URLs
- [ ] Official social channels linked from kriptoaman.com
- [ ] Public verification post URL
- [ ] CoinGecko request ID after submission
- [ ] Exchange market URL on a CoinGecko-tracked exchange for standard active listing
- [ ] Official TGE announcement if using Preview Listing

## 10. Submission Sequence

Recommended sequence:

1. Complete and externally verify KriptoAman public mainnet.
2. Publish final network documentation and explorer/RPC endpoints.
3. Re-check Chain ID 22028 against public EVM registries.
4. Submit/add KriptoAman Network to ChainList if appropriate.
5. Prepare and submit the CoinGecko new-chain / asset-platform request.
6. Finalize KAM tokenomics, allocation, vesting, and circulating-supply methodology.
7. If KAM is not yet actively traded, consider Preview Listing only with a real, announced TGE.
8. For standard active listing, establish a legitimate market on an exchange already tracked by CoinGecko.
9. Publish the CoinGecko public verification post from an official social account linked from kriptoaman.com.
10. Submit the CoinGecko coin request and reply to the verification post with the issued Request ID.
11. Track review status and respond to any Action Needed requests with verifiable evidence.

## 11. Submission Safety Rules

- Never claim CoinGecko approval before CoinGecko publishes/approves the listing.
- Never fabricate exchange volume, liquidity, circulating supply, TGE date, or market price.
- Never expose validator private keys, treasury keys, mnemonics, or production keystores in submission evidence.
- Do not describe KAM Points as on-chain KAM or as a guaranteed token entitlement.
- Do not use the internal indicative price target as a confirmed listing price.
- Keep public website, documentation, explorer data, social posts, and submission fields mutually consistent.

## 12. Current Decision

**KriptoAman Network package preparation: READY.**

**KriptoAman Network Asset Platform submission: WAIT FOR PUBLIC MAINNET VERIFICATION.**

**KAM Preview Listing: POSSIBLE ONLY AFTER A REAL, VERIFIED TGE DATE IS FORMALLY PUBLISHED.**

**KAM Standard Active Listing: WAIT FOR ACTIVE TRADING ON A COINGECKO-TRACKED EXCHANGE AND FINAL PUBLIC SUPPLY DATA.**

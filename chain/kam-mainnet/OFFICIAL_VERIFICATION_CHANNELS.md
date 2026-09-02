# KAM Mainnet — Official Verification Channels

Status: **CANONICAL PUBLIC REFERENCES / MAINNET PROMOTION STILL GATED**

This document defines the public references that should be used to verify KriptoAman and KAM Mainnet metadata. Publication of these references does **not** by itself promote KAM Mainnet from `mainnet-candidate-not-public` to final public-mainnet status. Issue #115 remains the authoritative promotion gate.

## Canonical network identity

- Network: KriptoAman Mainnet
- Native asset: KAM
- Chain ID: `22028` (`0x560c`)
- Decimals: 18
- Website: https://kriptoaman.com
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Public repository: https://github.com/rahmanraden027-hue/kriptoaman
- Research paper: https://kriptoaman.com/research/kam-mainnet-architecture

## Canonical logo and brand assets

- Public PNG: https://kriptoaman.com/icons/kriptoaman-512.png
- Public SVG mark: https://kriptoaman.com/brand/kriptoaman-mark.svg
- Canonical icon key: `kriptoaman`
- Canonical IPFS URI: `ipfs://bafkreicorcwbkyjyw3rdbvuxfpw7bvrf74nsp4vaakclaoh6a67enzd36a`
- ethereum-lists icon metadata: `_data/icons/kriptoaman.json`

The repository contains the 512×512 PNG and the SVG mark. The upstream `ethereum-lists/chains` registry also publishes the `kriptoaman` icon metadata using the IPFS URI above.

## Official KriptoAman communication channels

These are the canonical channel URLs published by KriptoAman website source and footer metadata:

- X: https://x.com/KriptoAman
- TikTok: https://www.tiktok.com/@kriptoamanofficial
- Instagram: https://www.instagram.com/kriptoamanofficial/
- YouTube: https://www.youtube.com/@KriptoAmanOfficial
- Official contact: hello@kriptoaman.com

A social-platform badge, blue check, business-verification state, follower count, or platform endorsement must **not** be inferred from inclusion in this list. Those are separate third-party states and must be verified directly with the relevant platform before being claimed.

## External registry evidence

### ethereum-lists/chains

PR #8639 (`Add KriptoAman Mainnet (Chain ID 22028)`) was merged on 2026-08-25. The canonical upstream file `_data/chains/eip155-22028.json` identifies Chain ID 22028 as KriptoAman Mainnet and currently contains RPC, explorer, native KAM metadata, icon key `kriptoaman`, and registry status `active`.

The upstream registry status is **metadata-directory state**, not proof that every KriptoAman operational promotion gate has completed.

### DefiLlama chainlist

PR #3089 was closed on 2026-08-28 without `merged_at` evidence. It must therefore be treated as **not verified merged** unless a later canonical DefiLlama source independently shows KAM Mainnet present.

## Source-of-truth hierarchy

For public verification, use this order:

1. KriptoAman production-readiness evidence and Issue #115 for operational promotion status.
2. This repository for canonical network configuration and verification references.
3. `ethereum-lists/chains` for canonical public EVM registry metadata.
4. KriptoAman website, RPC, explorer, research and official contact for public project references.
5. Third-party wallet, market-data, directory and social-platform states only when independently verified.

## Claims boundary

These references support factual identification of the project and network. They do not establish exchange listing, CoinGecko/CoinMarketCap listing, liquidity, token market price, regulatory approval, custody authorization, investment return, or 1M-user capacity certification.

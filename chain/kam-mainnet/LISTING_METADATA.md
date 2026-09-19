# ZEVARYQ / ZVQ Canonical Listing Metadata

This file is the canonical public metadata source for third-party directory, wallet, market-data, explorer, and exchange integration requests.

## Network identity

- Project platform: KriptoAman
- Network: ZEVARYQ Mainnet
- Native asset: ZVQ
- Chain ID (decimal): 22028
- Chain ID (hex): 0x560c
- Network ID: 22028
- Native decimals: 18
- VM compatibility: EVM-compatible
- Consensus: QBFT
- Production validator evidence: 4 validators
- Migration type: in-place identity rebrand from KAM/KriptoAman Mainnet
- Genesis, balances, addresses and block history: unchanged

## Public endpoints

- Website: https://kriptoaman.com
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- GitHub: https://github.com/rahmanraden027-hue/kriptoaman
- HTTPS ZEVARYQ mark: https://kriptoaman.com/brand/zevaryq-mark.svg
- Official verification references: `OFFICIAL_VERIFICATION_CHANNELS.md`

## EVM registry state

- Chain ID 22028 already exists upstream in ethereum-lists/chains from PR #8639.
- The current upstream entry still carries the legacy KriptoAman/KAM identity until the ZEVARYQ rebrand PR is accepted.
- The prepared fork branch is `rahmanraden027-hue/chains:zevaryq-chain-22028`.
- The existing upstream IPFS icon remains the legacy icon until a ZEVARYQ-specific publicly resolvable non-Pinata IPFS asset is submitted.

## MetaMask onboarding

MetaMask-compatible EIP-3085 parameters are published in `registry/submissions/wallet-network-metadata.json` and `/kam-mainnet.json`. The website can request ZEVARYQ Mainnet immediately with Chain ID `0x560c`, native symbol `ZVQ`, RPC `https://rpc.kriptoaman.com`, explorer `https://explorer.kriptoaman.com`, and the HTTPS ZEVARYQ mark.

Do not claim that MetaMask has preloaded or officially curated the network unless MetaMask independently confirms that state.

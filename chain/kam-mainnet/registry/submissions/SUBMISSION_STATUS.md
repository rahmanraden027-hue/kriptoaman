# KAM Wallet & Registry Submission Status

## Canonical metadata
- Chain ID: 22028 (`0x560c`)
- Network: KriptoAman Mainnet
- Native currency: KAM, 18 decimals
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Website: https://kriptoaman.com
- PNG logo: https://kriptoaman.com/icons/kriptoaman-512.png
- SVG mark: https://kriptoaman.com/brand/kriptoaman-mark.svg
- IPFS icon: `ipfs://bafkreicorcwbkyjyw3rdbvuxfpw7bvrf74nsp4vaakclaoh6a67enzd36a`

## ethereum-lists/chains / ChainList
PR #8639 (`Add KriptoAman Mainnet (Chain ID 22028)`) was merged on 2026-08-25.

The canonical upstream file `_data/chains/eip155-22028.json` currently identifies Chain ID 22028 as KriptoAman Mainnet, with native KAM metadata, the public RPC and explorer, icon key `kriptoaman`, and upstream registry status `active`. The corresponding `_data/icons/kriptoaman.json` publishes the 512×512 PNG by IPFS.

Important: upstream registry status is directory metadata state. It does not override KriptoAman's own operational promotion gate. The authoritative project status remains `mainnet-candidate-not-public` until Issue #115 is complete.

## DefiLlama chainlist
PR #3089 was closed on 2026-08-28 and has no `merged_at` evidence. Treat DefiLlama inclusion as **not verified merged** unless a later canonical DefiLlama source independently confirms the network entry.

## MetaMask
MetaMask-compatible custom-network metadata is covered by `wallet-network-metadata.json`. Users can add an EVM network with the published RPC and Chain ID; wider wallet discovery/native presentation remains subject to each wallet's own acceptance and release process.

## Trust Wallet and other wallets
Use `wallet-network-metadata.json`, `LISTING_METADATA.md`, `OFFICIAL_VERIFICATION_CHANNELS.md`, and the canonical KriptoAman logo assets as the submission source. Each wallet has its own upstream acceptance and chain-support process; token-asset submissions are separate from adding a blockchain network.

## Promotion safety gate
Do not describe KAM Mainnet as final public-mainnet solely because a registry entry is active. Issue #115 still requires the remaining infrastructure and time-based evidence gates, including persistent production hosts, protected RPC origin proof, and passing continuity evidence.

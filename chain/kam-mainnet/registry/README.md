# ZEVARYQ wallet registry package

This directory contains the canonical public metadata package for registering ZEVARYQ Mainnet and the native ZVQ coin with EVM wallet registries.

## Canonical identity

- Network: ZEVARYQ Mainnet
- Chain ID: `22028` (`0x560c`)
- Native currency: ZVQ
- Decimals: 18
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`
- Information: `https://kriptoaman.com`
- HTTPS network mark: `https://kriptoaman.com/brand/zevaryq-mark.svg`

## Submission mapping

- Chain entry: `chainlist-22028.draft.json`
- Icon entry: `zevaryq-icon.draft.json`
- Wallet metadata: `submissions/wallet-network-metadata.json`

The Chain ID is an in-place continuation of the existing Chain ID 22028 network. The rebrand does not change genesis, balances, addresses, validator keys or block history.

For ethereum-lists/chains, the icon must use a publicly resolvable IPFS URI. The HTTPS ZEVARYQ mark can be used immediately for EIP-3085 / MetaMask custom-network onboarding, but it must not be described as the final upstream registry icon until the IPFS asset is published and accepted.

# KAM wallet registry package

This directory contains the public metadata draft for registering the native KAM coin and KriptoAman network with EVM wallet registries.

## Canonical identity

- Network: KriptoAman Mainnet
- Chain ID: `22028` (`0x560c`)
- Native currency: KAM
- Decimals: 18
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`
- Information: `https://kriptoaman.com`
- Native coin logo: `https://kriptoaman.com/icons/kriptoaman-512.png`

## Submission mapping

- Chain entry: `chainlist-22028.draft.json`
- Icon entry: `kam-icon.draft.json`

Before submitting to an external registry, confirm that the public RPC, explorer, information URL, and logo URL all return successfully. External registries may require the logo to be uploaded to IPFS and the icon URL replaced with the resulting immutable `ipfs://` URI.

The logo is metadata only. These files do not modify genesis, supply, balances, validator keys, or consensus configuration.

# KAM Wallet & Registry Submission Status

## Prepared metadata
- Chain ID: 22028 (`0x560c`)
- Network: KriptoAman Mainnet
- Native currency: KAM, 18 decimals
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Website: https://kriptoaman.com
- PNG logo: https://kriptoaman.com/icons/kriptoaman-512.png
- SVG mark: https://kriptoaman.com/brand/kriptoaman-mark.svg

## ethereum-lists/chains / ChainList
Prepared payload: `ethereum-lists/eip155-22028.json`.
Current requested registry status is `incubating` because the canonical KriptoAman repository still records `mainnet-candidate-not-public`.
The upstream repository requires changes through a fork/PR. The connected GitHub account has read-only permission on `ethereum-lists/chains`, so this repository cannot directly push or open an upstream PR without a fork-capable authenticated path.

The upstream icon field is intentionally omitted until an IPFS-resolvable icon asset is independently validated. Upstream requires icon URLs to use IPFS and the asset to satisfy format/size constraints.

## MetaMask
MetaMask-compatible custom-network metadata is covered by `wallet-network-metadata.json`. MetaMask does not require a private KriptoAman signing key to add the network; users can add the RPC/Chain ID manually. Wider discovery depends on public registry/wallet integrations.

## Trust Wallet and other wallets
Use `wallet-network-metadata.json` and the official KriptoAman logo assets as the canonical submission source. Each wallet has its own upstream acceptance and chain-support process; token-asset submissions are separate from adding a new blockchain network.

## Promotion safety gate
Do not request `active`/final-public-mainnet status until Issue #115 is fully complete, including 24-hour passing evidence, protected RPC origin proof, persistent validator-host evidence, final Chain ID collision check, and final verification channels.

After those gates pass, change the requested registry status from `incubating` to `active` only as part of the reviewed public-mainnet promotion process.

# KriptoAman Chain Localnet

Development bootstrap for the KriptoAman EVM-compatible Avalanche L1.

## Safety

This configuration is for local development/testnet only. Do not use local keys or genesis allocations on mainnet.

## Proposed network parameters

- Network: KriptoAman Localnet
- Native currency: KAM
- Decimals: 18
- Testnet Chain ID candidate: 22027 (must be re-verified before public testnet)
- Genesis supply target: 10,000,000,000 KAM

## Prerequisites

Install the current Avalanche CLI using the official Avalanche documentation, then verify:

```bash
avalanche --version
```

## Create the L1

Use the CLI interactively so the installed CLI version controls the exact prompts and supported VM versions:

```bash
avalanche blockchain create KriptoAman
```

Choose an EVM/Subnet-EVM compatible configuration. Configure KAM as the native currency and use a development-only prefunded address. Never commit its private key.

## Deploy local network

```bash
avalanche blockchain deploy KriptoAman --local
```

After deployment, save the RPC URL, blockchain ID and node information printed by the CLI. Do not hard-code values before the CLI generates them.

## Verification

Set `RPC_URL` to the RPC endpoint returned by the CLI and run:

```bash
export RPC_URL='http://127.0.0.1:PORT/ext/bc/BLOCKCHAIN_ID/rpc'
./chain/scripts/verify-localnet.sh
```

Success criteria:

1. JSON-RPC responds.
2. `eth_chainId` returns the configured chain ID.
3. A latest block is returned.
4. A funded development wallet can send native KAM.
5. A simple EVM contract can be deployed.

## Server phase

Do not expose validator HTTP/RPC ports directly to the public Internet. Public testnet should use separate validator and RPC nodes, TLS, firewall/rate limiting, monitoring, and no development keys.

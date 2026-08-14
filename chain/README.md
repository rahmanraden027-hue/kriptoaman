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

## Install Avalanche CLI

Use the current official installer on a Linux/macOS development host:

```bash
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s
export PATH="$HOME/bin:$PATH"
avalanche --version
```

## Create the L1 configuration

Current Avalanche documentation uses the L1 creation flow below:

```bash
avalanche blockchain create KriptoAman --sovereign=false
```

For the first local environment, choose **Subnet-EVM** and **defaults for a test environment**. Use only development keys/accounts. Never commit a private key.

## Deploy local network

```bash
avalanche blockchain deploy KriptoAman --local
```

The official local deployment flow boots a multi-node Avalanche network and deploys the new L1. Record the RPC URL, blockchain ID and node information printed by the CLI.

## Verification

Set `RPC_URL` to the EVM RPC endpoint returned by the CLI and run:

```bash
export RPC_URL='http://127.0.0.1:PORT/ext/bc/BLOCKCHAIN_ID/rpc'
bash ./chain/scripts/verify-localnet.sh
```

Success criteria:

1. JSON-RPC responds.
2. `eth_chainId` returns the configured chain ID.
3. A latest block is returned.
4. A funded development wallet can send native KAM.
5. A simple EVM contract can be deployed.

## Server phase

Do not expose validator HTTP/RPC ports directly to the public Internet. Public testnet should use separate validator and RPC nodes, TLS, firewall/rate limiting, monitoring, and no development keys.

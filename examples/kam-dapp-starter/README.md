# KAM dApp Starter

A minimal dependency-free starter for building against the public KriptoAman developer endpoints.

## Network

- Network: KriptoAman Mainnet
- Chain ID: `22028` (`0x560c`)
- Native currency: `KAM` (18 decimals)
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`
- Developer docs: `https://explorer.kriptoaman.com/developer/docs`

## Run locally

From the repository root:

```bash
cd examples/kam-dapp-starter
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Included helpers

`kam-network.js` exports:

- `KAM_NETWORK` — canonical public connection parameters.
- `jsonRpc(method, params)` — small JSON-RPC helper.
- `latestBlocks()` — reads the fixed public recent-blocks endpoint.
- `latestTransactions()` — reads the fixed public recent-transactions endpoint.
- `networkStats()` — reads the fixed public statistics endpoint.
- `verifyNetwork()` — checks `eth_chainId` and latest block number.
- `addToWallet()` — requests the network through `wallet_addEthereumChain`.
- `switchToKAM()` — switches to KAM, adding it if the wallet returns error `4902`.
- `requestAccounts()` — asks the injected wallet for account access.
- `explorerTxUrl(hash)` and `explorerAddressUrl(address)` — validated Explorer links.

The starter intentionally exposes fixed Explorer REST helpers instead of accepting an arbitrary path. This keeps the example narrow and prevents caller-controlled URL construction through the convenience API.

## Security model

This starter never requests or stores a seed phrase, private key, keystore password, validator credential, treasury credential, or signing secret. User transactions should be reviewed and signed in the user's wallet.

Start with read-only RPC calls, validate Chain ID `22028`, and only then enable wallet-signed write flows.

## Status discipline

The starter describes public developer endpoints that can be independently probed. It does not modify or supersede separate internal network-promotion/readiness gates maintained elsewhere in the project.

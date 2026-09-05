# KAM Wallet / Network Review Pack — 2026-09-05

Use this package for wallet-provider network review. It is intentionally limited to network identity and interoperability. It must not be used to claim official wallet support before the wallet provider confirms acceptance.

## Network identity

- Network: KriptoAman Mainnet
- Native asset: KAM
- Symbol: KAM
- Decimals: 18
- Chain ID: 22028
- Chain ID hex: `0x560c`
- EVM compatible: yes
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Website: https://kriptoaman.com
- Documentation: https://kriptoaman.com/KAMNetworkDocs
- GitHub: https://github.com/rahmanraden027-hue/kriptoaman
- Canonical icon: https://kriptoaman.com/icons/kriptoaman-512.png
- Canonical upstream chain registry: https://github.com/ethereum-lists/chains/blob/master/_data/chains/eip155-22028.json
- Canonical upstream icon registry: https://github.com/ethereum-lists/chains/blob/master/_data/icons/kriptoaman.json

## Review request copy

Subject: **KriptoAman Mainnet (KAM) — EVM Network Review Request, Chain ID 22028**

KriptoAman requests technical review of KriptoAman Mainnet as an EVM-compatible network using native KAM and Chain ID 22028 (`0x560c`). Canonical network metadata, public RPC, explorer, website, documentation, and icon references are published and the network identity is present in the canonical `ethereum-lists/chains` registry.

We are requesting network-support/discovery review only. We do not represent this request as prior wallet approval, exchange listing, guaranteed market value, custody approval, or investment endorsement. We are available to provide additional technical test vectors, RPC probes, explorer evidence, or integration metadata required by your review process.

Canonical details:
- RPC: https://rpc.kriptoaman.com
- Explorer: https://explorer.kriptoaman.com
- Chain ID: 22028
- Native currency: KAM, 18 decimals
- Registry: ethereum-lists/chains `_data/chains/eip155-22028.json`

Regards,
KriptoAman / PT Kripto Aman Indonesia

## Provider-specific routing

### MetaMask

Current usable lane: custom EVM network / chainid.network. The canonical upstream Chain ID registry entry is already present. Do not describe this as default/preloaded MetaMask support unless MetaMask confirms it.

### Trust Wallet

KAM is a native coin on a new EVM-compatible blockchain, not an ERC-20 token on an existing Trust Wallet chain. Trust Wallet's developer documentation states new blockchain support requires a positive Business Development decision before Wallet Core work. Route the request as a **new blockchain / EVM chain support** review.

### Coinbase Onchain Wallet

Coinbase documents local custom EVM-network configuration. Local configuration is not the same as Coinbase-supported network status. Request native-network review separately if broader support is desired.

### Other EVM wallets

Provide the canonical identity block above and request new-network support/discovery. Keep all claims provider-specific and evidence-based.

## Verification checklist before each submission

- [ ] RPC returns Chain ID `0x560c`.
- [ ] Explorer is reachable and tracking the same chain.
- [ ] Website and network documentation are reachable.
- [ ] Canonical ethereum-lists/chains entry is still present.
- [ ] Canonical logo URL and IPFS-backed icon metadata resolve.
- [ ] No wording implies official wallet approval before written/public evidence exists.
- [ ] Submission/ticket/PR reference is recorded after sending.

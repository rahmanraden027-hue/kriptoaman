# KAM Mainnet v1 — Candidate Deployment

Status: MAINNET CANDIDATE / NOT YET PUBLIC

This directory defines the production candidate for the KriptoAman EVM network. It is intentionally separate from KAM Testnet and MUST NOT reuse testnet validator keys, treasury keys, or genesis data.

## Candidate network profile

- Network name: KriptoAman Mainnet
- Native currency: KAM
- Candidate Chain ID: 22028 (`0x560c`)
- Decimals: 18
- Consensus: QBFT proof-of-authority
- Initial validator topology: 4 validators
- Target block period: 3 seconds
- Mainnet genesis supply target: 1,000,000,000 KAM
- RPC target: `https://rpc.kriptoaman.com`
- Explorer target: `https://explorer.kriptoaman.com`

## Non-negotiable security rules

1. Generate NEW validator keys on the production Linux hosts. Never copy testnet validator keys.
2. Generate a NEW mainnet treasury key offline. Never copy the testnet treasury key.
3. Do not commit private keys, mnemonics, keystores, API secrets, or generated production genesis files containing sensitive operational metadata.
4. Do not expose validator RPC ports directly to the public internet.
5. Public RPC must sit behind HTTPS, reverse proxy, rate limiting, request-size limits, and an explicit JSON-RPC method allowlist.
6. Keep QBFT/admin APIs private. Public RPC should expose only methods required by wallets, explorers, and read-only application use.
7. Re-check Chain ID 22028 against the public EVM chain registry immediately before public activation and before submitting registry metadata.
8. Public token sale, investment promotion, exchange, custody, bridge, staking, or other regulated financial activity is outside this technical deployment package and requires separate legal/compliance readiness.

## Activation gate

Mainnet is considered ACTIVE only after all of the following are proven on persistent Linux infrastructure:

- [ ] Four production validators running on persistent hosts
- [ ] Chain ID returns `0x560c`
- [ ] Four validators reported by QBFT
- [ ] Blocks advance continuously for at least 24 hours
- [ ] Production treasury genesis balance verified
- [ ] TLS RPC gateway deployed
- [ ] Public RPC method allowlist validated
- [ ] Rate limiting validated
- [ ] Explorer indexes blocks correctly
- [ ] Backup/restore test completed
- [ ] External monitoring enabled
- [ ] Chain ID collision re-check completed

Until all gates pass, use the label **KAM Mainnet Candidate**, not a public production mainnet.

# KAM Testnet v1

Status: DEVELOPMENT / TESTNET ONLY

KAM is the native test asset for the KriptoAman EVM test network. This directory is intentionally non-commercial and must not be used to represent a live public token sale, exchange listing, or guaranteed market value.

## Network profile

- Network name: KriptoAman Testnet
- Native symbol: KAM
- EVM Chain ID: 22027
- Native decimals: 18
- Working testnet genesis supply: 1,000,000,000 KAM
- JSON-RPC: configured by the operator at deployment time
- Public transaction execution: testnet only

## Safety rules

- Never commit validator private keys, mnemonics, seed phrases, API secrets, or funded mainnet keys.
- Use dedicated testnet keys only.
- Keep KAM testnet clearly labeled as having no guaranteed monetary value.
- Do not expose a production bridge, exchange, staking, custody, deposit, or withdrawal flow from this testnet package.
- Mainnet activation requires a separate security, governance, infrastructure, and legal-readiness review.

## Testnet goals

1. Start a KriptoAman EVM-compatible local/test network.
2. Verify Chain ID 22027 and native KAM balances over JSON-RPC.
3. Connect a test wallet using a custom EVM network configuration.
4. Verify basic native KAM transfers using test-only accounts.
5. Add explorer/monitoring only after RPC and validator health are stable.

## Operator checklist

- [ ] Dedicated testnet validator keys generated outside the repository.
- [ ] Genesis allocation addresses reviewed.
- [ ] RPC bound safely; public exposure uses TLS/reverse proxy and rate limiting.
- [ ] Chain ID returns `0x560b` (22027 decimal).
- [ ] Test KAM transfer succeeds between dedicated test accounts.
- [ ] Explorer indexes blocks correctly.
- [ ] No production wallet keys or user funds are involved.

See `network-profile.json` and `check-rpc.sh` in this directory.
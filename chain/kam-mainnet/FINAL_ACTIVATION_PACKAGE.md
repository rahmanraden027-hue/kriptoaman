# KriptoAman Mainnet — Final Activation Package

Status: **EXTERNAL ACTIVATION REQUIRED / NOT YET PUBLIC**

This package is the final technical gate before KriptoAman Mainnet can be described as a public production blockchain or submitted to chain directories / CoinGecko as a live chain.

## Frozen candidate identity

- Network: KriptoAman Mainnet
- Native currency: KAM
- Candidate Chain ID: 22028 (`0x560c`)
- Decimals: 18
- Consensus: QBFT
- Validator target: 4 production validators
- Block period target: 3 seconds
- Genesis supply target: 1,000,000,000 KAM
- Public RPC target: `https://rpc.kriptoaman.com`
- Explorer target: `https://explorer.kriptoaman.com`

## Architecture required for activation

```text
Validator 1 ─┐
Validator 2 ─┼─ private P2P/QBFT network ── Sentry/RPC origin ── Cloudflare RPC Worker ── rpc.kriptoaman.com
Validator 3 ─┤                                    │
Validator 4 ─┘                                    └─ Explorer indexer ── explorer.kriptoaman.com
```

Validators must not expose admin/QBFT/JSON-RPC directly to the public internet. The public Worker is a restricted gateway only.

## Final external activation sequence

1. Provision four persistent production Linux hosts with separate production validator keys.
2. Provision a dedicated sentry / RPC origin that peers with the validator network.
3. Start the candidate genesis and confirm `eth_chainId = 0x560c` on the private origin.
4. Confirm the private QBFT validator set contains the expected four production validators.
5. Run the chain continuously for at least 24 hours and retain monitoring evidence.
6. Deploy the RPC Worker in `public-rpc-gateway/` and set `KAM_RPC_ORIGIN` as a Worker secret.
7. Attach the Worker to the Custom Domain `rpc.kriptoaman.com`.
8. Deploy the production explorer against the same protected RPC/sentry source and publish it at `explorer.kriptoaman.com`.
9. Run `node chain/kam-mainnet/scripts/verify-public-endpoints.mjs` from an external network.
10. Verify backup/restore and external uptime monitoring.
11. Re-check Chain ID 22028 in the public EVM chain registry immediately before registry submission.
12. Only after every gate passes, make a reviewed commit changing `network-profile.json` from `mainnet-candidate-not-public` to a public-mainnet status.

## Evidence that must exist before public-mainnet status

- [ ] Four production validators visible in private QBFT operational checks
- [ ] Unique production validator keys; no testnet/private development key reuse
- [ ] Dedicated sentry/RPC origin exists
- [ ] Validator JSON-RPC/admin ports are not public
- [ ] `eth_chainId` = `0x560c`
- [ ] Block height advances continuously
- [ ] 24-hour stability evidence captured
- [ ] RPC Worker deployed
- [ ] `rpc.kriptoaman.com` reachable over HTTPS
- [ ] Public gateway blocks `admin_*`, `debug_*`, `qbft_*`, `personal_*`
- [ ] Explorer indexes the same live chain
- [ ] `explorer.kriptoaman.com` reachable over HTTPS
- [ ] Backup/restore test passed
- [ ] External monitoring enabled
- [ ] Chain ID registry collision re-check passed
- [ ] Chain metadata / ChainList submission package prepared
- [ ] CoinGecko package updated with live endpoint evidence

## Automatic public endpoint verifier

```bash
node chain/kam-mainnet/scripts/verify-public-endpoints.mjs
```

A successful verifier result is mandatory but does not replace the 24-hour stability, validator-set, backup, and monitoring evidence.

## Status transition rule

Do **not** mark the network public merely because DNS resolves or the Worker returns `/health`.

The transition to public mainnet is authorized only when all activation evidence is complete. Until then, all public wording must use **KAM Mainnet Candidate**.

## Market / listing boundary

Technical mainnet activation does not itself create a market price, exchange listing, liquidity, regulatory approval, or investment return. CoinGecko chain submission and KAM coin listing remain independent review processes.

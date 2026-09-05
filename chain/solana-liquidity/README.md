# Solana Real-Liquidity Launch Pack

Purpose: create a real Solana token, seed one real Raydium CPMM pool, perform minimal legitimate smoke trading, and verify automatic DEX Screener indexing.

## Safety and market-integrity rules

- Never commit a seed phrase, private key, keypair JSON, wallet export, API secret, or recovery phrase.
- The signer is supplied only by a local `KEYPAIR` file path at execution time.
- No wash trading, circular volume, self-dealing for the purpose of manufacturing activity, fabricated price, fake quote asset, or synthetic liquidity.
- Use real SOL for fees and real USDC for the quote side.
- Start with deliberately small canary liquidity and increase only after buy/sell and withdrawal tests pass.
- If the Solana asset represents KAM, describe it as a Solana representation/bridged or wrapped asset only after backing/bridge provenance is verifiable. Do not describe it as the native KAM coin; native KAM remains on KAM Network Chain ID 22028.

## Recommended architecture

1. Minimal Token-2022 mint with metadata only; no transfer tax, permanent delegate, default-frozen accounts, or custom transfer hook.
2. Fixed declared initial supply.
3. Raydium CPMM pool against canonical Solana USDC mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`.
4. One small quote-to-token swap and one small token-to-quote swap as functional smoke tests, not volume generation.
5. Verify pool/liquidity/transactions through DEX Screener's Solana token-pairs API.

Raydium's current documentation recommends CPMM for new constant-product pools. DEX Screener documents that tokens are indexed automatically once they are added to a liquidity pool and the pool has at least one transaction.

## Files

- `config.example.env`: operator-controlled economic and identity values.
- `create-token-2022.sh`: creates the mint, metadata, ATA and initial supply; produces a non-secret mint artifact.
- `package.json`: isolated dependencies for Raydium operations; does not modify the web application's dependency graph.
- `preview-pool-economics.mjs`: read-only pre-sign preview of TOKEN/USDC ratio, implied opening price, approximate initial pool value, supply allocation and implied FDV.
- `create-raydium-pool.mjs`: guarded real-mainnet CPMM creation.
- `smoke-swap.mjs`: one explicitly authorized swap per invocation.
- `verify-dexscreener.mjs`: read-only DEX Screener verification.

## Execution order

```bash
cd chain/solana-liquidity
cp config.example.env .env
# Fill .env locally. Never commit .env or the keypair.

bash create-token-2022.sh .env
# Copy TOKEN_MINT from artifacts/solana-token.env into local .env

npm install

# Mandatory pre-sign review: set these values to the exact intended first-pool amounts.
POOL_TOKEN_AMOUNT=<token amount> \
POOL_USDC_AMOUNT=<real USDC amount> \
TOKEN_TOTAL_SUPPLY=<declared total supply> \
node preview-pool-economics.mjs

# Review the implied opening price and supply allocation before authorizing a real pool transaction.
node create-raydium-pool.mjs
# Copy POOL_ID from artifacts/raydium-pool.json into local .env

SMOKE_DIRECTION=quote-to-token node smoke-swap.mjs
SMOKE_DIRECTION=token-to-quote node smoke-swap.mjs
node verify-dexscreener.mjs
```

## Pre-sign economic interpretation

`preview-pool-economics.mjs` is intentionally read-only. It calculates the pool's starting TOKEN/USDC ratio before any transaction is signed. The displayed implied opening price and FDV are mathematical ratio previews only, not guarantees of market value. Once a real pool is active, only live venue-observed data should be used in public market claims.

The preview fails if the pool token allocation exceeds the declared total supply. Any change to token amount or USDC amount should be previewed again before signing the pool transaction.

## Irreversible authority decisions

This pack intentionally does not automatically revoke mint/freeze/update authorities. Authority revocation is irreversible and should be a separate, explicit governance/security decision after the mint, metadata, supply and recovery controls are independently checked. Public disclosures must state the actual authority state until it changes on-chain.

## Definition of ready for public promotion

- mint address and metadata resolve on Solana mainnet;
- declared supply equals on-chain supply;
- quote token is canonical USDC;
- pre-sign pool ratio and implied opening price were reviewed before wallet authorization;
- Raydium pool exists and has real reserves;
- both-direction smoke swaps have successful receipts;
- liquidity can be withdrawn by the legitimate LP owner;
- DEX Screener returns the Solana pair with the expected token mint and pool address;
- any displayed price/FDV/liquidity comes from the live pool, not a project-declared number.

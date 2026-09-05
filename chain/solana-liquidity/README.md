# Solana Real-Liquidity Launch Pack

Purpose: create the approved sKAM Solana asset, seed one real Raydium CPMM sKAM/SOL pool, perform minimal legitimate smoke trading, and verify automatic DEX Screener indexing.

## Safety and market-integrity rules

- Never commit a seed phrase, private key, keypair JSON, wallet export, API secret, or recovery phrase.
- The signer is supplied only by a local `KEYPAIR` file path at execution time and must match the approved public operator address.
- No wash trading, circular volume, self-dealing for the purpose of manufacturing activity, fabricated price, fake quote asset, or synthetic liquidity.
- Use real SOL for the quote side and fees. Raydium consumes native SOL through the canonical Wrapped SOL (WSOL) mint `So11111111111111111111111111111111111111112`.
- Start with deliberately small canary liquidity and increase only after buy/sell and withdrawal tests pass.
- sKAM is distinct from native KAM on KAM Network. Do not describe it as 1:1 backed/bridged until backing and bridge provenance are independently verifiable.

## Approved canary architecture

1. Minimal Token-2022 sKAM mint with metadata only; no transfer tax, permanent delegate, default-frozen accounts, or custom transfer hook.
2. Declared initial supply: `1,000,000,000 sKAM`.
3. First Raydium CPMM pair: canonical WSOL quote mint `So11111111111111111111111111111111111111112`.
4. First reserves: `1,000,000 sKAM + 0.20 SOL`.
5. Mathematical opening ratio: `0.0000002 SOL per sKAM`. This is not a USD price or market-value guarantee.
6. One deliberately small quote-to-token smoke swap and, if separately approved, one token-to-quote smoke swap as functional checks rather than volume generation.
7. Verify pool/liquidity/transactions through DEX Screener's Solana token-pairs API.

Raydium's current CPMM implementation supports native SOL usage through WSOL. Pool creation uses the wallet's native SOL balance and wraps/unwraps as required by token-program instructions.

## Budget planning

The approved wallet is checked read-only before signing. Current planning assumptions are:

- `0.20 SOL` initial liquidity;
- `0.15 SOL` Raydium CPMM creation fee;
- approximately `0.04 SOL` CPMM account rent as a planning estimate;
- `0.05 SOL` operating buffer for mint/account/transaction/smoke steps.

The rent value is not a guarantee. Real transactions must still pass wallet-side simulation/preflight before signing.

## Files

- `config.example.env`: operator-controlled identity and approved sKAM/SOL economic values.
- `create-token-2022.sh`: creates the mint, metadata, ATA and initial supply; produces a non-secret mint artifact.
- `package.json`: isolated dependencies for Raydium operations; does not modify the web application's dependency graph.
- `preview-pool-economics.mjs`: read-only pre-sign preview of TOKEN/quote ratio, supply allocation and quote-denominated implied FDV.
- `create-raydium-pool.mjs`: guarded real-mainnet CPMM creation using native SOL through canonical WSOL.
- `smoke-swap.mjs`: one explicitly authorized swap per invocation.
- `verify-dexscreener.mjs`: read-only DEX Screener verification.

## Execution order

```bash
cd chain/solana-liquidity
cp config.example.env .env
# Fill KEYPAIR locally. Never commit .env or the keypair.

bash create-token-2022.sh .env
# Copy TOKEN_MINT from artifacts/solana-token.env into local .env

npm install

# Mandatory pre-sign review for the approved first pool.
POOL_TOKEN_AMOUNT=1000000 \
POOL_QUOTE_AMOUNT=0.20 \
QUOTE_SYMBOL=SOL \
TOKEN_TOTAL_SUPPLY=1000000000 \
node preview-pool-economics.mjs

# Review the ratio before authorizing a real pool transaction.
node create-raydium-pool.mjs
# Copy POOL_ID from artifacts/raydium-pool.json into local .env

# Set an exact small smoke amount only after reviewing remaining SOL.
SMOKE_DIRECTION=quote-to-token node smoke-swap.mjs
node verify-dexscreener.mjs
```

## Pre-sign economic interpretation

`preview-pool-economics.mjs` is intentionally read-only. For the approved sKAM/SOL pool it calculates the starting SOL-per-sKAM reserve ratio, approximate pool value in SOL, supply allocation and implied FDV in SOL. It does not fabricate a USD price. Optional USD fields remain null unless an explicit current external `QUOTE_USD_PRICE` is supplied.

Once a real pool is active, only live venue-observed data should be used in public market claims. DEX Screener's displayed USD values should be treated as observed indexed market data, not project-declared prices.

## Irreversible authority decisions

This pack intentionally does not automatically revoke mint/freeze/update authorities. Authority revocation is irreversible and should be a separate, explicit governance/security decision after the mint, metadata, supply and recovery controls are independently checked. Public disclosures must state the actual authority state until it changes on-chain.

## Definition of ready for public promotion

- mint address and metadata resolve on Solana mainnet;
- declared supply equals on-chain supply;
- quote mint is canonical WSOL;
- pre-sign sKAM/SOL ratio was reviewed before wallet authorization;
- Raydium pool exists and has real reserves;
- approved smoke swap(s) have successful receipts;
- liquidity can be withdrawn by the legitimate LP owner;
- DEX Screener returns the Solana pair with the expected token mint and pool address;
- any displayed price/FDV/liquidity comes from the live pool, not a project-declared number.

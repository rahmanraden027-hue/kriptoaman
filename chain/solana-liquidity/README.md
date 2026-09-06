# Solana Real-Liquidity Launch Pack

Purpose: create the approved sKAM Solana asset, seed one real Raydium CPMM sKAM/SOL pool, perform minimal legitimate smoke trading, and verify automatic DEX Screener indexing.

## Safety and market-integrity rules

- Never commit a seed phrase, private key, keypair JSON, wallet export, API secret, or recovery phrase.
- The signer is supplied only by a local `KEYPAIR` JSON file path at execution time and must match the approved public operator address.
- No wash trading, circular volume, self-dealing for the purpose of manufacturing activity, fabricated price, fake quote asset, or synthetic liquidity.
- Use real SOL for the quote side and fees. Raydium consumes native SOL through the canonical Wrapped SOL (WSOL) mint `So11111111111111111111111111111111111111112`.
- Start with deliberately small canary liquidity and increase only after buy/sell and withdrawal tests pass.
- sKAM is distinct from native KAM on KAM Network. Do not describe it as 1:1 backed/bridged until backing and bridge provenance are independently verifiable.

## Approved canary architecture

1. Minimal Token-2022 sKAM mint with MetadataPointer + TokenMetadata; no transfer tax, permanent delegate, default-frozen accounts, or custom transfer hook.
2. Declared initial supply: `1,000,000,000 sKAM` with 9 decimals.
3. First Raydium CPMM pair: canonical WSOL quote mint `So11111111111111111111111111111111111111112`.
4. First reserves: `1,000,000 sKAM + 0.20 SOL`.
5. Mathematical opening ratio: `0.0000002 SOL per sKAM`. This is not a USD price or market-value guarantee.
6. One deliberately small quote-to-token smoke swap as a functional check rather than volume generation.
7. Verify pool/liquidity/transactions through DEX Screener's Solana token-pairs API.

The primary launcher is Node.js-only and does **not** require the native `solana` or `spl-token` CLI binaries. This is intended to support the existing Android Termux environment as well as Linux/macOS/WSL, provided Node.js can install the pinned JavaScript dependencies and the approved local JSON keypair exists on that machine.

## Budget planning

The approved wallet is checked read-only before signing. Current planning assumptions are:

- `0.20 SOL` initial liquidity;
- `0.15 SOL` Raydium CPMM creation fee;
- approximately `0.04 SOL` CPMM account rent as a planning estimate;
- `0.05 SOL` operating buffer for mint/account/transaction/smoke steps.

The rent value is not a guarantee. Real transactions must still pass simulation/preflight before signing.

## Files

- `config.example.env`: operator-controlled identity and approved sKAM/SOL economic values.
- `check-wallet-readiness.mjs`: read-only multi-provider SOL budget gate.
- `create-token-2022.mjs`: primary Node.js Token-2022 mint path; creates metadata, ATA and initial supply and writes non-secret evidence.
- `create-token-2022.sh`: legacy native-CLI token creation path; retained as an operator fallback but not used by the end-to-end launcher.
- `package.json`: isolated pinned Solana Token-2022 and Raydium dependencies; does not modify the web application's dependency graph.
- `preview-pool-economics.mjs`: read-only pre-sign preview of TOKEN/quote ratio, supply allocation and quote-denominated implied FDV.
- `create-raydium-pool.mjs`: guarded real-mainnet CPMM creation using native SOL through canonical WSOL.
- `smoke-swap.mjs`: one explicitly authorized swap per invocation.
- `verify-dexscreener.mjs`: read-only DEX Screener verification.
- `launch-skam-mainnet.sh`: guarded end-to-end Node.js orchestrator that persists only public mint/pool identifiers into the local `.env` and evidence directory.

## Recommended end-to-end execution

The launcher is intended to run on the operator-controlled machine where the approved keypair already exists. It does not recover, export, upload, or print private key material.

```bash
cd chain/solana-liquidity
cp config.example.env .env
# Edit only the local .env and set KEYPAIR to the approved operator JSON keypair path.
# Never commit .env or the keypair.

# Immediately before execution, set the four explicit irreversible gates in local .env:
# CONFIRM_FULL_SKAM_LAUNCH=LAUNCH_REAL_SKAM_MAINNET
# CONFIRM_CREATE_TOKEN=CREATE_REAL_SOLANA_TOKEN
# CONFIRM_CREATE_POOL=CREATE_REAL_RAYDIUM_POOL
# CONFIRM_SMOKE_SWAP=EXECUTE_ONE_REAL_SMOKE_SWAP

bash launch-skam-mainnet.sh .env
```

The end-to-end launcher performs these steps in order:

1. Pins the approved operator, token identity, supply, metadata URI, WSOL quote and canary reserves.
2. Installs/resolves the isolated Node.js Solana/Token-2022/Raydium dependencies before any on-chain write.
3. Resolves the local JSON keypair to a public address in JavaScript and requires an exact match with the approved operator.
4. Verifies the public metadata JSON and logo.
5. Runs the read-only SOL budget gate.
6. Creates the Token-2022 mint only if `TOKEN_MINT` is empty; otherwise verifies the configured mint supply instead of creating a duplicate.
7. Runs the mandatory pool-economics preview.
8. Creates the Raydium CPMM only if `POOL_ID` is empty; otherwise skips duplicate pool creation.
9. Executes exactly one small quote-to-token functional smoke swap. When `SMOKE_INPUT_UI` is blank the launcher uses `0.001 SOL`; it refuses values above `0.005 SOL`.
10. Polls the read-only DEX Screener verifier for a bounded indexing window. It fails closed and does not claim readiness if indexing is not observed.
11. Writes a non-secret final summary only after DEX Screener verification succeeds.

## Manual Node.js execution order

```bash
cd chain/solana-liquidity
cp config.example.env .env
# Fill KEYPAIR locally and set the relevant confirmation gate immediately before each write.

npm install --no-audit --no-fund
node create-token-2022.mjs
# Copy TOKEN_MINT from artifacts/solana-token.env into local .env

POOL_TOKEN_AMOUNT=1000000 \
POOL_QUOTE_AMOUNT=0.20 \
QUOTE_SYMBOL=SOL \
TOKEN_TOTAL_SUPPLY=1000000000 \
node preview-pool-economics.mjs

node create-raydium-pool.mjs
# Copy POOL_ID from artifacts/raydium-pool.json into local .env

SMOKE_DIRECTION=quote-to-token node smoke-swap.mjs
node verify-dexscreener.mjs
```

## Pre-sign economic interpretation

`preview-pool-economics.mjs` is intentionally read-only. For the approved sKAM/SOL pool it calculates the starting SOL-per-sKAM reserve ratio, approximate pool value in SOL, supply allocation and implied FDV in SOL. It does not fabricate a USD price. Optional USD fields remain null unless an explicit current external `QUOTE_USD_PRICE` is supplied.

Once a real pool is active, only live venue-observed data should be used in public market claims. DEX Screener's displayed USD values should be treated as observed indexed market data, not project-declared prices.

## Irreversible authority decisions

The Node.js mint path creates mint, freeze, metadata-pointer and metadata-update authorities under the approved operator. It intentionally does not revoke any authority automatically. Authority revocation is irreversible and should be a separate, explicit governance/security decision after the mint, metadata, supply and recovery controls are independently checked. Public disclosures must state the actual authority state until it changes on-chain.

## Definition of ready for public promotion

- mint address and metadata resolve on Solana mainnet;
- declared supply equals on-chain supply;
- quote mint is canonical WSOL;
- pre-sign sKAM/SOL ratio was reviewed before wallet authorization;
- Raydium pool exists and has real reserves;
- approved smoke swap has a successful receipt;
- liquidity can be withdrawn by the legitimate LP owner;
- DEX Screener returns the Solana pair with the expected token mint and pool address;
- any displayed price/FDV/liquidity comes from the live pool, not a project-declared number.

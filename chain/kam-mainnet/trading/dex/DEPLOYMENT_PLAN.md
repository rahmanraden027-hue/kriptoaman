# KAM DEX Mainnet Deployment Plan

Status: **PRE-DEPLOYMENT ONLY**

This document intentionally does not authorize or execute a mainnet DEX deployment.

## Confirmed network inputs

- Network: KriptoAman Mainnet
- Chain ID: `22028`
- RPC: `https://rpc.kriptoaman.com`
- Explorer: `https://explorer.kriptoaman.com`
- Native asset: `KAM`
- WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Solidity target EVM: `paris`

## Required gates before any mainnet transaction

1. Factory, pair and router contracts compile with `evmVersion = paris`.
2. Automated tests cover pair creation, liquidity add/remove and swaps.
3. Factory/router deployment is simulated and gas-estimated against Chain ID 22028.
4. WKAM address is immutable or otherwise validated by the router configuration.
5. No private key, mnemonic, keystore password or secret is committed to Git.
6. A real ERC-20 quote asset is selected. WKAM/native KAM alone is not a meaningful two-asset GeckoTerminal market.
7. Initial liquidity quantities and price implications are explicitly approved before funding a pool.
8. Deployment addresses and transaction hashes are recorded only after receipts and runtime bytecode are independently verified.

## GeckoTerminal readiness

A chain submission and a DEX/pool are separate readiness items. Do not claim GeckoTerminal or CoinGecko listing/approval until the external service confirms it.

For a useful indexed market, create a real pool such as `WKAM / <quote ERC-20>`, fund it transparently, verify reserves/swaps on-chain, then provide the resulting factory/router/pair metadata through the applicable official listing process.

## Safety rule

Do not deploy Factory, Router, quote token, create a pool, or add liquidity automatically from CI. Mainnet transactions require an explicit deployment decision after tests and configuration review.

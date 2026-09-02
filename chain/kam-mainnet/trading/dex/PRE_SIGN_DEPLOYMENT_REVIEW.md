# KAM DEX Pre-Sign Deployment Review

Status: **REVIEW REQUIRED — NO BROADCAST AUTHORIZED**

This checklist is the final human review package before any KAM DEX Factory or Router deployment transaction is signed.

## Locked production inputs

- Network: KriptoAman Mainnet
- Chain ID: `22028`
- Native asset: `KAM`
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- Deployment order: `KAMFactory` first, then `KAMRouter(factory, WKAM)`
- Production manifest: `chain/kam-mainnet/deployments/dex.production.manifest.json`
- Reviewed repository baseline after deployment-decision gate: `e7efd908b1fc89a8a917e1fe82df5764374222fd`

## Evidence already required to remain green

- KAM DEX contract tests
- WKAM contract tests
- KAM DEX Mainnet no-broadcast dry run
- KAM DEX Deployment Decision Gate
- CI
- CodeQL Security Analysis
- Security Audit workflow
- KAM Chain Freeze Guard
- KAM Mainnet Promotion Gate

A passing CI/security workflow is not a substitute for an independent smart-contract audit.

## Human approval gate before signing

All items below must be explicitly reviewed outside source control before any transaction is signed:

- [ ] Independent smart-contract audit completed, or documented risk acceptance explicitly approved.
- [ ] Exact deployment commit SHA selected and frozen.
- [ ] Deployment wallet address reviewed; private key/mnemonic never committed or pasted into chat/source control.
- [ ] Deployment wallet funded only with the minimum KAM required for estimated gas plus a conservative buffer.
- [ ] RPC reports Chain ID `22028` immediately before signing.
- [ ] Canonical WKAM runtime bytecode remains present at the locked address.
- [ ] Factory creation bytecode is built from the selected reviewed commit.
- [ ] Factory expected address/nonce and estimated gas are reviewed before signing.
- [ ] Explicit approval to deploy Factory is recorded.
- [ ] Factory receipt, runtime bytecode and explorer record are independently checked before Router signing.
- [ ] Router constructor arguments are exactly the verified Factory address plus canonical WKAM.
- [ ] Router expected address/nonce and estimated gas are reviewed before signing.
- [ ] Explicit approval to deploy Router is recorded.
- [ ] Router receipt, constructor bindings, runtime bytecode and explorer record are independently checked.

## Separate liquidity gate

Deployment does **not** authorize liquidity.

Before any pool creation or treasury funding:

- [ ] Legitimate counter-asset provenance is independently verified.
- [ ] Exact pair is approved.
- [ ] Exact initial reserves are approved.
- [ ] Implied initial pool price is calculated and reviewed.
- [ ] Expected slippage/depth is reviewed.
- [ ] Treasury authorization is recorded.
- [ ] Factory and Router deployment addresses are verified on-chain.
- [ ] Small controlled swap smoke-test plan is approved.

## Hard safety rules

- Do not store a deployer private key, mnemonic, keystore password, or raw secret in GitHub.
- Do not run deployment from unattended CI.
- Do not broadcast automatically from a pull request or merge.
- Do not create or fund a pool as part of the deployment transaction.
- Do not represent a pool ratio as a guaranteed or fair market price.
- Do not claim external DEX/aggregator/listing approval until confirmed by that provider.

## Current authorization state

`FACTORY_DEPLOYMENT_AUTHORIZED = false`

`ROUTER_DEPLOYMENT_AUTHORIZED = false`

`LIQUIDITY_AUTHORIZED = false`

The next state change requires an explicit, separate deployment decision after review of this checklist.

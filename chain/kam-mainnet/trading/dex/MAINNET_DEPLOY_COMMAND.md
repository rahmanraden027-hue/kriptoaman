# KAM DEX Mainnet Deployment Command

Status: **PREPARED — NOT BROADCAST**

This package prepares the exact guarded Foundry deployment command for `KAMFactory` and `KAMRouter` on KriptoAman Mainnet. It does not include a private key, mnemonic, keystore, treasury movement or liquidity authorization.

## Locked network inputs

- Network: KriptoAman Mainnet
- Chain ID: `22028`
- RPC: `https://rpc.kriptoaman.com`
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- EVM version: `paris`

## Deployment order

1. `KAMFactory`
2. Verify Factory receipt and runtime bytecode
3. `KAMRouter(factory, canonicalWKAM)`
4. Verify Router receipt, runtime bytecode and constructor bindings

The guarded Solidity script performs Factory then Router in one broadcast session and validates the resulting bindings before returning.

## Exact command — DO NOT RUN until explicit deployment approval

```bash
cd chain/kam-mainnet/trading
export DEPLOYER_PRIVATE_KEY='SET_LOCALLY_OUTSIDE_CHAT_AND_SOURCE_CONTROL'
forge script script/DeployKAMDEX.s.sol:DeployKAMDEX \
  --rpc-url https://rpc.kriptoaman.com \
  --evm-version paris \
  --broadcast \
  -vvvv
unset DEPLOYER_PRIVATE_KEY
```

Never paste a private key, seed phrase or mnemonic into GitHub, ChatGPT, an issue, pull request, CI variable shown in logs, or any public terminal transcript.

## Expected post-deployment evidence

Record only after confirmed receipts:

- reviewed source commit SHA
- deployer public address
- Factory address, transaction hash and deployment block
- Factory runtime bytecode hash
- Router address, transaction hash and deployment block
- Router runtime bytecode hash
- Router `factory()` equals deployed Factory
- Router `WKAM()` equals canonical WKAM
- Explorer links for both contracts

## Hard stop after contracts

Do **not** create a pair or add liquidity as part of this deployment. Liquidity remains a separate treasury decision and requires verified counter-asset provenance, exact reserves, implied initial price/slippage review, and explicit treasury authorization.

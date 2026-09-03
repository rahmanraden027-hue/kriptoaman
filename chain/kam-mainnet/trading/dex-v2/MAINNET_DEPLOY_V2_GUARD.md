# KAM DEX V2 Mainnet Deployment Guard

Status: **PREPARED — NOT BROADCAST — EXTERNAL AUDIT REQUIRED**

This document prepares the post-audit deployment path for KAM DEX V2 Revision 3. It does not authorize deployment, treasury movement, pair creation, or liquidity.

## Locked network inputs

- Network: KriptoAman Mainnet
- Chain ID: `22028`
- RPC: `https://rpc.kriptoaman.com`
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- EVM version: `paris`
- Frozen contract scope: see `KAM_DEX_V2_AUDIT_FREEZE_2026-09-03.md`

## Required pairCreator

`pairCreator` must be a non-zero public address selected only after security review. Prefer a properly controlled multisig if the external auditor recommends it.

Do not place private keys, seed phrases, mnemonics, keystore passwords, or signing secrets in the repository, GitHub issue/PR, ChatGPT, CI logs, or screenshots.

## No-secret dry run

This simulation creates Factory V2 and Router V2 only inside Foundry's non-broadcast execution. It does not send a transaction.

Replace `<PAIR_CREATOR_PUBLIC_ADDRESS>` with the intended public address only.

```bash
cd chain/kam-mainnet/trading
forge script script/PrepareKAMDEXV2Deployment.s.sol:PrepareKAMDEXV2Deployment \
  --sig "run(address)" <PAIR_CREATOR_PUBLIC_ADDRESS> \
  --rpc-url https://rpc.kriptoaman.com \
  --evm-version paris \
  -vvvv
```

Expected checks:

- Chain ID is 22028.
- Canonical WKAM runtime exists.
- Factory V2 deploys in simulation.
- Router V2 deploys in simulation.
- Factory `pairCreator()` equals the supplied public address.
- Permissionless pair creation is initially disabled.
- Factory pair count is zero.
- Router `factory()` points to the simulated Factory V2.
- Router `WKAM()` points to canonical WKAM.

## Production deployment — hard HOLD until auditor GO

Only after all release gates pass and explicit deployment approval is given:

```bash
cd chain/kam-mainnet/trading
export DEPLOYER_PRIVATE_KEY='SET_LOCALLY_OUTSIDE_CHAT_AND_SOURCE_CONTROL'
forge script script/DeployKAMDEXV2.s.sol:DeployKAMDEXV2 \
  --sig "run(address)" <APPROVED_PAIR_CREATOR_PUBLIC_ADDRESS> \
  --rpc-url https://rpc.kriptoaman.com \
  --evm-version paris \
  --broadcast \
  -vvvv
unset DEPLOYER_PRIVATE_KEY
```

Never run the broadcast command before the exact Revision 3 scope receives an attributable independent audit GO.

## Post-deployment evidence required before any pair/liquidity action

Record and independently verify:

- frozen audited source commit and blob SHAs;
- deployer public address;
- approved pairCreator public address;
- Factory V2 address, deployment transaction, block, runtime hash;
- Router V2 address, deployment transaction, block, runtime hash;
- Factory `pairCreator()` binding;
- Factory permissionless state is `false`;
- Factory `allPairsLength()` is `0`;
- Router `factory()` equals deployed Factory V2;
- Router `WKAM()` equals canonical WKAM;
- explorer evidence for both contracts;
- fresh source/runtime attestation against deployed bytecode.

## Hard stop after contract deployment

Even a successful V2 deployment does **not** authorize liquidity.

Remain HOLD until:

1. verified official quote asset / bridge provenance is available for Chain ID 22028;
2. independent review of the counter-asset/bridge path passes;
3. treasury authorization names exact pair, amounts, signer, recipient, and maximum exposure;
4. first canary reserves and implied ratio are reviewed;
5. only then use atomic `createPairAndSeed()` for the small approved canary amount;
6. execute swap + withdrawal smoke tests;
7. verify reserves, LP balances, receipts, explorer evidence, and public RPC stability;
8. enable Connect Wallet and Swap only after all gates pass.

# WKAM Contract Publication Package

Contract: `WKAM.sol`

## Intended network
- KriptoAman Mainnet
- Chain ID: 22028 (`0x560c`)
- Native asset: KAM
- RPC target: `https://rpc.kriptoaman.com`
- Explorer target: `https://explorer.kriptoaman.com`

## Invariants
- Native KAM is wrapped 1:1 into WKAM.
- WKAM is fully collateralized by native KAM held by the contract.
- `totalSupply` must equal aggregate WKAM balances.
- Contract KAM balance must be greater than or equal to WKAM `totalSupply` under normal operation.
- There is no privileged owner/admin mint path.

## Required tests before production deployment
1. Deposit via `deposit()` mints exactly `msg.value` WKAM.
2. Deposit via plain native transfer (`receive`) mints exactly `msg.value` WKAM.
3. Withdraw burns WKAM and returns equal native KAM.
4. Zero-value deposits revert.
5. Transfers preserve total supply.
6. `transferFrom` respects allowance, including infinite allowance.
7. Withdrawal above balance reverts.
8. Transfer to zero address reverts.
9. Contract cannot create unbacked WKAM through any public method.
10. Fuzz/invariant tests validate 1:1 backing across randomized deposit/transfer/withdraw sequences.

## Production deployment gate
Do not deploy until:
- RPC returns chain ID `0x560c` reliably.
- Block height is advancing.
- Explorer is synchronized.
- Validator health gate is green.
- Source and bytecode are reviewed.
- Deployer address and funding source are explicitly approved.
- Deployment transaction is signed by the authorized deployer.

## After deployment
Record and publish:
- Deployment transaction hash
- Contract address
- Deployment block
- Compiler version and optimizer settings
- Source verification status on explorer
- Code hash / runtime bytecode hash

Never label WKAM as live before those on-chain facts are independently verifiable.

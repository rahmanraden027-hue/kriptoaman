# sKAM v1 — Staked KAM Receipt

Status: **development / audit candidate — not production deployed**

## Purpose

`sKAM` is a minimal ERC-20-like receipt token for WKAM locked in the sKAM contract.

- 1 WKAM staked -> 1 sKAM minted.
- 1 sKAM unstaked -> 1 WKAM returned.
- sKAM is transferable.
- The contract has no owner, admin mint, tax, blacklist, pause switch, upgradeability, or embedded reward emission.
- `totalAssets()` reports WKAM held by the contract.
- `isFullyBacked()` requires WKAM reserves to be at least the circulating sKAM supply.

## Why WKAM is the asset

KAM is the native asset of KAM Mainnet. WKAM provides the ERC-20-style transfer/approval interface required for a simple and auditable staking receipt layer.

User flow:

1. KAM -> WKAM using the existing 1:1 wrapper.
2. Approve the sKAM contract to spend the intended WKAM amount.
3. `stake(amount)` -> WKAM is locked and the same amount of sKAM is minted.
4. `unstake(amount)` -> sKAM is burned and the same amount of WKAM is returned.
5. WKAM can then be unwrapped back to native KAM.

## Security model

The v1 contract deliberately excludes yield/reward accounting. Adding rewards to the same receipt contract would expand the attack surface and complicate reserve accounting. Any future reward system should be implemented as a separate, independently reviewed module.

Primary invariant:

`WKAM.balanceOf(address(sKAM)) >= sKAM.totalSupply()`

Direct WKAM transfers to the contract can create excess reserves but cannot mint sKAM.

## Deployment gates

Do not deploy to production until all gates are complete:

1. `forge test` passes for WKAM, sKAM, and DEX suites.
2. Add fuzz/invariant testing for stake/unstake/transfer sequences.
3. Independent smart-contract review completed.
4. Confirm the canonical production WKAM address.
5. Dry-run deployment using the KAM mainnet RPC without broadcasting.
6. Deploy sKAM with `WKAM_ADDRESS` explicitly set.
7. Verify bytecode/source and record deployment transaction + contract address.
8. Run a small-value wrap -> stake -> transfer -> unstake -> unwrap smoke test.
9. Only after evidence is archived should UI integration or public staking be enabled.

## Deployment command

From `chain/kam-mainnet/trading` after the production WKAM address is confirmed:

```bash
export KAM_RPC_URL='https://<canonical-kam-rpc>'
export WKAM_ADDRESS='0x...'
export DEPLOYER_PRIVATE_KEY='<kept outside repository>'

forge script script/DeploySKAM.s.sol:DeploySKAM \
  --rpc-url "$KAM_RPC_URL"
```

The command above is intentionally a simulation/dry-run. Add `--broadcast` only after the audit and production gates are explicitly approved.

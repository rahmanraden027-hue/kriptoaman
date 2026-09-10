# KAM Mining Rewards v1

Status: **implementation candidate — not deployed, not a public mining launch**.

KAM Mining Rewards v1 is a native-KAM staking reward program for KAM Network. It deliberately does **not** implement Proof-of-Work and does **not** mint new KAM. Every reward must already exist and be funded into the contract by the program owner.

## Safety model

- Native KAM principal is tracked separately from the reward pool.
- The contract has no admin mint function.
- The owner cannot withdraw user principal from the contract.
- New stakes and reward claims can be paused during an incident.
- Principal withdrawal remains available while paused.
- Reward programs are funded up front with native KAM.
- Reward duration is constrained to 7–365 days.
- Ownership transfer uses a two-step pending-owner/accept-owner flow.
- Reentrancy protection is applied to all KAM-moving entry points.

## Contract

`contracts/KAMMiningRewards.sol`

Core user methods:

- `stake()` — stake native KAM by sending value with the call.
- `withdraw(amount)` — withdraw staked principal.
- `claimReward()` — claim currently accrued reward.
- `earned(account)` — read currently accrued reward.
- `availableRewardBalance()` — read KAM available for reward obligations, excluding staked principal.

Owner methods:

- `notifyRewardAmount(duration)` — fund/extend a reward program by sending native KAM.
- `pause()` / `unpause()` — incident controls.
- `transferOwnership(newOwner)` — begin two-step ownership transfer.

## Test locally before any deployment

From `chain/kam-mainnet/trading`:

```bash
forge test --match-contract KAMMiningRewardsTest -vvv
```

Then run the full trading-contract suite:

```bash
forge test -vvv
```

A public deployment should not proceed if either command fails.

## Deployment sequence

1. Run the full Foundry test suite.
2. Have the contract reviewed independently and resolve every high/critical finding.
3. Deploy first to a controlled KAM test/pilot environment.
4. Set the owner to a multisig or governance-controlled address, not a browser hot wallet.
5. Verify bytecode/source in the KAM Explorer.
6. Fund a small, time-bounded reward pilot using `notifyRewardAmount`.
7. Test stake, reward accrual, claim, normal withdraw, and paused withdraw with small amounts.
8. Only after evidence is retained, configure the web application with the deployed contract address.

## Web configuration

The `/KAMMining` interface is intentionally transaction-disabled until a valid deployed address is configured:

```bash
VITE_KAM_MINING_REWARDS_ADDRESS=0xYOUR_VERIFIED_CONTRACT
```

After setting the environment variable, rebuild/deploy the web application and verify the contract address shown in the UI matches the verified KAM Explorer address exactly.

## Reward funding example

Using `cast` after deployment, with values chosen only for a controlled pilot:

```bash
cast send "$KAM_MINING_ADDRESS" \
  "notifyRewardAmount(uint256)" 604800 \
  --value 100ether \
  --rpc-url "$KAM_RPC_URL" \
  --private-key "$OWNER_PRIVATE_KEY"
```

`604800` seconds is 7 days. Do not paste private keys into source code, GitHub issues, logs, or the browser UI.

## Public wording

Use **"KAM Mining — staking-based funded rewards"** or **"KAM Mining Reward Pilot"**. Do not describe this contract as Proof-of-Work, newly minted KAM, guaranteed income, guaranteed APY, or risk-free returns.

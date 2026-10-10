# Phase 16G — ZVQ Supply Reconciliation

**Status: BLOCKED PENDING PRODUCTION GENESIS ATTESTATION + ALLOCATION EVIDENCE**

## Confirmed references

Three independent project surfaces agree on a **1,000,000,000-unit project/genesis supply reference**:

- `chain/kam-mainnet/network-profile.json`;
- `chain/kam-mainnet/tokenomics-v1.json`;
- archived public KAM Tokenomics v1 documentation/UI.

This agreement is useful evidence of project intent, but it is not by itself proof of the current native-coin supply on the running chain.

## Why 1B is not yet promoted to verified on-chain supply

The repository intentionally does not commit the generated production genesis artifact containing sensitive operational metadata. The public RPC proves Chain ID, block progression and balances for addresses that are queried, but ZVQ is a native EVM coin and does not expose a canonical ERC-20 `totalSupply()` method.

Therefore the current package cannot independently prove the complete native supply from public RPC alone.

The correct public wording remains:

**Project maximum/genesis supply baseline: 1,000,000,000 ZVQ — production genesis/on-chain reconciliation pending.**

## 50M → 70M policy change

The historical KAM archive defines:

- initial circulating target: **50,000,000 KAM (5%)**.

Phase 16G proposes:

- initial circulating target: **70,000,000 ZVQ (7%)**.

The new 70M figure is a proposed migration policy. It is not current circulating supply and requires explicit governance approval plus a reproducible allocation/unlocked-balance calculation.

## Historical allocation drift detected

There are two incompatible historical allocation baselines.

### Archived KAM Tokenomics document/UI

- Ecosystem & Network Development: 300M / 30%
- Community & Adoption: 200M / 20%
- Validator / Network Incentives: 150M / 15%
- Treasury / Foundation: 150M / 15%
- Team & Contributors: 100M / 10%
- Liquidity & Market Development: 70M / 7%
- Strategic Partnerships: 30M / 3%

### `chain/kam-mainnet/tokenomics-v1.json`

- Ecosystem & Development: 350M / 35%
- Treasury & Strategic Reserve: 200M / 20%
- Liquidity & Market Infrastructure: 150M / 15%
- Team & Contributors: 150M / 15%
- Community & Adoption: 100M / 10%
- Strategic Partnerships: 50M / 5%

Both total 1B, but they are not the same allocation policy.

**No historical version is silently selected as the ZVQ production allocation.**

A versioned ZVQ policy must explicitly resolve this drift.

## Important 70M distinction

The archived tokenomics contains a **70M KAM liquidity allocation**.

The new Phase 16G proposal contains a **70M ZVQ initial circulating target**.

These are different economic concepts and must never be merged into one claim merely because the numbers are equal.

## Evidence required before exchange/public supply submission

1. Canonical production genesis reference and immutable artifact hash.
2. Aggregate genesis allocation total.
3. Evidence linking the running Chain ID 22028 production network to that canonical genesis.
4. Canonical allocation-wallet/accounting method.
5. Balances at a recorded block height.
6. Lock/vesting/governance restrictions for non-circulating balances.
7. Actual issuance/reward/burn/supply-change rules.
8. Reproducible circulating-supply calculation.
9. Governance approval for the 50M → 70M policy change.
10. Governance resolution of the conflicting historical allocation baselines.

A template is provided in `chain/zevaryq-mainnet/registry/zvq-supply-attestation.template.json`.

## Current publication policy

Allowed now:

- **1B ZVQ project maximum/genesis supply baseline**;
- **70M ZVQ proposed initial circulating target**.

Not allowed yet:

- “current total supply = 1B ZVQ” as verified on-chain fact;
- “maximum supply technically enforced = 1B ZVQ”;
- “current circulating supply = 70M ZVQ”;
- exchange/market-data submission of 70M as current circulating supply.

## Safety

This reconciliation is read-only. It does not alter genesis, balances, supply, validators, private keys, treasury, liquidity, DNS, consensus, or RPC write policy.

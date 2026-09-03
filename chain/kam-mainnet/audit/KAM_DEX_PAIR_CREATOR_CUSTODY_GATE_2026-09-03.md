# KAM DEX V2 — PairCreator Custody Gate

Date: 2026-09-03
Status: **PREPARED / NOT AUTHORIZED**
Parent release gate: GitHub Issue #388
Candidate: KAM DEX V2 Revision 3, draft PR #393

This document defines the custody and authorization requirements for the immutable `pairCreator` used by `KAMFactoryV2`. It does not select an address, authorize a signer, deploy V2, create a pair, move treasury funds, or authorize liquidity.

## Objective

Ensure the address passed as `pairCreator` at V2 deployment is governed by an explicit, reviewable custody model before any contract deployment or first-liquidity operation.

## Required external review

The independent smart-contract auditor must assess whether the chosen custody model is appropriate for the V2 launch-control design and whether a multisig or other threshold signer is required.

## Selection gate

Before a `pairCreator` address may be approved, record:

- public address;
- custody type: multisig, institutional custody, hardware-wallet signer policy, or other reviewed model;
- signer identities/roles documented internally without exposing private keys, seed phrases, mnemonics, passwords, or recovery material;
- signer threshold and quorum;
- transaction approval procedure;
- recovery/rotation procedure;
- incident-response procedure for signer loss or compromise;
- separation between treasury authority and pair-creation authority where practical;
- auditor disposition of the chosen model.

## Preferred control posture

A threshold/multisig model should be preferred when operationally practical and when accepted by the independent auditor. A single externally owned account should not be selected merely for convenience if it weakens the reviewed launch-control model.

## Deployment binding verification

After any future externally-approved V2 deployment, but before pair creation:

1. read `pairCreator()` from Factory V2 through public RPC;
2. verify the returned address exactly matches the approved custody record;
3. verify `permissionlessPairCreation()` remains `false`;
4. verify `allPairsLength()` remains `0`;
5. verify Router V2 bindings to Factory V2 and canonical WKAM;
6. verify deployed runtime bytecode against the externally-reviewed frozen source;
7. record receipts, block numbers, runtime hashes, and explorer evidence.

Any mismatch is an automatic **HOLD**.

## First-pair authority

The approved `pairCreator` may only be used for the exact first-pair transaction authorized under the release checklist after:

- external audit Gate B passes;
- quote-asset provenance Gate D passes;
- treasury authorization Gate F passes;
- exact canary amounts and LP recipient are approved;
- pre-transaction state is re-verified.

No open-ended pair-creation authority is granted by this document.

## Permissionless transition

If V2 supports an irreversible transition to permissionless pair creation, that action must not occur automatically. It requires a separate documented decision after the controlled launch phase, external security review disposition, and operational evidence from the canary pool.

## Hard prohibitions

This gate does not authorize:

- storing or sharing private keys/seeds in source control, chat, CI logs, or issue comments;
- deployment of V2;
- production pair creation;
- treasury movement;
- liquidity seeding;
- Connect Wallet or Swap activation;
- any `KAM DEX live` claim.

Current decision: **pairCreator remains unselected pending independent auditor review and explicit custody approval.**

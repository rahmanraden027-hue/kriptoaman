# ZEVARYQ Asset Layer — Governance Role Matrix v1

Status: **DESIGN LOCK / ADDRESSES UNSET**

This document defines the operational separation required before ZUSD, zBTC, or zETH can be deployed. It does not claim that any production Safe has already been created.

## Required role separation

| Role | Recommended control | Minimum policy | Production address |
|---|---|---|---|
| Governance Safe | Multisig | 4-of-5 + 24h contract timelock | UNSET |
| ZUSD Reserve Attestor | Multisig / independent reserve function | 3-of-5 | UNSET |
| ZUSD Mint Operator | Multisig | 3-of-5 | UNSET |
| ZUSD Settlement Operator | Multisig / redemption operations | 3-of-5 | UNSET |
| Bridge Attestor | Multisig / bridge observation function | 3-of-5 | UNSET |
| Bridge Release Operator | Multisig / custody release function | 3-of-5 | UNSET |
| Emergency Guardian | Multisig | 4-of-5, scoped pause <=24h | UNSET |
| Treasury Safe | Multisig, no mint authority | policy TBD | UNSET |

## Separation rules

- Governance Safe SHOULD NOT be the only signer set for reserve attestation, minting, settlement, bridge attestation, release, and treasury.
- Reserve Attestor and Mint Operator SHOULD NOT be represented by the same single EOA.
- Bridge Attestor and Release Operator SHOULD be operationally separated where practical.
- Treasury Safe MUST have no direct token mint permission.
- Emergency Guardian has no mint, settlement, bridge-release, or treasury authority.
- No role address may be a raw private key published in repository, chat, CI logs, or documentation.
- Before deployment, every role address must be proven to be the intended contract/multisig on Chain 22028 or an explicitly documented external control plane.
- Signer identities, quorum, recovery policy and hardware-key/MPC/HSM practices require a separate operational-security review.

## Rotation

Role replacement uses the controller role timelock. Token-controller replacement additionally requires:
- a deployed successor controller;
- successor bound to the same token and Governance Safe;
- no unresolved deposits/redemptions/releases in the outgoing controller;
- post-handoff verification that the old controller cannot create new obligations.

## Current state

All production role addresses are **UNSET**.

This is a hard deployment blocker.

`GOVERNANCE_ROLES_VERIFIED = false`  
`ASSET_LAYER_DEPLOYMENT_AUTHORIZED = false`

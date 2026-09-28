# ZEVARYQ Asset Layer — Audit Handoff v1

Status: **PRE-DEPLOYMENT REVIEW PACKAGE / NOT AN INDEPENDENT AUDIT**

Network: ZEVARYQ Mainnet  
Chain ID: 22028 (`0x560c`)

Scope:
- `ZUSD.sol`
- `zBTC.sol`
- `zETH.sol`
- `ZUSDReserveController.sol`
- `ZAssetBridgeController.sol`
- `ZControlledERC20.sol`
- `ZControllerRoles.sol`

This package is intended for independent security review. It does not certify the contracts, reserve custody, BTC/ETH backing, bridge operators, legal status, or deployment readiness.

## Security objectives

1. No mint path may exceed effective verified backing.
2. A settled ZUSD redemption must permanently consume reserve capacity until a fresh reserve attestation.
3. A pending or completed zBTC/zETH source release must consume bridge backing capacity.
4. Source deposit identifiers are domain-separated and single-use.
5. Settlement and source-release evidence are replay-protected.
6. No EOA may become token controller.
7. Controller handoff must wait until the outgoing controller has no unresolved deposits/redemptions/releases.
8. User balances cannot be arbitrarily burned or confiscated by the controller.
9. Token transfers are free of tax, rebase and blacklist logic.
10. Token accounting has no proxy/delegatecall/selfdestruct path.
11. Emergency controls are scoped and time-bounded.
12. No source code path may broadcast, deploy, bridge, mint or seed liquidity from CI.

## Trust boundaries

The contracts can enforce accounting limits but cannot cryptographically prove that:
- fiat reserve exists in a bank/custodian;
- a Bitcoin custodian controls the claimed BTC;
- an Ethereum custodian/bridge controls the claimed ETH;
- an off-chain attestation is truthful.

Therefore production deployment requires independent evidence for the reserve/custody layer in addition to smart-contract review.

## High-value review targets

Auditors should prioritize:
- reserve outflow accounting across request/settlement/burn sequences;
- bridge backing accounting across mint/burn/release and backing refresh;
- state transitions during emergency pauses;
- controller migration while claims/deposits are pending;
- replay across Chain ID, controller, asset and source-domain boundaries;
- role replacement timelocks;
- stale backing epochs and deposit refresh;
- ERC-20 allowance edge cases;
- integer bounds and state-counter consistency;
- denial-of-service through unresolved claims/deposits;
- malicious or compromised role holders.

## Current automated evidence

The repository currently exercises:
- unit tests;
- 2,048-run fuzz tests for reserve and bridge backing limits;
- stateful invariants;
- CI;
- Security Audit workflow;
- CodeQL;
- source-only guards preventing deploy scripts, broadcast flags and private-key material.

Automated tests are supporting evidence only and do not substitute for an independent audit.

## Explicit exclusions

Not in scope for claiming production readiness:
- custody agreements;
- bank reserve statements;
- BTC/ETH proof of reserves;
- bridge relayer infrastructure;
- multisig signer identities and operational security;
- sanctions/compliance/legal review;
- market-making or liquidity commitments;
- price stability;
- public listing approval.

## Required auditor deliverables

Before deployment authorization can change from false:
- commit SHA reviewed;
- compiler version and EVM target recorded;
- findings categorized by severity;
- all Critical/High findings closed;
- Medium findings either closed or explicitly risk-accepted;
- fuzz/invariant suite rerun on final audited commit;
- bytecode reproducibility verified;
- deployment parameter review completed;
- controller and role addresses verified as intended Safe/contracts;
- written statement of residual risks.

## Authorization state

`ASSET_LAYER_AUDIT_COMPLETE = false`  
`ASSET_LAYER_DEPLOYMENT_AUTHORIZED = false`  
`RESERVE_CUSTODY_PROVEN = false`  
`BTC_BRIDGE_BACKING_PROVEN = false`  
`ETH_BRIDGE_BACKING_PROVEN = false`  
`LIQUIDITY_AUTHORIZED = false`  
`PUBLIC_TRADING_AUTHORIZED = false`

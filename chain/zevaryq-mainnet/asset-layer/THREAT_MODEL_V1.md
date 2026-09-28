# ZEVARYQ Asset Layer — Threat Model v1

Status: **PRE-DEPLOYMENT DESIGN CONTROL**

## Protected assets

- ZUSD reserve-backed supply.
- BTC backing represented by zBTC.
- ETH backing represented by zETH.
- User token balances.
- Redemption escrow.
- Governance/controller integrity.
- Bridge deposit/release evidence.
- DEX integration addresses after future deployment.

## Adversaries

### External attacker
Attempts unauthorized minting, replay, state corruption, reentrancy, allowance abuse, or controller takeover.

### Compromised operational signer
A reserve attestor, bridge attestor, release operator, settlement operator, or emergency guardian may act maliciously.

### Compromised governance
A compromised Governance Safe may attempt controller/role replacement. Timelocks provide reaction time but do not eliminate governance trust.

### Dishonest or insolvent custodian
The on-chain system cannot independently prove off-chain fiat/BTC/ETH exists.

### Source-chain reorganization or false finality
A bridge attestor may observe a deposit that later reorgs or fails finality.

### Market attacker
Attempts to manipulate ZVQ/ZUSD or other future AMM pools. Token contracts intentionally do not define market price.

## Threats and controls

| Threat | Primary control | Residual risk |
|---|---|---|
| Unbacked ZUSD mint | effective reserve ceiling | false reserve attestation |
| Reuse of reserve after payout | outflow-since-attestation accounting | incorrect settlement attestation |
| Unbacked zBTC/zETH mint | effective locked backing ceiling | dishonest bridge/custody attestation |
| Reuse of backing after source release | pending/released backing accounting | false release evidence |
| Deposit replay | canonical deposit ID with chain/controller/asset/source domain | source finality/custody trust |
| Settlement/release replay | single-use evidence hashes | hash may point to false evidence |
| Stale deposit mint | backing epoch match + refresh requirement | compromised attestor can refresh falsely |
| Unsafe controller handoff | contract-only successor + timelock + zero outstanding obligations | compromised Governance Safe |
| Arbitrary user burn | burn limited to controller escrow | governance can replace controller after timelock |
| Hidden transfer economics | no tax/rebase/blacklist code | future code changes require new audit |
| CI secret leakage | source-only workflow guards | external operational environments |
| Emergency abuse | scoped pause + max duration | governance/guardian availability |

## Operational invariants

### ZUSD
- circulating supply excluding redemption escrow must not exceed effective reserve;
- settlement evidence is single-use;
- an expired reserve attestation cannot authorize mint;
- new attestation resets historical outflow because the new snapshot must reflect current reserve.

### zBTC / zETH
- total supply cannot exceed effective locked backing;
- pending source releases reserve backing capacity before release;
- completed releases consume backing capacity until a fresh backing attestation;
- a stale deposit cannot mint until re-attested against the current backing epoch;
- a source event cannot create two deposit IDs for the same controller/asset/domain tuple.

## Failure-mode policy

Fail closed when:
- backing is expired;
- role authorization is absent;
- controller binding is wrong;
- source proof/reference is zero or replayed;
- backing is insufficient;
- controller migration has outstanding obligations.

User transfers SHOULD remain available during reserve/bridge incidents unless an independently reviewed token-core exploit requires stronger emergency action.

## Deployment blockers

Any of the following is a hard deployment blocker:
- unresolved Critical/High audit finding;
- EOA used for Governance/controller operational role where a Safe is required;
- unverified reserve/custody arrangement;
- missing BTC/ETH finality policy;
- missing bridge monitoring and incident runbook;
- inability to reproduce audited bytecode;
- production authorization flag still false.

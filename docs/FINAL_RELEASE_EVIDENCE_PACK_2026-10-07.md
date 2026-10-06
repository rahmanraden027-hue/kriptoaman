# Final Release Evidence Pack — KriptoAman / ZEVARYQ

Status: **PREPARED / NOT EXECUTED**

This pack is the final evidence binder for the KriptoAman Platform, ZEVARYQ Wallet, ZEVARYQ Explorer and ZEVARYQ Mainnet release decision.

A green preparation PR, a successful scheduled workflow, or a visually healthy page is not sufficient on its own. Final status must be backed by current retained evidence.

## Decision levels

### GO

Use **GO** only when the full release evidence is complete:

- Phase 16F 24H PASS from actual artifacts;
- Device Acceptance PASS, including required physical Android evidence;
- Phase 16F 72H PASS from actual artifacts;
- current Explorer/RPC/Wallet verification is green;
- CI, Security Audit and CodeQL are green;
- no unresolved reachable Critical/High issue remains;
- rollback target is buildable and provider redeploy is confirmed;
- manual accessibility checks are complete;
- physical iOS Safari evidence is complete for a full web-surface GO under the existing final GO policy.

### CONDITIONAL GO

Use **CONDITIONAL GO** only when the production core is healthy and safe but one or more non-core manual certification items are still incomplete.

Examples include incomplete manual accessibility evidence, incomplete iOS Safari physical-device evidence, or incomplete scale-certification beyond the normal production envelope.

A CONDITIONAL GO must not be presented externally as proof of unsupported capacity, third-party wallet support, exchange approval, regulatory approval, liquidity, treasury, custody or token backing.

### HOLD

Use **HOLD** whenever any critical production gate is incomplete or failing, including:

- 24H or 72H Phase 16F threshold not met;
- failed security/production-health gate;
- Platform/Wallet/RPC/Explorer identity mismatch;
- unexpected wallet broadcast or RPC write enablement;
- reproducible critical device blocker;
- rollback target unavailable or unbuildable.

HOLD is a release decision, not evidence that the chain itself has failed.

## Required evidence binder

The final decision record should contain references to:

1. Phase 16F 24H workflow run and artifact.
2. Device Acceptance evidence set.
3. Phase 16F 72H workflow run and artifact.
4. ZEVARYQ Explorer browser/public proof.
5. ZEVARYQ Wallet Production Gate.
6. Security Audit.
7. CodeQL.
8. Rollback evidence.
9. Manual accessibility evidence.
10. Final decision commit and timestamp.

Evidence references must point to actual run IDs, artifact IDs, screenshots, recordings or retained documents. Do not fill missing evidence with narrative statements.

## Device evidence

The Device Acceptance Pack from PR #1044 defines the detailed matrix.

For the physical Android evidence set, retain:

- device model;
- Android version;
- Platform home screenshot;
- Wallet home screenshot;
- Connect Wallet screenshot;
- Assets screenshot;
- Receive ZVQ screenshot;
- Send Preview screenshot;
- Swap Preview screenshot;
- short navigation recording;
- confirmation that no transaction was broadcast.

Never include seed phrases, private keys, wallet exports or secret authentication data.

## Network identity evidence

The final binder must show one consistent network identity:

- **ZEVARYQ Mainnet**
- Chain ID **22028**
- Chain ID hex **0x560c**
- native symbol **ZVQ**

Platform, Wallet, RPC and Explorer must agree.

Legacy internal names and compatibility paths may remain as implementation details and do not by themselves constitute public identity drift.

## Stability evidence

Phase 16F must be judged from the aggregator output, not workflow completion alone.

24H PASS requires at least:

- 23 hours evidence span;
- 20 hourly buckets;
- zero failed source runs;
- zero missing required artifacts.

72H PASS requires at least:

- 70 hours evidence span;
- 60 hourly buckets;
- zero failed source runs;
- zero missing required artifacts.

Do not backfill, estimate or infer missing hourly evidence.

## Security and wallet-safety evidence

Before GO:

- CI/build checks are green;
- Security Audit is green;
- CodeQL is green;
- wallet signing and broadcasting remain policy-gated;
- public RPC write methods remain disabled;
- no application flow requests private keys, mnemonics or seed phrases.

A preview-only Send or Swap is valid acceptance evidence. A real transfer is not required.

## Rollback evidence

Record the exact pre-deploy SHA and prove that the known-good build can be redeployed without a chain reset or database reset.

A rollback must restore application code first. It must never reset genesis, Chain ID, validators, treasury, consensus or balances merely to repair a UI/application regression.

## Claims that remain separate from this release decision

This evidence pack does **not** prove:

- circulating supply;
- treasury/custody balances;
- liquidity/backing;
- physical VPS count;
- satellite infrastructure;
- exchange listing;
- regulatory approval;
- one-million simultaneous-user capacity.

Those claims require their own direct evidence and approval paths.

## Final decision record

The final decision should be short and evidence-led:

- baseline commit;
- 24H result;
- Device Gate result;
- 72H result;
- Explorer/RPC/Wallet result;
- security result;
- rollback result;
- accessibility/device result;
- verdict: **GO**, **CONDITIONAL GO**, or **HOLD**;
- explicit remaining limitations.

Until every required field is populated from actual evidence, this pack remains **PREPARED / NOT EXECUTED**.

# KAM DEX V2 pairCreator Custody Policy — 2026-09-03

Status: **DECISION GATE / NO ADDRESS SELECTED**

KAMFactoryV2 uses an immutable `pairCreator`. Because it cannot be rotated after deployment, the address must be chosen before production deployment and must be part of the external security review.

## Preferred control model

Use a multisig-controlled public address if the external auditor agrees with the model and the multisig implementation is available and validated on KAM Mainnet.

Minimum operational objectives:

- no single device compromise should be sufficient to exercise launch authority;
- signer responsibilities are separated;
- signing threshold and emergency procedure are documented;
- the public pairCreator address is recorded in deployment evidence;
- signer private material is never stored in repository, CI, issues, chat or public logs.

## Hard gates

Before selecting the immutable address:

- [ ] external auditor reviews the `pairCreator` control model;
- [ ] exact multisig/authority implementation and runtime are identified;
- [ ] chain 22028 compatibility is verified;
- [ ] signer threshold is approved;
- [ ] backup/recovery and signer-loss procedure is documented;
- [ ] public address is independently checked by at least two operators;
- [ ] dry-run deployment is executed with only the public address;
- [ ] no treasury funds are required merely to choose or validate the public address.

## EOA fallback

A single EOA should not be selected merely for speed. If an external auditor explicitly accepts a temporary EOA for a controlled canary, the acceptance must state the assumptions, duration, exposure limit and migration/retirement plan.

## Final rule

No production V2 deployment until the exact immutable pairCreator public address and custody model are explicitly approved. The current repository intentionally contains no selected pairCreator address and no signing secret.

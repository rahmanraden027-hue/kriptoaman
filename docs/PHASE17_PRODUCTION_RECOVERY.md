# Phase 17 — ZEVARYQ Production Recovery & Final Verification

Base revision: `5610eaa25c8f957b3f0371fd46dec79f70a59201`.
Assessment started 8 October 2026, 21:10 WIB. Overall: **PARTIAL — no production release approval**.

## Logo root cause and repair

[Run 37786232725](https://github.com/rahmanraden027-hue/kriptoaman/actions/runs/37786232725) failed its public placement gate while both origin and public responses returned HTTP 200 and the immutable master SHA-256 `a74790a590757e6f4425d384fdc0cdf40cb8030807eb7c0892ba8aaa4e6fc6cc`.

[Visual Master V3 / PR #1084](https://github.com/rahmanraden027-hue/kriptoaman/pull/1084), commit `907ba7484f63d6c35f830eb6c9d7cebc928ed87e`, intentionally removed the duplicate satellite globe. Its design tests changed from three placements to two: header and primary hero, one Earth brandmark. The public workflow retained the superseded three-placement assertion. This is a stale proof contract, not an asset transport/hash failure and not a missing third production logo.

The repair makes local and public checks call one placement verifier, requiring both approved slots and canonical image sources. Missing, duplicate, misplaced and wrong-source images are rejected. Master logo bytes, production HTML and network configuration are unchanged. The new Phase 17 PR gate independently probes origin/public, default/cache-bypass HTML and master bytes before any merge. Deployment is not needed for this proof-only fix.

## Evidence matrix

| Scope | Status at initial review | Evidence / limitation |
|---|---|---|
| Master asset delivery and integrity | PASS for recorded run | Origin/public HTTP 200 and exact approved SHA in run 37786232725 |
| Old logo placement gate | FAIL | Required 3, observed 2; root cause above |
| Repaired design contract | PASS locally | Missing/duplicate/wrong-source/wrong-slot regression tests |
| RPC chain and Blockscout common block | PASS at 20:26 WIB | [Run 37784394949](https://github.com/rahmanraden027-hue/kriptoaman/actions/runs/37784394949): 22028, both height 603589, distance 0, same hash `0xbc48a5c169713b317fb4760bd310aa8023552876341ce1a78e30a1304b3a7392` |
| Current block progression | PARTIAL pending new observation | New bounded read-only gate samples twice, 12 seconds apart |
| Four QBFT validators / private peers / finality | PARTIAL | [Private run 37749690081](https://github.com/rahmanraden027-hue/kriptoaman/actions/runs/37749690081) queued on protected runner; no executed evidence yet |
| ERC-20 metadata / complete historical index | PARTIAL | New bounded scan independently reads bytecode/name/symbol/decimals at one block; full historical receipt/event inventory still required |
| Native/planned token registry and logos | PARTIAL pending public hash proof | ZVQ is native; zBTC/zETH have null addresses and planned status. Graphic assets do not establish deployed ERC-20 tokens or backing |
| Liquidity endpoint / registry / pair / reserves | PARTIAL pending observation | HTTP and structured reason code collected; when addresses exist, independently read router/factory/pair identities and reserves at one fixed block |
| Protected configuration / transaction boundary | PASS for change scope | No genesis, keys, balances, DNS, validator, chain ID or liquidity edits; no broadcast, transfer, deployment or swap |

Local direct RPC/Explorer probes timed out, and the liquidity request failed at the environment proxy CONNECT stage (HTTP 000). These are evidence-access limitations and must not be represented as confirmed production outages. GitHub-hosted read-only probes provide a separate observation path.

## Private evidence completion

Use only the already-reviewed main-branch `kam-private-mainnet-evidence.yml` on its protected `kam-mainnet-evidence` runner and constrained loopback port 8648. Never execute unreviewed PR code on a validator runner, expose management APIs publicly, or publish credentials/enodes/private addresses. A queued job is not proof of health. Required independent outputs: four unique validators, private peer health, block progression, canonical finalized-tag proof, four-host topology, protected origin and isolated restore gates. Public proposers and block advancement are not finality certificates.

## Liquidity interpretation

`REGISTRY_NOT_CONFIGURED` means the configured router/token registry is absent or invalid; it does not establish that liquidity exists or that no pool exists anywhere. Never guess contract addresses. Positive pool reserves are insufficient for custody, backing, LP ownership/lock and commercial trading approval. The endpoint currently uses multiple `latest` reads; its payload alone is not a same-block snapshot certificate. Phase 17 independently pins contract reads to one verified block. No endpoint runtime behavior is changed by this PR.

## Validation and release rule

Local baseline: 872 tests passed; production build returned exit 0; release budget passed (dist 8.90 MB, JS 6.03 MB, largest JS chunk 0.58 MB); CI's scoped ESLint passed. Added regression tests and PR CI results are recorded in the follow-up evidence report. Relevant CI, Security Audit, CodeQL, Production Finalization and new Phase 17 public gates run on this PR. Other operational/deployment workflows must be reviewed for side effects before invocation; “run all gates” does not authorize protected changes prohibited by the task.

A green inventory workflow is not full-production approval. Keep overall PARTIAL until authoritative private evidence, historical ERC-20 reconciliation, approved address-to-logo bindings and required liquidity/custody/backing evidence are complete. All evidence is timestamped and scoped to its revision and vantage point.

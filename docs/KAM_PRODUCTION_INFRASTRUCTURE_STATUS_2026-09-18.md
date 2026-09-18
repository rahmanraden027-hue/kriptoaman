# KAM Production Infrastructure Status — 2026-09-18

## Operational designation

**Status: PRODUCTION READY — PUBLIC RPC + EXPLORER INFRASTRUCTURE**

This designation applies to the public KAM RPC gateway, KAM Explorer public edge, verified Explorer API path, and the live QBFT data path. It does **not** promote KAM from `mainnet-candidate-not-public` to public/commercial mainnet. Public-mainnet promotion remains controlled by the separate promotion manifest and its evidence gates.

## Verified production evidence

- Network identity: Chain ID **22028 / 0x560c**.
- Consensus: **QBFT**.
- Public RPC gateway: deployed and verified ready through the protected service-binding origin.
- Public RPC security boundary: privileged namespaces remain blocked.
- Explorer public route: `explorer.kriptoaman.com/*` is served by the reviewed Explorer cutover Worker.
- Explorer API route: `explorer.kriptoaman.com/api/v2/*` is served by the reviewed Blockscout API Worker.
- Browser data path: same-origin `/rpc`, avoiding cross-origin RPC dependency.
- Explorer API contract: blocks and stats verified healthy during the production cutover.
- Five-indicator production gate: **PASS**.
  - chain identity: PASS
  - latest block: PASS
  - gas price: PASS
  - QBFT finality evidence: PASS
  - block continuity / block time: PASS
  - ongoing chain advancement: PASS
- Production cutover verification observed block **28,806**, QBFT validator count **4**, average verified block interval **3 seconds**, and head advancement from **28,806 to 28,814** during a 20-second observation window.
- Production Explorer cutover workflow run **35355796579**: **SUCCESS**.
- Public RPC gateway deployment workflow run **35354052517**: **SUCCESS**.
- Latest production checks for commit `a899f6b6470333e0fddee26eed0235f4a0106039`: CI, Security Audit, CodeQL, Production Health, Live Core Readiness, Live Capacity & Network Smoke, Live Site Smoke, Access Resilience, Auth Live Smoke, Android Release Artifacts, iOS App Store Preflight, Production Presentation Provenance, KAM Document Live Smoke, and KAM Explorer Origin Cutover all completed successfully.

## Public-mainnet promotion boundary

The repository promotion manifest intentionally remains fail-closed. The following evidence gates are still false and must not be bypassed:

1. `fourDistinctValidatorHosts`
2. `dedicatedProtectedRpcOrigin`
3. `continuity24h`

Until all three are independently evidenced and reviewed, the canonical network status remains `mainnet-candidate-not-public` and commercial launch remains disabled.

## Change-safety statement

The production-readiness work did not reset or rewrite the KAM chain, database, historical blocks, validator keys, treasury data, or production secrets. Changes were limited to reviewed RPC/Explorer gateway behavior, verified-data presentation, deployment gates, and fail-closed routing validation.

## Effective time

Designation recorded after successful production verification on **2026-09-18 UTC**.

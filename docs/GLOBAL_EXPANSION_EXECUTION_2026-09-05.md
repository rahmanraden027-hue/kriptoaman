# KriptoAman & KAM — Global Expansion Execution Plan

Date: 2026-09-05
Status: ACTIVE EXECUTION / EVIDENCE-GATED
Master tracker: Issue #465

## Objective

Advance KriptoAman and KAM from the current production-readiness state to evidence-backed global expansion without bypassing infrastructure, security, market-integrity, legal, wallet, listing, mobile-distribution, or country-specific compliance gates.

## Current P0 truth

The KAM promotion-readiness manifest currently has exactly three false hard gates:

1. `fourDistinctValidatorHosts`
2. `dedicatedProtectedRpcOrigin`
3. `continuity24h`

All final-public-mainnet wording remains blocked until those three gates are independently evidenced and the authoritative manifest is reviewed and updated.

### P0 operator sequence

1. Complete the real topology required by `chain/kam-mainnet/FOUR_HOST_EVIDENCE_COLLECTION.md`:
   - validator 1 on persistent host/failure domain 1;
   - validator 2 on persistent host/failure domain 2;
   - validator 3 on persistent host/failure domain 3;
   - validator 4 on persistent host/failure domain 4;
   - dedicated RPC/sentry on a fifth separate protected host identity.
2. Collect redacted host attestations on the actual hosts.
3. Assemble and locally verify the four-host topology evidence on the protected evidence runner.
4. Run `KAM Four-Host Redundancy Gate` and retain the redacted artifact/run reference.
5. Verify the public Cloudflare RPC path uses the dedicated protected RPC/sentry origin and cannot bypass directly to validator management RPC.
6. Only after topology and protected-origin proof are final, start a fresh continuity window.
7. Accumulate the required consecutive real-time readiness evidence. Historical samples from a prior topology must not be reused.
8. Re-run final strict promotion gate.
9. If and only if all gates pass, use a separate reviewed PR to change authoritative status from `mainnet-candidate-not-public` to public mainnet without changing genesis, Chain ID, supply, balances, treasury, signing material, or chain history.

## P1 — Independent KAM DEX V2 security review

Primary issues: #388, #389, #418, #441

Current state:
- V2 Revision 3 candidate is prepared for attributable independent review.
- Final packages/follow-ups were sent to ChainSecurity, Trail of Bits and OpenZeppelin.
- No attributable external audit response/proposal is recorded yet.
- Production liquidity, public Swap, treasury liquidity movement and `KAM DEX live` claims remain HOLD.

Required next evidence:
- named independent reviewer/team;
- exact frozen source/blob/commit scope accepted;
- severity-rated findings;
- remediation and re-review where required;
- explicit GO/HOLD for controlled V2 deployment and small canary liquidity.

## P2 — Legitimate bridge / counter-asset

Primary issues: #375, #394, #466

Circle guidance received on 2026-09-04 supports using the Bridged USDC Standard direction as the sensible interim architecture path. This is not native USDC/CCTP approval and is not endorsement of a specific bridge.

Provider evaluation:
- Hyperlane: highest-priority testnet/custom-chain POC candidate; production use still requires architecture/security/provider review.
- Wormhole: current supported-network documentation does not list KAM Mainnet; explicit onboarding is required before treating it as a production KAM route.
- Axelar/LayerZero/other providers: evaluate only from current official documentation plus attributable support for Chain ID 22028.

Production remains blocked until exact contracts, roles, backing/collateral path, withdrawal path, admin/upgrade controls and independent security review are documented.

## P3 — Controlled DEX canary

Only after independent DEX audit GO and legitimate counter-asset/bridge approval:

1. Freeze final reviewed V2 source/compiler configuration.
2. Approve `pairCreator` custody/signing model.
3. Deploy FactoryV2 and RouterV2 with separately recorded authorization.
4. Verify runtime/source identity and constructor bindings.
5. Create exactly one approved canary pair.
6. Seed only deliberately small authorized liquidity.
7. Run real wrap/unwrap, add/remove LP, bidirectional swap, slippage/deadline, receipt/explorer and counter-asset withdrawal tests.
8. Enable Connect Wallet and Swap only after every test passes.

## P4 — Wallet/network discovery

Primary issues: #460, #305

Verified current state:
- canonical ethereum-lists/chains metadata for Chain ID 22028 exists;
- MetaMask custom EVM path is available, but default/preloaded support is not evidenced;
- Trust Wallet integration request has been sent, but no acceptance/review response is recorded;
- Coinbase custom EVM configuration must not be represented as Coinbase-supported-network status.

Completion rule: record provider-by-provider attributable disposition: accepted/listed, under review with reference, rejected with reason, or custom-network-only.

## P5 — CoinGecko / CoinMarketCap

Primary issues: #461, #305

Current evidence:
- CoinGecko/GeckoTerminal chain request ticket: `136597`.
- CoinMarketCap chain request ticket: `1450763`.
- CoinGecko acknowledged chain details can be reviewed once submitted; this is not approval.
- CMC sent a paid proposal describing an exchange-listing/update scope that did not match the submitted chain-addition request. KriptoAman explicitly did not authorize that payment/invoice and asked for the correct chain-review path.

KAM cryptoasset listing remains separate from chain addition. Do not submit or publish synthetic/project-declared price, volume, liquidity or market-cap evidence.

## P6 — Application resilience and scale

Primary issues: #275, #301, #299, #166

Required before global-scale claims:
- production standby origin and shared auth/session continuity;
- controlled primary-origin drain proof;
- isolated staging before load tests;
- progressive capacity tests with p50/p95/p99/error evidence;
- backup/restore evidence;
- dependency-degradation tests;
- canary and rollback under load;
- production telemetry and actionable alerts;
- repository security/change-control protections.

Do not claim `1M-user-ready` until the final certification gate in #299 is supported by measured evidence.

## P7 — Mobile distribution

Required evidence:
- signed Android release artifact;
- production Google Play publication independently verified;
- iOS/App Store readiness and publication when pursued;
- applicable financial-services/store-policy checks;
- public availability claims only after the corresponding store listing is live.

## P8 — Corporate / legal / commercial

Required:
- authoritative AHU/NIB/NPWP/address facts synchronized with public materials;
- legal/disclaimer pages remain factual;
- first real third-party enterprise pilot under #444;
- legitimate invoice/payment/delivery/accounting evidence;
- no internal/treasury movement counted as customer revenue.

## P9 — Global market-intelligence platform

Primary issues: #447, #449, #450

Execution order:
1. canonical asset identity and symbol-collision safety;
2. cross-provider observation/consensus and anomaly detection;
3. historical OHLCV/time-series layer;
4. venue/liquidity intelligence with provenance;
5. on-chain intelligence;
6. API versioning, keys/quotas/telemetry/SLOs;
7. provider-license/redistribution review;
8. AI summaries clearly separated from source facts and deterministic metrics.

## P10 — Country expansion

Expand only where product scope and local legal/compliance requirements have been reviewed. International marketing must cite verified milestones rather than forecasts or unsupported claims.

Recommended market-entry evaluation dimensions:
- legal/regulatory feasibility;
- demand and potential enterprise partners;
- banking/payment availability;
- data/privacy obligations;
- app-store availability;
- local language/support requirements;
- infrastructure latency/reliability;
- permitted product scope.

## Final GO definition

Global expansion is FINAL only when:

1. KAM production infrastructure promotion evidence is complete;
2. any public DEX offering has independent security audit + controlled-launch evidence;
3. any public bridged asset/liquidity claim has verified provider/provenance/withdrawal evidence;
4. wallet and listing claims match attributable provider status;
5. production failover, restore, staging, monitoring and scale evidence are current;
6. mobile distribution claims match live store publication;
7. corporate/legal facts are current;
8. at least one genuine third-party commercial use case is evidenced;
9. market-data provenance/quality controls support international use;
10. country-specific legal/compliance review precedes regulated-service expansion.

## Operating principle

**Mainnet → Independent Audit → Bridge/Counter-asset → Canary DEX → Wallets → Listings → Resilience/Scale → Mobile → Enterprise → Market Intelligence → Country Expansion.**

Any hard-gate failure returns the affected phase to HOLD. No marketing milestone can override a failed technical, security, provider, market-integrity, or legal gate.

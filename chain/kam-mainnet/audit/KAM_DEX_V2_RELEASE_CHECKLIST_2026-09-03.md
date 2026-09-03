# KAM DEX V2 Revision 3 — Final Release Checklist

Status: **AUDIT-READY / PRODUCTION HOLD**

This checklist is intentionally sequential. A later gate must not be executed because an earlier gate merely looks likely to pass.

## Gate A — Frozen source

- [x] V2 Revision 3 frozen for independent review.
- [x] Factory/Pair/Router/WKAM source blob identifiers recorded.
- [x] V1 source/runtime identity already proven independently by internal attestation.
- [x] V2 Foundry regression suite passes internally.
- [x] V2 guarded deployment scripts compile in CI.

## Gate B — Independent external audit

- [ ] Auditor accepts exact Revision 3 frozen scope.
- [ ] Attributable report delivered.
- [ ] Factory V2 launch controls reviewed.
- [ ] Pair V2 first-seed and counterfactual pre-funding recovery reviewed.
- [ ] Router V2 deadlines, symmetric minimums and reentrancy lock reviewed.
- [ ] Pair invariant, fee, mint, burn, swap and LP accounting reviewed.
- [ ] WKAM native-value paths reviewed.
- [ ] Malicious/non-standard token behavior reviewed.
- [ ] Critical/High findings resolved and re-reviewed, or release remains HOLD.
- [ ] Auditor gives explicit GO/HOLD for a small controlled canary deployment.

## Gate C — Deployment authority / pairCreator

- [ ] Choose the exact public `pairCreator` address.
- [ ] Independent reviewer confirms the custody model.
- [ ] Prefer multisig if recommended by auditor.
- [ ] Signer identities/roles are documented internally without exposing secrets.
- [ ] Required signer threshold is documented.
- [ ] Recovery/rotation operational procedure is documented.
- [ ] No private key, seed phrase, mnemonic or keystore password is committed or shared in chat/logs.

## Gate D — Quote asset and bridge provenance

- [ ] External provider explicitly supports KAM Mainnet Chain ID 22028.
- [ ] Origin asset is identified and legitimate.
- [ ] Destination contract address is supplied/confirmed by provider documentation or attributable provider response.
- [ ] Symbol and decimals verified on-chain.
- [ ] Lock/mint, burn/mint or escrow model documented.
- [ ] Withdrawal path back to the origin chain verified.
- [ ] Provider/bridge contracts and security model independently reviewed for the intended route.
- [ ] No locally created token is represented as canonical USDC/USDT/WETH.

Priority remains official native USDC/CCTP if Circle supports Chain ID 22028. A bridge-backed alternative may be considered only if its provenance and withdrawal path are explicit and the independent reviewer accepts the integration risk.

## Gate E — V2 canary deployment

- [ ] Explicit deployment approval recorded after Gates B-D pass.
- [ ] Run no-secret `PrepareKAMDEXV2Deployment` simulation with approved public pairCreator.
- [ ] Verify simulation outputs and bindings.
- [ ] Broadcast Factory V2 + Router V2 only.
- [ ] Record transaction hashes and blocks.
- [ ] Verify runtime bytecode against frozen audited source.
- [ ] Verify Factory pairCreator binding.
- [ ] Verify permissionless mode remains false.
- [ ] Verify pair count remains zero.
- [ ] Verify Router Factory/WKAM bindings.

**Hard stop:** successful contract deployment does not authorize pair creation or liquidity.

## Gate F — Treasury authorization

- [ ] Exact WKAM amount approved.
- [ ] Exact quote-asset amount approved.
- [ ] Maximum exposure approved.
- [ ] Initial implied pool ratio reviewed.
- [ ] LP recipient approved.
- [ ] Transaction signer/threshold approved.
- [ ] Slippage/abort parameters approved.

## Gate G — Atomic first pair + canary liquidity

Immediately before signing:

- [ ] Re-read Factory pair count and target `getPair`.
- [ ] Re-confirm quote-asset bytecode, symbol, decimals and provenance.
- [ ] Re-confirm treasury balances/allowances.
- [ ] Re-confirm V2 runtime hashes and bindings.
- [ ] Re-confirm permissionless pair creation remains false.
- [ ] Confirm exact canary seed amounts match authorization.

Then and only then:

- [ ] Approve Factory V2 for the exact assets/amounts or tightly bounded amounts.
- [ ] Call atomic `createPairAndSeed()`.
- [ ] Verify transaction receipt.
- [ ] Verify created Pair V2 runtime identity.
- [ ] Verify exact reserves.
- [ ] Verify LP supply and LP recipient balance.
- [ ] Verify counterfactual pre-funding recovery event/state if applicable.

Any unexpected state => **ABORT / HOLD**. Do not retry with looser constraints.

## Gate H — Real smoke test

Using deliberately small amounts:

- [ ] KAM -> quote asset swap succeeds.
- [ ] quote asset -> KAM swap succeeds.
- [ ] token -> token path if applicable succeeds.
- [ ] slippage/minimum-output rejection tested.
- [ ] expired deadline rejection tested.
- [ ] add liquidity succeeds.
- [ ] remove liquidity succeeds.
- [ ] bridge withdrawal back to origin succeeds.
- [ ] receipts and reserves are visible through public RPC/explorer.
- [ ] no unexplained balance/reserve delta remains.

## Gate I — Public activation

Only after all prior gates pass:

- [ ] Update public deployment manifest with verified V2 addresses/hashes.
- [ ] Update KAM DEX UI to audited V2 addresses.
- [ ] Enable Connect Wallet after chain/RPC/balance checks.
- [ ] Enable Swap after real two-way swap evidence.
- [ ] Publish factual liquidity/reserve data only from on-chain state.
- [ ] Do not fabricate price, TVL, volume or APY.
- [ ] Do not claim third-party listing/verification unless separately confirmed.

## Final definition of LIVE

KAM DEX may be described as **LIVE** only when:

1. audited V2 production contracts are deployed and runtime-verified;
2. a legitimate externally-backed counter-asset route exists;
3. real controlled liquidity exists;
4. buy/sell work in both directions;
5. wrap/unwrap and bridge withdrawal paths work as applicable;
6. reserves and receipts are public;
7. public RPC/explorer are stable;
8. no unresolved Critical/High release blocker remains.

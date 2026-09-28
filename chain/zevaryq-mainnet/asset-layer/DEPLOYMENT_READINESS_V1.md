# ZEVARYQ Asset Layer — Deployment Readiness v1

Status: **HOLD**

The implementation is source-only. Passing CI does not authorize deployment.

## Gate A — Source integrity
- [x] Chain ID hard-bound to 22028.
- [x] Solidity compiler target recorded as 0.8.24.
- [x] Paris-compatible build path.
- [x] No deploy script in Asset Layer directory.
- [x] No CI broadcast flag/private key.
- [x] No proxy/delegatecall/selfdestruct.
- [x] No token named USDT/USDC.
- [x] Unit/fuzz/invariant tests exist.
- [ ] Independent audit completed on final commit.

## Gate B — Governance
- [ ] Governance Safe address selected.
- [ ] Governance threshold verified.
- [ ] Reserve Attestor Safe selected.
- [ ] ZUSD Mint Operator Safe selected.
- [ ] ZUSD Settlement Operator Safe selected.
- [ ] Bridge Attestor Safe selected.
- [ ] Bridge Release Operator Safe selected.
- [ ] Emergency Guardian Safe selected.
- [ ] Signer separation reviewed.
- [ ] Recovery/rotation procedure tested.

No private key or mnemonic belongs in repository, chat, CI variables used for read-only tests, or public logs.

## Gate C — ZUSD backing
- [ ] Reserve custodian selected.
- [ ] Account ownership/legal entity verified.
- [ ] Redemption rail documented.
- [ ] Reserve attestation format defined.
- [ ] Independent reserve evidence available.
- [ ] Maximum attestation age decided.
- [ ] Pilot issuance limit approved.

Until these are complete, ZUSD must not be represented as a live USD-backed stablecoin.

## Gate D — zBTC backing
- [ ] BTC custody/bridge architecture selected.
- [ ] Source deposit finality policy defined.
- [ ] Deposit observation/attestation procedure tested.
- [ ] Redemption/release procedure tested.
- [ ] Proof-of-reserve process documented.
- [ ] Pilot BTC amount approved.

## Gate E — zETH backing
- [ ] ETH custody/bridge architecture selected.
- [ ] Ethereum source contract/event model defined.
- [ ] Finality policy defined.
- [ ] Redemption/release procedure tested.
- [ ] Proof-of-reserve process documented.
- [ ] Pilot ETH amount approved.

## Gate F — Deployment rehearsal
- [ ] Final audited commit frozen.
- [ ] Constructor parameters documented.
- [ ] Deterministic deployment addresses predicted.
- [ ] Gas estimated on Chain 22028.
- [ ] No-broadcast fork/mainnet simulation passes.
- [ ] Bytecode hashes archived.
- [ ] Explorer verification plan prepared.
- [ ] Rollback/abort criteria documented.

## Gate G — Post-deploy verification
- [ ] Runtime bytecode matches audited build.
- [ ] Token metadata verified.
- [ ] Controller bindings verified.
- [ ] Role addresses verified.
- [ ] Initial supply = 0 for ZUSD/zBTC/zETH.
- [ ] No liquidity pair created automatically.
- [ ] No mint occurs during deployment.

## Gate H — Pilot issuance
Separate explicit authorization required for each asset:
- exact backing evidence;
- exact mint amount;
- exact recipient;
- exact transaction preview;
- final signer confirmation.

## Gate I — Liquidity/public trading
Deployment does not authorize liquidity.

Before ZVQ/ZUSD or other pairs:
- backing live and independently evidenced;
- pilot mint verified;
- pair ratio reviewed;
- implied initial price disclosed as an AMM initialization ratio, not an external market valuation;
- maximum pilot liquidity approved;
- add/remove liquidity and buy/sell smoke tests planned.

## Current verdict

**HOLD — source candidate hardened; backing, governance, audit and deployment evidence incomplete.**

`ASSET_LAYER_DEPLOYMENT_AUTHORIZED = false`  
`LIQUIDITY_AUTHORIZED = false`  
`PUBLIC_TRADING_AUTHORIZED = false`

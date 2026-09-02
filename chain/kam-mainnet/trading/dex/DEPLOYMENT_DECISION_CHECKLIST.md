# KAM DEX Production Deployment Decision Checklist

Status: **REVIEW ONLY — NO MAINNET BROADCAST AUTHORIZED**

This checklist is the human approval gate before any KAMFactory or KAMRouter deployment transaction is signed.

## Verified technical baseline

- Network: KriptoAman Mainnet
- Chain ID: `22028`
- EVM target: `paris`
- Canonical WKAM: `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A`
- DEX contract tests: required to remain green
- Deployment simulation: required to remain green
- Read-only WKAM RPC verification: required to remain green
- No-broadcast mainnet dry run: required to remain green

## Required explicit decisions before broadcast

- [ ] Independent contract audit completed, or explicit written risk acceptance recorded.
- [ ] Exact reviewed Git commit selected for deployment.
- [ ] Deployment wallet address identified and reviewed outside source control.
- [ ] Deployment wallet has only the minimum KAM required for gas.
- [ ] Current RPC chain ID re-verified as `22028` immediately before signing.
- [ ] Canonical WKAM runtime bytecode re-verified immediately before signing.
- [ ] KAMFactory creation bytecode built from the selected commit.
- [ ] KAMRouter creation bytecode built from the same selected commit.
- [ ] Router constructor is confirmed as `(verifiedFactoryAddress, canonicalWKAM)`.
- [ ] Factory deployment receipt and runtime bytecode will be independently verified before Router deployment.
- [ ] Router deployment receipt, constructor bindings and runtime bytecode will be independently verified after deployment.
- [ ] Explicit human approval to broadcast Factory deployment recorded.
- [ ] Explicit human approval to broadcast Router deployment recorded after Factory verification.

## Required decisions before any pool or liquidity action

- [ ] Legitimate counter-asset provenance verified.
- [ ] Pair selected explicitly.
- [ ] Initial reserve quantities approved.
- [ ] Implied initial price calculated and reviewed.
- [ ] Expected slippage reviewed for small and target trade sizes.
- [ ] Treasury authorization recorded.
- [ ] Small controlled liquidity amount approved before any larger funding.
- [ ] Small real swap smoke test approved only after liquidity is live.

## Prohibited shortcuts

Do not commit a private key, mnemonic, keystore password or signing secret. Do not create a fake stablecoin and present it as canonical USDT/USDC. Do not seed liquidity automatically from CI. Do not claim market price, TVL, volume, listing or market demand from deployment alone.

## Current decision

**NO-GO FOR BROADCAST** until every required pre-broadcast checkbox above is completed and explicit deployment authorization is recorded.

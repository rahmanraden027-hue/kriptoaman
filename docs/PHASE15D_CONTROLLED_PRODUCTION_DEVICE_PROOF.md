# Phase 15D — Controlled Production Deployment & Device Visual Proof

Status: **IMPLEMENTED ON REVIEW BRANCH**

## Objective

Prove that the current KriptoAman command center release is not only merged but actually visible on the production origin after the Git-connected Cloudflare Pages deployment settles.

## Controlled release marker

HomeV10 exposes:

`data-command-release="phase15d"`

The production browser proof requires this marker before passing.

## Device proof

The existing read-only HomeV10 production acceptance now validates:

- mobile viewport: **390 × 844**
- desktop viewport: **1440 × 1000**
- no horizontal overflow
- market ticker is `LIVE`
- at least five real market assets are visible
- Verify Anything input/action is available
- ZEVARYQ on-chain block is numeric
- ZEVARYQ network state is `VERIFIED` and `SYNCED`
- on-chain and network block heights remain within 25 blocks
- command hierarchy is exactly:
  `market → intelligence → network → evidence`
- no uncaught JavaScript errors
- required production APIs return successful responses

The workflow captures full-page screenshots plus `proof.json` and retains the artifact for 30 days.

## Commit status

After the live-browser job completes, the workflow publishes:

`kriptoaman/home-v10-production-visual-proof`

The status is attached to the exact `main` commit that triggered the production proof.

## Deployment boundary

Cloudflare Pages remains the production hosting path. Phase 15D does not create a parallel Vercel deployment and does not change DNS, Cloudflare project configuration, chain state, genesis, validators, keys, balances, transactions, RPC write policy, wallet signing/broadcasting, or token state.

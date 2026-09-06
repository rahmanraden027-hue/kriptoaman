# KriptoAman Ecosystem Checkpoint — 2026-09-06

This document is the non-secret operational checkpoint for the KriptoAman ecosystem. It separates evidence verified by automated/public probes from operator-reported observations and from work that is still pending.

## Safety boundary

Do not place seed phrases, private keys, wallet secret material, API keys, passwords, database URLs, or other credentials in this document or in Git history.

A merged implementation is not the same thing as an executed on-chain action, a third-party listing, a regulator approval, or an app-store publication. Claims must follow evidence.

## 1. Verified production core

Evidence timestamp: 2026-09-06 around 07:12 UTC from the production readiness workflows.

The `Live Core Readiness Smoke` reported **5/5 VERIFIED (100%)**:

- Market: `assetCount=4986`, source `coinlore`, `healthy=true`.
- Multi-chain network health: `21/21` online.
- Auth endpoint: reachable with expected unauthenticated `401` behavior.
- KYC readiness: `ready=true`; database, session, API, workflow, and webhook checks all true.
- KAM: `verified=true`, Chain ID `22028`, block `488140`, publication state `mainnet-candidate-rpc-verified`.

The separate capacity/network smoke also confirmed all 21 configured public networks online and the public market snapshot above the 4,500-asset operational threshold.

## 2. KAM RPC and Explorer

KAM network identity:

- Chain ID: `22028` (`0x560c`).
- Public RPC: `https://rpc.kriptoaman.com`.
- Public Explorer: `https://explorer.kriptoaman.com`.

The 2026-09-06 Blockscout Health Proof classified the explorer core as **healthy**:

- RPC head: `488129`.
- Explorer indexed head: `488128`.
- Height distance: `1` block.
- Known transaction receipt: available and successful.
- Explorer blocks API: healthy, 50 items returned.
- Explorer stats API: healthy; `totalTransactions=85`, `transactionsToday=1` at probe time.
- Transactions chart endpoint: healthy with 27 points.
- Market chart endpoint: HTTP healthy but returned 0 points, therefore market-dependent presentation must not be fabricated.

### Explorer presentation decision

PR #509 (`Finalize KAM Explorer homepage presentation`) was merged. The reviewed frontend-only helper now hides unverified homepage stats/charts and the gas tracker until their backing data is independently healthy. It also refuses to report success if the public SSR page still contains `Placeholder Counter` or `Gas tracker`.

**Pending host action:** the merged configuration still has to be applied on the Blockscout host through the reviewed `KAM Explorer Host Apply` workflow (self-hosted `kam-explorer-host` runner) or the same reviewed helper on that host. This action is frontend/proxy-only and must not restart validators or modify chain state.

## 3. sKAM on Solana

Pinned public identifiers:

- Token: Solana KAM (`sKAM`).
- Mint: `Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi`.
- Supply target/fixed launch supply: `1,000,000,000 sKAM`.
- Decimals: `9`.
- Raydium CPMM pool: `7vW6cmvM2YYHzoLTx7qJqACzj3X2Rq236b83YHpqCbyD`.
- Canonical WSOL: `So11111111111111111111111111111111111111112`.

The Phantom authority-revocation implementation and fresh-blockhash retry hardening are merged. Operator UI evidence in the launch session showed both Mint Authority and Freeze Authority as `NULL · SECURE`. Before using that state in a formal external listing submission, re-run the read-only on-chain audit and retain its timestamped evidence.

### Liquidity policy

A staged Raydium liquidity deposit was operator-confirmed in the launch session:

- `0.05 SOL`.
- `246,694.096712125 sKAM`.

This was the successful first smoke-test deposit to the existing sKAM/SOL CPMM pool.

PR #503, the old 1B-at-once liquidity flow, is **closed without merge and marked superseded**. The approved operational policy is now:

1. re-read current pool reserves before every increase;
2. add liquidity incrementally;
3. preserve SOL for fees and operations;
4. verify TVL, price impact and pool identity after each stage;
5. perform bounded buy/sell smoke tests only when liquidity supports them;
6. require explicit wallet approval for each irreversible deposit.

Do not manufacture volume or perform self-trading to make market activity appear larger.

## 4. sKAM governance

Squads v4 governance foundation code is merged with the reviewed target:

- three pinned public members;
- threshold `2-of-3`;
- 24-hour global timelock;
- no unilateral config authority.

Pinned member public keys:

1. `5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK`
2. `9kyjft13umxb92C11qr9v6L8HnJ3t1cZuDohc5wLrFqB`
3. `9qhMmV5T9gfPQ4yCZPMVgDbHUR9F65c3xBKnEmWLYxT2`

**Important:** merged governance code does **not** prove that the Squads multisig has been created on-chain. On-chain creation remains blocked until each signer is independently controlled/attested and the creator key resolves to the pinned Signer 1 on the operator-controlled machine. Never copy signer secret material into GitHub or chat.

## 5. MarketEdge

PR #508 (`MarketEdge v1.5 route learning and leaderboard`) is merged into `main`.

Current security model:

- `PAPER_ONLY`.
- no wallet key is loaded;
- no transaction can be signed;
- no real funds are moved;
- multi-token / multi-venue quote comparison;
- route cooldown for repeated `NO_ROUTES_FOUND` pairs;
- observation logging;
- opportunity leaderboard;
- example liquid-market coverage for USDC, JUP, RAY and BONK;
- Jupiter request pacing/backoff is enabled.

During the operator test, MarketEdge correctly rejected negative estimated round trips instead of forcing trades. The older background process may still be running the previous config until Termux is updated/restarted from `main`.

A live-money executor is **not approved** until paper evidence is sufficient, quote-vs-fill risk is measured, a separate limited-capital wallet is used, and hard daily-loss / slippage / stale-quote / kill-switch controls are implemented.

## 6. External listings and distribution

As of this checkpoint:

- CoinGecko: no verified `Solana KAM` / sKAM listing was confirmed.
- CoinMarketCap: no verified `Solana KAM`, `sKAM`, or `KriptoAman` asset listing was confirmed.
- DEX availability is separate from CoinGecko/CoinMarketCap listing status.
- Manual wallet configuration is not an official wallet registry listing.
- Google Play and Apple App Store publication are not considered complete until the public store listings themselves are independently visible.

Do not announce an external listing from a submission form, metadata file, or pending application alone.

## 7. Current finalization order

1. Apply the merged Explorer frontend-only configuration on the Blockscout host and retain before/apply/after artifacts.
2. Re-run Blockscout public health and verify the homepage no longer exposes placeholder counters or unavailable gas data.
3. Update the Termux MarketEdge checkout to current `main`, restart the PAPER_ONLY scanner with the v1.5 liquid-market config, and collect observations/leaderboard data.
4. Continue sKAM/SOL liquidity in small staged increases, with verification after every stage.
5. Re-run the read-only sKAM audit before any formal external listing claim.
6. Complete independent signer attestation and only then create/verify Squads governance on-chain.
7. Submit/verify CoinGecko, CoinMarketCap and wallet-registry metadata using evidence, not assumptions.
8. Complete Android/iOS release gates and only mark a store as live when its public listing is verifiable.

## 8. Definition of “final”

KriptoAman should only be described as fully finalized for a particular surface when that surface has direct evidence. Website readiness, KAM network readiness, explorer presentation, sKAM authority state, liquidity, governance, third-party listings, and mobile-store distribution are separate gates and can reach final status at different times.

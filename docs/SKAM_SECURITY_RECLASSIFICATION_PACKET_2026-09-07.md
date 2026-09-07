# sKAM Security Reclassification Packet — 2026-09-07

This packet records non-secret evidence for third-party security review of Solana KAM (sKAM). It is not an endorsement, investment statement, or request to suppress legitimate warnings.

## Identity

- Project: KriptoAman
- Token: Solana KAM (sKAM)
- Network: Solana mainnet
- Mint: `Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi`
- Token program: Token-2022 (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`)
- Raydium CPMM pool: `7vW6cmvM2YYHzoLTx7qJqACzj3X2Rq236b83YHpqCbyD`
- Canonical WSOL: `So11111111111111111111111111111111111111112`
- Metadata URI: `https://kriptoaman.com/token/skam.json`
- Logo URI: `https://kriptoaman.com/token/skam-logo.png`
- Public security evidence: `https://kriptoaman.com/token/skam-security-evidence.json`
- Project site: `https://kriptoaman.com`

## Fresh read-only evidence

A read-only GitHub Actions audit was re-run on 2026-09-07 at approximately 02:30 UTC. It performed no wallet signing, authority change, liquidity movement, swap, mint, burn, or token transfer.

Observed state at that audit time:

- Integrity check: PASS
- Launch identity: LIVE_VERIFIED
- Supply: 1,000,000,000 sKAM
- Decimals: 9
- Mint authority: NULL
- Freeze authority: NULL
- Public metadata: HTTP 200
- Public logo: HTTP 200, image/png
- Raydium CPMM pool identity matched the pinned sKAM/WSOL pool
- Jupiter quote route found in both directions (SOL -> sKAM and sKAM -> SOL)
- DEX Screener audit observation at that time: approximately USD 52.86 liquidity, 4 buys / 1 sell over 24h, approximately USD 6.36 24h volume
- Operator-controlled sKAM balance at that audit time: 998,764,419.3527031 sKAM (~99.876442% of total supply)

The DEX Screener pair should be rechecked directly through its current API/UI before treating profile/index visibility as finalized. A later public web-search pass did not independently surface the pair page, even though the Raydium pool and on-chain liquidity transaction are confirmed.

## Confirmed post-audit liquidity transaction

A treasury-controlled staged liquidity addition was signed by the pinned operator wallet through Phantom and confirmed on Solana mainnet.

- Signature: `pg4BnKRoD18kUyBrhmgPc9xqftso85jPkst7b9RvygUppW7F1KTk7Z9jzGtdufMPhrN8CZH65nBUFU8vggDqNAh`
- Solscan: `https://solscan.io/tx/pg4BnKRoD18kUyBrhmgPc9xqftso85jPkst7b9RvygUppW7F1KTk7Z9jzGtdufMPhrN8CZH65nBUFU8vggDqNAh`
- Block: 444961704
- Timestamp: 2026-09-07 03:21:21 UTC
- Result: SUCCESS
- Signer: `5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK`
- Operator SOL debit: 0.002 SOL
- Raydium WSOL-vault credit: 0.00198 WSOL
- Operator sKAM debit / Raydium sKAM-vault credit: 9,769.086228475 sKAM
- LP-token credit to operator-controlled account: 4.396820048 LP tokens
- Operator sKAM balance after transaction: 998,754,650.266474572 sKAM (~99.875465% of fixed supply)
- Raydium WSOL vault observed before/after: 0.250154091 -> 0.252134091
- Raydium sKAM vault observed before/after: 1,234,221.058831351 -> 1,243,990.145059826

The exact on-chain balance changes are intentionally used instead of the front-end's pre-signing estimate. The transaction is evidence of a real liquidity contribution; it does not by itself demonstrate deep liquidity or sufficient market activity.

## Material risks that remain

The token should not be represented as fully hardened while these conditions remain:

1. Liquidity remains extremely thin. The displayed price can move sharply and does not imply that large balances can be sold near the displayed price.
2. Token custody remains highly concentrated in operator-controlled accounts. The intended reserve/governance architecture should be independently established and verified before describing treasury distribution as decentralized or governance-controlled.
3. Metadata update authority and metadata-pointer authority remain active. This is intentional while metadata/logo indexing is being finalized, but the authority should later be moved to verified multisig governance or made immutable according to the approved governance policy.
4. Low organic market activity remains a third-party risk-classification signal. Do not self-trade, manufacture volume, or create artificial activity to influence classification.

## MetaMask / Blockaid warning remediation

A MetaMask Solana token warning can be informed by Blockaid and other security/risk signals. A clean mint/freeze audit does not automatically clear a wallet classification.

Recommended order:

1. Preserve the current mint/freeze-null state.
2. Preserve the confirmed liquidity signature and public evidence JSON.
3. Establish the planned reserve governance/multisig with independently controlled signers before moving large reserve balances.
4. Increase liquidity only through genuine treasury-approved deposits that the project can sustainably support; do not add liquidity solely to create a misleading appearance of market depth.
5. Allow legitimate market activity to develop organically.
6. Submit this evidence packet to Blockaid using its official support portal under Developer / project verification or Mistake / false-positive review, as appropriate.
7. If the MetaMask token-level warning remains, submit the same evidence through official MetaMask support and reference the exact Solana mint, warning screenshot, project website, metadata URI, Raydium pool and successful liquidity transaction.

## Suggested review text

Subject: Request for factual review of Solana KAM (sKAM) token classification

Project: KriptoAman
Token: Solana KAM (sKAM)
Chain: Solana mainnet
Mint: Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi
Raydium pool: 7vW6cmvM2YYHzoLTx7qJqACzj3X2Rq236b83YHpqCbyD
Website: https://kriptoaman.com
Metadata: https://kriptoaman.com/token/skam.json
Evidence: https://kriptoaman.com/token/skam-security-evidence.json
Liquidity transaction: pg4BnKRoD18kUyBrhmgPc9xqftso85jPkst7b9RvygUppW7F1KTk7Z9jzGtdufMPhrN8CZH65nBUFU8vggDqNAh

We are requesting a factual review of the current token classification. A fresh read-only on-chain audit confirms a fixed 1,000,000,000-token supply with mint authority disabled and freeze authority disabled, correct Token-2022 identity/metadata, the pinned Raydium sKAM/WSOL CPMM pool, and current Jupiter quote routing in both directions. A subsequent operator-signed Raydium liquidity addition is confirmed on Solana mainnet at block 444961704. We are not requesting that genuine risk signals be ignored. Thin liquidity, concentrated operator custody, mutable metadata authorities and low organic market activity remain disclosed risks and are being remediated through staged governance and transparent market development. Please review whether the current malicious/dangerous classification remains accurate and advise if additional evidence is required.

## Safety boundary

Never include seed phrases, private keys, wallet secret material, API keys, passwords, or signing payloads in a support submission, GitHub issue, or public document.

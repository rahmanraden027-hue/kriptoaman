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
- Project site: `https://kriptoaman.com`

## Fresh read-only evidence

A read-only GitHub Actions audit was re-run on 2026-09-07 at approximately 02:30 UTC. It performed no wallet signing, authority change, liquidity movement, swap, mint, burn, or token transfer.

Observed state:

- Integrity check: PASS
- Launch identity: LIVE_VERIFIED
- Supply: 1,000,000,000 sKAM
- Decimals: 9
- Mint authority: NULL
- Freeze authority: NULL
- Public metadata: HTTP 200
- Public logo: HTTP 200, image/png
- DEX Screener: expected Raydium pair indexed
- Jupiter: quote route found in both directions (SOL -> sKAM and sKAM -> SOL)
- DEX Screener liquidity at evidence time: approximately USD 52.86
- DEX Screener 24h observed transactions at evidence time: 4 buys / 1 sell
- DEX Screener 24h volume at evidence time: approximately USD 6.36
- Operator-controlled sKAM balance at evidence time: 998,764,419.3527031 sKAM (~99.876442% of total supply)

## Material risks that remain

The token should not be represented as fully hardened while these conditions remain:

1. Liquidity is extremely thin. The displayed price can move sharply and does not imply that large balances can be sold near the displayed price.
2. Token custody is highly concentrated in operator-controlled accounts. The intended reserve/governance architecture should be independently established and verified before describing treasury distribution as decentralized or governance-controlled.
3. Metadata update authority and metadata-pointer authority remain active. This is intentional while metadata/logo indexing is still being finalized, but the authority should later be moved to verified multisig governance or made immutable according to the approved governance policy.
4. Low organic market activity remains a third-party risk-classification signal. Do not self-trade, manufacture volume, or create artificial activity to influence classification.

## MetaMask / Blockaid warning remediation

A MetaMask Solana token warning can be informed by Blockaid and other security/risk signals. A clean mint/freeze audit does not automatically clear a wallet classification.

Recommended order:

1. Preserve the current mint/freeze-null state.
2. Re-run the hardened live audit and retain the artifact.
3. Establish the planned reserve governance/multisig with independently controlled signers before moving large reserve balances.
4. Increase liquidity only through genuine treasury-approved deposits that the project can sustainably support; do not add liquidity solely to create a misleading appearance of market depth.
5. Allow legitimate market activity to develop organically.
6. Submit the evidence packet to Blockaid using its official support portal under Developer / project verification or Mistake / false-positive review, as appropriate.
7. If the MetaMask token-level warning remains, submit the same evidence through official MetaMask support and reference the exact Solana mint.

## Suggested review text

Subject: Request for review of Solana KAM (sKAM) token classification

Project: KriptoAman
Token: Solana KAM (sKAM)
Chain: Solana mainnet
Mint: Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi
Raydium pool: 7vW6cmvM2YYHzoLTx7qJqACzj3X2Rq236b83YHpqCbyD
Website: https://kriptoaman.com
Metadata: https://kriptoaman.com/token/skam.json

We are requesting a factual review of the current token classification. A fresh read-only on-chain audit confirms a fixed 1,000,000,000-token supply with mint authority disabled and freeze authority disabled, correct Token-2022 identity/metadata, an indexed Raydium sKAM/WSOL pool, and current Jupiter quote routing in both directions. We are not requesting that genuine risk signals be ignored. Current thin liquidity, concentrated operator custody, mutable metadata authorities, and low market activity are disclosed and are being remediated through staged treasury governance and organic market development. Please review whether the current malicious/dangerous classification is accurate and advise if additional evidence is required.

## Safety boundary

Never include seed phrases, private keys, wallet secret material, API keys, passwords, or signing payloads in a support submission, GitHub issue, or public document.

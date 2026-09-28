# ZEVARYQ DEX — Pre-Sign Deployment Gate

Network: ZEVARYQ Mainnet  
Chain ID: 22028 (0x560c)  
Order: WZVQ -> ZVQFactory -> ZVQRouter(factory, WZVQ)

This gate prepares deployment but does not broadcast transactions and never stores a private key in GitHub.

## Current authorization

The owner has instructed the project to proceed into the financial deployment phase on 2026-09-28.

Contract deployment may proceed to the final signer review, but a transaction must not be broadcast until all of the following are known and verified:

- exact public deployer wallet address;
- sufficient ZVQ for gas plus a conservative buffer;
- exact reviewed commit SHA;
- live Chain ID = 22028 immediately before signing;
- simulated WZVQ -> Factory -> Router deployment succeeds from the same public signer address;
- deployment receipts and bindings are verified after each transaction.

Deployment authorization does not authorize liquidity.

## Separate liquidity gate

Before any pool or treasury movement:

- exact quote asset and provenance must be approved;
- exact initial ZVQ and quote-asset reserve amounts must be approved;
- implied initial pool price must be reviewed;
- treasury source wallet must be approved;
- WZVQ, Factory and Router must already be verified on-chain;
- small add/remove liquidity and buy/sell smoke tests must be planned.

No issuer-branded imitation USDT/USDC token may be created.

## Secret handling

Never paste a private key, mnemonic or keystore password into chat, source control, GitHub inputs, issues, PRs or logs. The final signature must occur in the owner's wallet or another explicitly approved local signing environment.

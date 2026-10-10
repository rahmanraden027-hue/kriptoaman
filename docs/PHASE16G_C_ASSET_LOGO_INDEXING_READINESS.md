# Phase 16G-C — Asset & Logo Indexing Readiness

Status: **HOLD / READINESS ONLY**

Phase 16G-C establishes one canonical indexing-readiness catalog for the ZEVARYQ asset universe without changing the production Wallet, Explorer, QoryVEx or KriptoAman runtime.

## Target identity set

The current target identity set contains 11 named assets:

- ZVQ
- zBTC
- zETH
- zUSDT
- zUSDC
- zBNB
- zSOL
- zTRX
- zXRP
- zADA
- zDOGE

One additional visual slot remains reserved, preserving the historical 12-slot capacity without inventing a twelfth asset.

## Artwork status

Canonical artwork currently exists only for:

- ZVQ — `/brand/zevaryq-wallet-premium-icon.webp`
- zBTC — `/assets/zevaryq/tokens/zbtc-v2.svg`
- zETH — `/assets/zevaryq/tokens/zeth-v2.svg`

Older `zbtc.svg` and `zeth.svg` files are legacy artwork and are not canonical.

Artwork is still pending for:

- zUSDT
- zUSDC
- zBNB
- zSOL
- zTRX
- zXRP
- zADA
- zDOGE

No placeholder is substituted for a missing logo.

## zUSD

The repository still contains legacy `zusd.svg` and `zusd-v2.svg` artwork.

Phase 16G-C classifies zUSD as:

`DEPRECATED_DO_NOT_INDEX`

It is excluded from the target identity set and cannot be promoted by the readiness registry.

## Cross-surface rule

The readiness catalog is a planning and verification source, not an activation source.

- KriptoAman may reference only canonical identity metadata.
- ZEVARYQ Wallet remains limited to the existing verified runtime registry.
- Explorer requires a real on-chain contract before token indexing.
- QoryVEx requires first-party contract, pool and liquidity evidence before execution surfaces.
- External market/exchange indexing remains blocked until contract/provenance requirements are satisfied.

## Stablecoin-style representation safety

The names zUSDT and zUSDC are target representation candidates only. They must not imply issuer authorization, official affiliation, reserves or bridging until exact issuer/bridge/custody provenance is independently verified.

## Canonical source

`chain/zevaryq-mainnet/registry/zvq-asset-indexing-readiness.draft.json`

## Promotion rule

A pending identity may move toward runtime/indexing only after:

1. canonical artwork exists;
2. artwork passes integrity checks;
3. contract address is real and Explorer-verifiable where a contract is required;
4. decimals/name/symbol are proven from the intended contract;
5. backing/bridge/custody provenance is complete for represented assets;
6. the relevant Wallet/Explorer/QoryVEx gate passes;
7. Phase 16F long-run production stability permits the Phase 16G merge path.

Phase 16G-C performs no deployment, minting, transfer, liquidity creation or runtime UI mutation.

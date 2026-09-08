# KAM Explorer `/stats` route guard

The canonical public statistics surface is `https://explorer.kriptoaman.com/stats` and must serve `explorer-dashboard/stats.html`.

Production invariants:

- The response contains `data-kam-stats-version="2.0.0"`.
- The response header contains `X-KAM-Explorer-Stats-Version: 2`.
- `Placeholder Counter` is never exposed.
- Ethereum-specific placeholder copy such as `amount in ETH` is never exposed.
- Public statistics are derived only from verified Blockscout core APIs already used by KAM Explorer.
- Unavailable metrics remain unavailable instead of being fabricated.

The scheduled `KAM Explorer Stats Route Guard` verifies the canonical and cache-busted route every hour. If the route drifts back to Blockscout's optional placeholder Stats surface, it re-applies the reviewed KAM Explorer V2 route bundle and performs a post-heal verification.

This file also intentionally belongs under `explorer-dashboard/**` so changes to this guard trigger the existing KAM Explorer V2 deployment workflow on merge to `main`.

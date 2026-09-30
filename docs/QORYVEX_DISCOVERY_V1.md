# QoryVEx Discovery v1

QoryVEx Discovery is the evidence-first discovery layer for KriptoAman.

Pipeline: ZEVARYQ newHeads -> contract creation -> New Token Radar -> Asset Passport -> Launch DNA -> QoryVEx Discovery.

## Truth rules
- A contract creation is never presented as a token until ERC-20 metadata is independently proven.
- Asset Passport records chain, contract, creator, creation transaction/block, observation time and confirmation state.
- Launch DNA is a technical fingerprint, not a safety/risk score, audit, liquidity proof, listing approval or investment recommendation.
- Reorged events must remain distinguishable from confirmed observations.
- No private keys, signing, transfers, admin RPC, or write RPC are part of this layer.

## Production gate
The feature remains evidence-only until live WebSocket subscription, moving head, reorg handling, metadata proof and block-to-index latency are verified on production infrastructure.

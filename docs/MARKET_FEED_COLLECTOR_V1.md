# KriptoAman Market Feed Collector v1

## Purpose

KriptoAman Market Feed Collector is the server-side hot-price layer for the crypto-only platform. Browser and mobile clients consume KriptoAman-owned API paths; they do not connect directly to trading-venue WebSockets for the primary market experience.

This does **not** mean KriptoAman originates market prices. Price observations originate at external trading venues. KriptoAman owns the collection, validation, consensus, storage, API delivery, and provenance layer.

## Data path

1. Coinbase and Kraken public market WebSockets produce observable USD market ticks.
2. The KriptoAman collector normalizes supported core symbols.
3. Observations older than the freshness window are excluded.
4. Multi-venue consensus uses the median and rejects observations outside the 2% consensus band.
5. If venues materially disagree and no consensus remains, no price is published for that symbol.
6. The collector signs the complete payload with HMAC-SHA256.
7. /api/market-feed-ingest verifies timestamp, signature, schema, provenance, freshness, and venue declarations before writing.
8. /api/market-feed-hot exposes only a fresh persisted feed.
9. /api/market-price overlays the hot feed on the broader KriptoAman Market Database snapshot.
10. UI clients read KriptoAman APIs only and may display the last verified local cache when the network is unavailable.

## Truth policy

- collector.ownership = KriptoAman describes the collector/control plane.
- provenance.marketPriceOrigin = external-trading-venues describes where observable price ticks originate.
- browserDirectVenueAccess = false is enforced for primary customer market paths.
- Synthetic prices, random chart points, synthetic candles, and silent gap-filling are prohibited.
- A missing or stale observation is shown as unavailable rather than fabricated.
- Persisted historical candles keep provider provenance and explicit missing intervals.

## Security

The collector listens only on 127.0.0.1:8780. It does not require blockchain private keys, wallet keys, signing capability, DNS changes, genesis changes, validator changes, or RPC write access.

Publishing requires a root-owned environment file containing KA_MARKET_INGEST_URL=https://kriptoaman.com/api/market-feed-ingest and a high-entropy KA_MARKET_INGEST_SECRET. The backend must use the same value as MARKET_FEED_INGEST_SECRET. The secret must never be committed or printed by CI.

## Deployment gate

Deployment requires an explicit production authorization. It may run from a manual workflow dispatch on `main`, or from a reviewed `main` merge whose commit message begins exactly `MARKET FEED CUTOVER 20260930`. Ordinary pushes and pull requests cannot deploy. Before activation:

1. Register an authorized self-hosted runner with labels self-hosted, linux, x64, ka-intelligence-indexer on the intended indexer host.
2. Create /etc/kriptoaman/market-feed.env as root, mode 0600, with the ingest URL and secret.
3. Confirm outbound HTTPS and WebSocket connectivity only; no inbound public collector port is required.
4. Dispatch KriptoAman Market Feed Collector from `main`, or merge the reviewed cutover PR using the exact guarded prefix `MARKET FEED CUTOVER 20260930`.
5. The deploy script performs preflight, backup, systemd install, local health validation, public API verification, and automatic rollback on gate failure.
6. Production may be called live only after /api/market-feed-hot returns live or degraded, reports KriptoAman collector ownership, and reports browserDirectVenueAccess=false.

Until that gate passes, the platform continues to use the existing KriptoAman Market Database and /api/market-hot without generating replacement prices.
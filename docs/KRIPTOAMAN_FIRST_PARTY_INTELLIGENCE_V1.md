# KriptoAman First-Party Crypto Intelligence V1

## Product boundary

V1 is intentionally **ZEVARYQ-only** for first-party claims.

KriptoAman may display other chains elsewhere, but no external chain may be labeled **first-party / own-node realtime** until KriptoAman operates and verifies its own node, listener, persistence, and recovery path for that chain.

## Data path

```text
ZEVARYQ execution node / RPC sentry
        |
        | JSON-RPC HTTP (required)
        | JSON-RPC WebSocket (preferred when enabled)
        v
KriptoAman Chain Listener
        |
        +-- block canonicality + reorg handling
        +-- contract-creation detector
        +-- ERC-20 metadata resolver
        +-- allowlisted DEX factory PairCreated detector
        +-- provenance timestamps
        |
        v
KriptoAman local SQLite WAL index (V1)
        |
        +-- GET /health
        +-- GET /v1/status
        +-- GET /v1/tokens
        +-- GET /v1/tokens/:address
        +-- GET /v1/pools
        +-- GET /v1/events
        +-- WS  /stream
```

## Truth model

Every first-party record carries chain block/transaction provenance plus KriptoAman indexing timestamps.

A contract deployment is **not** treated as a market listing.
A token becomes a market-discovery candidate only after an allowlisted DEX factory emits a pool/pair creation event.

Lifecycle:

- DETECTED — seen on canonical chain
- METADATA RESOLVED — token metadata readable
- POOL DETECTED — allowlisted factory emitted pool creation
- INCLUDED — block is canonical at current head
- FINAL — configured finality depth passed
- REORGED — prior block/path was removed and records were rewound

## Independence rule

The V1 service contains no CoinGecko, CoinMarketCap, DEX Screener, GeckoTerminal, Alchemy, Infura, QuickNode, or other external market/indexing dependency.

External providers may be used later as **cross-checks only**, never as the source for a first-party badge.

## Security boundary

- Read-only JSON-RPC methods only.
- No private keys.
- No signing.
- No transaction broadcast.
- No validator administration.
- API only serves GET + WebSocket.
- DEX factory detection requires an explicit allowlist.
- CORS/WebSocket browser origins are allowlisted.
- The listener runs on a dedicated non-validator host.

## Product consumers

### KriptoAman Platform
Asset Passport, Proof of Intelligence, Trust Graph, New Token Radar.

### QoryVEx
Discovery and execution surface. QoryVEx must consume KriptoAman provenance and risk data before enabling trade UI.

### ZEVARYQ Wallet
Transaction Firewall and pre-signing intelligence. Signing remains wallet-local.

### Oryvantiq
Institutional graph, anomaly, network, and forensic intelligence.

## Next infrastructure gates

1. Verify first-party ZEVARYQ HTTP RPC on the protected runner.
2. Detect whether a local ZEVARYQ WebSocket RPC is already available.
3. Provision a dedicated intelligence/indexer host in the Singapore VPC.
4. Deploy listener bound to localhost/private network only.
5. Put an authenticated/restricted reverse proxy in front of REST/WS.
6. Configure QoryVEx factory address only after the factory exists and has been reviewed.
7. Run block/reorg/restart/recovery soak tests before a production badge.

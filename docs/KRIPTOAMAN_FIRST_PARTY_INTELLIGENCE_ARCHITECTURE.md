# KriptoAman First-Party Crypto Intelligence Architecture

Status: implementation foundation
Scope: crypto-only intelligence, discovery, trust, and execution surfaces

## Product boundaries

- **KriptoAman Platform** — Crypto Intelligence Operating System: Asset Passport, Trust Graph, Proof of Intelligence, risk and discovery.
- **ZEVARYQ Wallet** — self-custody user gateway: hold, verify, sign, receive, send, transaction firewall.
- **QoryVEx** — intelligent crypto discovery and execution: new tokens, new pools, launch DNA, liquidity intelligence, swap/DEX.
- **Oryvantiq** — professional intelligence command center: graph analytics, network intelligence, threat intelligence, institutional monitoring.
- **ZEVARYQ Network** — blockchain infrastructure layer used by the ecosystem.

## Data truth policy

Production UI must distinguish these states:

1. `FIRST_PARTY_LIVE` — observed directly from a KriptoAman-operated node/indexer.
2. `FIRST_PARTY_INDEXED` — persisted by the KriptoAman indexer from first-party node observations.
3. `CALCULATED` — derived only from identified first-party inputs; formula/method must be documented.
4. `CACHED` — last known first-party observation with timestamp and age.
5. `UNAVAILABLE` — no sufficiently fresh first-party evidence.

Never convert `UNAVAILABLE` into zero, healthy, live, verified, or estimated.

Every first-party record must carry at minimum:
- chain
- block number/hash where applicable
- node received timestamp
- indexed timestamp
- published timestamp
- source ownership
- transport
- freshness/age
- confirmation/finality state

## First implementation

`GET /api/zvq-first-party-discovery` reads the KriptoAman-operated ZEVARYQ RPC directly and returns:
- verified chain identity
- current head
- recent block evidence
- observed contract-creation transactions
- first-party provenance
- request latency

It deliberately does **not** claim that a contract creation is an ERC-20 token, listed asset, liquid market, safe contract, or endorsed project.

## Target streaming architecture

```
ZEVARYQ node (local RPC + WebSocket)
          |
          +-- newHeads
          +-- logs
          +-- receipts
          |
KriptoAman Chain Listener
          |
       Event Bus
          |
  +-------+---------+----------+
  |                 |          |
Contract         Pool       Trade
Detector         Detector    Processor
  |                 |          |
  +-----------------+----------+
                    |
              Asset Passport
                    |
                Trust Graph
                    |
                Risk Engine
                    |
              First-party DB
                    |
          REST + WebSocket/SSE
                    |
 +------------------+-------------------+
 |                  |                   |
KriptoAman       QoryVEx          Oryvantiq
                    |
              ZEVARYQ Wallet
```

## WebSocket gate

A public UI must not be labelled real-time WebSocket merely because it polls HTTP.

The streaming service is production-ready only after all of the following pass:
- local node WebSocket listener receives advancing `newHeads`
- reconnect with bounded exponential backoff
- duplicate block/log idempotency
- reorg handling and removed-log handling
- persisted cursor survives process restart
- lag telemetry exposes P50/P95/P99 block-to-index latency
- stale feed changes state to `UNAVAILABLE` or `CACHED`
- write/admin RPC methods remain inaccessible from public routes
- no private key is present in listener runtime
- rollback leaves the existing RPC and Explorer unchanged

## External providers

CoinGecko, CoinLore, CryptoCompare, Frankfurter, Twelve Data and similar providers are not part of the target primary production truth path.

They may remain temporarily during migration as isolated parity/reference inputs, but:
- they must never be labelled first-party;
- they must never silently replace unavailable first-party data;
- their failure must not alter first-party provenance;
- they are removed from the primary public experience only after first-party coverage is proven.

## Chain rollout

1. ZEVARYQ — first-party node, listener, indexer and discovery.
2. One high-volume EVM chain — dedicated KriptoAman-operated node/listener.
3. Solana — dedicated RPC/WebSocket adapter.
4. Additional chains only after the same provenance and reliability gates pass.

No UI may claim first-party coverage for a chain before its node/listener gate is proven.


## QoryVEx discovery phase

The first QoryVEx discovery surface is intentionally evidence-gated:

1. **New Token Radar** scans recent ZEVARYQ blocks for contract-creation transactions.
2. **Contract proof** resolves the deployed address from the transaction receipt and verifies deployed bytecode.
3. **Asset Passport** reads `name()`, `symbol()`, `decimals()`, and `totalSupply()` directly through KriptoAman RPC. A contract is labelled `ERC20_METADATA_PROVEN` only when symbol, decimals, and total-supply calls are readable; this label is metadata evidence, not a security audit or standards certification.
4. **Launch DNA** records descriptive launch facts such as age in blocks, bytecode size, metadata completeness, declared decimals, and whether supply is readable. It is not a risk score or price prediction.
5. **QoryVEx Discovery** keeps pool evidence, liquidity evidence, and execution unavailable until a verified factory/router registry and first-party pool-event detector are configured.

Public route: `/qoryvex/discovery`

API route: `GET /api/zvq-token-intelligence`

The API must never infer a listing from contract creation and must never synthesize pool, liquidity, or execution availability.

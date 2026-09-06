# MarketEdge Bot v1

Multi-token, multi-DEX Solana arbitrage scanner for the KriptoAman repository.

## Safety model

v1 is deliberately **PAPER_ONLY**. It does not load a wallet, private key, seed phrase, or signer and cannot submit transactions. This is intentional: a profitable quote is not a guaranteed executable profit. Real arbitrage also faces stale quotes, priority fees, slippage, failed transactions, MEV and non-atomic leg risk.

The scanner only reports an opportunity when:

- two different Jupiter DEX venue labels are used;
- the two route plans do not share the same AMM account;
- both legs stay below the configured price-impact ceiling;
- the full round trip returns more base asset than it started with;
- the quoted gross edge remains above the configured execution-cost buffer and minimum net-profit threshold.

It never creates synthetic volume, self-trades, or buys and sells against the same pool to manufacture activity.

## Requirements

- Node.js 20+
- a Jupiter Developer Platform API key in the local environment

Never commit an API key or wallet secret.

```bash
export JUPITER_API_KEY='...'
```

## List valid Jupiter venue labels

```bash
node bots/market-edge/scanner.mjs --list-venues
```

Use exact labels returned by this command in the config. Venue names can change over time.

## One scan

```bash
node bots/market-edge/scanner.mjs --once
```

Or with your own config:

```bash
cp bots/market-edge/config.example.json bots/market-edge/config.local.json
node bots/market-edge/scanner.mjs --config=bots/market-edge/config.local.json --once
```

Do not commit `config.local.json` if it contains sensitive operational limits.

## Continuous monitoring

```bash
node bots/market-edge/scanner.mjs --config=bots/market-edge/config.local.json
```

Profitable paper opportunities are appended as JSONL to `opportunityLogPath`.

## Adding tokens

Add a market entry using the real Solana mint and decimals. Example structure:

```json
{
  "symbol": "TOKEN",
  "mint": "TOKEN_MINT",
  "decimals": 6,
  "baseSymbol": "SOL",
  "baseMint": "So11111111111111111111111111111111111111112",
  "baseDecimals": 9,
  "probeAmountUi": "0.01",
  "maxPriceImpactPct": 0.5,
  "minNetProfitBps": 75,
  "venues": ["VENUE_A", "VENUE_B"]
}
```

The same bot can monitor many tokens. If a token only has one valid venue, the scanner reports that cross-venue arbitrage is not available instead of fabricating a trade.

## Meaning of thresholds

- `slippageBps`: quote slippage tolerance.
- `maxPriceImpactPct`: maximum price impact for either leg.
- `executionCostBps`: conservative buffer for priority fees, landing risk and other costs not represented by AMM quote output.
- `minNetProfitBps`: required edge after subtracting `executionCostBps`.
- `probeAmountUi`: paper trade size in the base asset.

Jupiter quotes already reflect the route's AMM economics in `outAmount`, but network and execution risk still need a separate buffer.

## Live execution roadmap

Do not turn quote detection directly into unattended real-money trading. Before a live executor is enabled, require all of the following:

1. at least several days of paper logs;
2. observed fill-vs-quote statistics;
3. atomic or otherwise bounded execution design;
4. per-market maximum trade size;
5. daily loss limit and kill switch;
6. fresh-quote TTL and blockhash checks;
7. wallet signer isolated from source control;
8. explicit live-trading gate;
9. post-trade balance/PnL reconciliation;
10. compliance review for the jurisdictions in which the bot is operated.

No strategy guarantees profit.

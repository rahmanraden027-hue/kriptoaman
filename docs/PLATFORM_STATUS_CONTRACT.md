# KriptoAman Platform Status Contract

`GET /api/platform-status` is the stable public machine-readable health contract for KriptoAman.

It aggregates three read-only dependency groups:
- market snapshot health
- public multi-chain network health
- KAM network verification

## Status values

Each component and the overall platform use only:
- `operational`
- `degraded`
- `unavailable`

Unavailable metrics are returned as `null`; they are never replaced with synthetic counts, prices, block heights, percentages, or availability claims.

## Stable top-level shape

```json
{
  "schemaVersion": "1.0",
  "service": "KriptoAman",
  "overall": "operational|degraded|unavailable",
  "generatedAt": "ISO-8601",
  "components": {
    "market": {},
    "networks": {},
    "kam": {}
  },
  "policy": {
    "valuesAreLiveVerifiedOnly": true,
    "unavailableMetricsUseNull": true,
    "fabricatedMetrics": false
  }
}
```

## Safety boundary

This endpoint is read-only. It must never sign or submit transactions and must not alter validator configuration, treasury, balances, token supply, genesis, Chain ID, DNS, secrets, or external registry state.

## UI rule

Public UI may display verified numeric metrics only when provided by this contract or the underlying health endpoints. When a value is unavailable, display a professional status label such as `Sedang diverifikasi` or `Tidak tersedia sementara` rather than a fabricated zero or unsupported number.

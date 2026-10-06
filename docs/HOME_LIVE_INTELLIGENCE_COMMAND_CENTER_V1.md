# KriptoAman Live Intelligence Command Center v1

## Status

Implementation baseline for the final KriptoAman homepage composition.

## Product rule

The homepage is a command surface, not a catalogue of every feature. It answers:

1. What is happening now?
2. What is important?
3. What can the user verify or open next?

## Final composition

1. Canonical primary navigation.
2. Live market ticker.
3. Intelligence hero with the KriptoAman/ZEVARYQ topology.
4. Verified live command statistics.
5. Market / On-chain / Risk / Ecosystem / AI shortcut rail.
6. Market command grid:
   - market overview,
   - verified featured price series,
   - ZEVARYQ on-chain evidence,
   - market heatmap.
7. ZEVARYQ Network Pulse:
   - verified current head,
   - derived height sequence only,
   - RPC probe,
   - evidence radar,
   - explicit fail-closed mempool state.
8. Verification surface.
9. Ecosystem rail.
10. Intelligence decision flow.

## Data policy

The visual layer MUST NOT manufacture data to fill the UI.

Allowed:
- KriptoAman market database / verified cache according to existing data states.
- ZEVARYQ first-party network status.
- ZEVARYQ first-party JSON-RPC intelligence.
- deterministic derived values that are explicitly presented as calculated/derived.

Fail-closed:
- no synthetic whale events,
- no synthetic DEX swaps,
- no synthetic mempool fees,
- no synthetic node or validator counts,
- no invented prices, volume, blocks, latency, uptime, or alerts.

Unavailable values render as an em dash or an explicit UNAVAILABLE state.

## Mobile rule

Mobile is composed, not merely scaled:
- hero text remains first,
- topology stays visible but asset chips remain compact,
- live stats use a two-column grid,
- command shortcuts collapse to two columns,
- command grid becomes stacked,
- ecosystem rail becomes two columns,
- fixed primary navigation stays above the safe area.

## Frozen production boundary

This pass is presentation and verified data binding only. It MUST NOT modify:
- genesis,
- consensus,
- validators or validator keys,
- private keys,
- balances or token supply,
- custody,
- transaction signing or broadcasting,
- RPC write/admin/debug policy,
- DNS / Cloudflare routing,
- liquidity,
- smart-contract state.

## Acceptance

The release may merge only after:
- CI and security gates pass,
- canonical navigation remains intact,
- production data remains fail-closed,
- mobile safe area remains intact,
- no production mutation boundary is crossed.

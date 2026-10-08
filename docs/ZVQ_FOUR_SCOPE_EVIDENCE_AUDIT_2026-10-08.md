# ZEVARYQ Mainnet — Four-Scope Evidence Audit
**Observed:** 2026-10-08 08:07 UTC (15:07 WIB)
**Network:** Chain ID 22028 (`0x560c`)
**Scope:** Read-only public evidence, NOT full production/commercial launch approval.

## Authoritative source
[GitHub Actions public observation run #37747739448](https://github.com/rahmanraden027-hue/kriptoaman/actions/runs/37747739448)
Artifact: `zvq-public-four-scope-evidence`. Re-check current data before using this snapshot for release decisions.

| Area | Observed result | Interpretation |
| --- | --- | --- |
| RPC progression | Block 597200 → 597204 in the sampled interval | Progressing at observation time; not a future uptime guarantee |
| RPC ↔ Blockscout | Indexed tip 597204; delta 0 | Aligned during sample; historical completeness not established |
| QBFT validator observations | 4 distinct observed proposers among 50 indexed blocks | Does **not** establish 4/4 hosts/processes/peers healthy or authoritative voting-set membership |
| Canonical finality | No canonical `finalized`-tag proof from public RPC | Status **PARTIAL**; do not substitute block depth, progress, or proposer count for finality |
| ERC-20 index | 1 page, 0 addresses returned, API pagination exhausted | Directory observation only; historical ERC-20 completeness **UNVERIFIED**; absence from index is not absence on-chain |
| Liquidity | First-party liquidity evidence endpoint HTTP 503 | Pool reserves, verified asset backing, LP custody, lock and commercial authorization **UNAVAILABLE** |

## Four-scope decision
- Validator health: **PARTIAL**
- Finality: **PARTIAL**
- Token index completeness: **PARTIAL**
- Real liquidity proof: **UNAVAILABLE**
- **Full four-scope verified: NO**
- **Commercial trading/liquidity unlock approval: NO**

## Additional evidence required
1. Run existing [KAM Private Mainnet Evidence](https://github.com/rahmanraden027-hue/kriptoaman/actions/workflows/kam-private-mainnet-evidence.yml) through the protected `kam-mainnet-evidence` self-hosted runner; independently check validator fingerprint, private QBFT voting set, four distinct hosts, peer counts, protected RPC origin, finalized-tag canonical match, and backup/restore evidence. Keep keys, enodes, SSH details and private addresses out of logs/chat.
2. Verify finality using an actual supported protected finalized-tag + canonical hash proof. If the client cannot expose it, require separate independently reviewable QBFT commit evidence; never label it VERIFIED merely because blocks advance.
3. Reconcile historical deployment receipts/logs against Blockscout's full token index; track indexing lag and exact expected contract registry. An empty ERC-20 directory is an issue to investigate, not permission to invent token assets or logos.
4. Verify chain-specific factory/router/token/pool contract deployment, code, actual reserves, counter-asset bridge backing, LP owner/custody/lock, and public disclosure. The existing `/api/zvq-liquidity-evidence` endpoint currently returns 503. **No funding or swap should be broadcast during verification.**
5. Run the independent four-scope inventory again after each approved repair, preserving proof artifacts and release SHA.

## Guardrails
This report verifies neither the 25-country roll-out nor satellite connectivity. Keep genesis, validator keys, balances, liquidity locks, DNS, RPC write restrictions, and wallet signing unchanged. Do not equate UI/browser tests with consensus or market authorization.

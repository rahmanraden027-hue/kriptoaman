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

## Follow-up root-cause observation — 2026-10-08 08:18 UTC (15:18 WIB)

Read-only [CI run #37748912923](https://github.com/rahmanraden027-hue/kriptoaman/actions/runs/37748912923) confirmed these additional measurements:

- RPC advanced from block **597413** to **597417**, and Blockscout indexed height was **597417** (delta **0**), in the sampled interval.
- **4 unique block proposers among 50 sampled blocks**. This remains *proposer evidence*, not per-host process/peer or authoritative QBFT validator-set verification.
- Explicit finalized-tag and canonical finality matching were **not proven**; finality remains **PARTIAL**.
- ERC-20 directory returned **0 addresses**. The old WKAM reference `0x0d8848CE88BB09a81a4248Efdd574d50B98b544A` returned **empty bytecode at latest state** from `eth_getCode`, and the direct Blockscout token endpoint returned **HTTP 404**. This does **not** prove no token was ever deployed on the chain, nor that WKAM is a native/current ZVQ asset.
- The first-party liquidity endpoint returned **HTTP 503** with safe machine code **`REGISTRY_NOT_CONFIGURED`**. There is no evidence for a configured, real backed pool or an authorized liquidity unlock.

### Decision after root-cause probe

**Keep commercial trading, pool funding and liquidity unlock on HOLD.** Registry creation or deployment would be a separate reviewed operation, not a diagnostic repair. First establish the current canonical ZVQ native/wrapped asset specification and audited code/deployment, reconcile historical token receipts with chain state and Blockscout, verify bridge backing and counter-asset legitimacy, then approve explicit router/pair/treasury custody/LP lock details before any on-chain action.

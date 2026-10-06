# KriptoAman Platform + ZEVARYQ Wallet — Device Acceptance Pack

Status: **PREPARED / NOT EXECUTED**

This pack is the final device-level acceptance procedure to run after the Phase 16F 24H stability gate passes. It does not change production while the active stability window is collecting.

## Scope

Two separate products must be validated as one ecosystem:

- **KriptoAman Platform** — intelligence and control surface.
- **ZEVARYQ Wallet** — user execution interface.
- **ZEVARYQ Mainnet** — shared blockchain identity, Chain ID 22028 (`0x560c`), native asset ZVQ.
- **ZEVARYQ Explorer** — shared evidence/verification surface.

The goal is not to make the two applications look identical. The goal is to prove that they share the same network identity, verified data contract, safety policy and navigation continuity.

## Automated viewport matrix

Run browser acceptance against:

| Profile | Viewport | Touch |
| --- | ---: | --- |
| Android compact | 360×800 | Yes |
| Android standard | 390×844 | Yes |
| Android large | 412×915 | Yes |
| Tablet | 768×1024 | Yes |
| Desktop | 1440×1000 | No |

Every required viewport must show no horizontal overflow, no clipped primary controls, no navigation outside the viewport, and no critical JavaScript error.

## KriptoAman Platform acceptance

Verify:

1. KriptoAman brand and canonical primary navigation are visible.
2. Home/Command Center renders without horizontal overflow.
3. Safe-area top/bottom treatment remains present.
4. Mobile touch targets remain at least 44 px.
5. Market data remains fail-closed: unavailable sources must not become invented values.
6. ZEVARYQ network surface identifies Chain ID 22028 / 0x560c.
7. Network and on-chain states use the canonical status vocabulary.
8. Explorer navigation reaches the official ZEVARYQ Explorer.
9. Wallet entry reaches the standalone ZEVARYQ Wallet rather than a duplicate simulated wallet.

## ZEVARYQ Wallet acceptance

Verify in order:

1. Open `/wallet-app` and confirm **ZEVARYQ Wallet** identity.
2. Open **Connect Wallet** and confirm Chain 22028 is the required network.
3. Connect through an external provider with explicit user approval.
4. Confirm the connected address is visible.
5. Confirm native ZVQ balance is loaded only from verified RPC/status paths.
6. Open **Assets**. Indexed balances are holdings; ecosystem candidates remain clearly labeled **PLANNED**.
7. Open **Receive ZVQ** and confirm the QR/address equals the connected public address.
8. Open **Send** and enter a valid destination and amount. Stop at **Preview Send**.
9. Confirm **Broadcast Locked** and review-only copy remain visible.
10. Open **Swap** and verify the preview route. No approval, signing or broadcast is required for acceptance.
11. Open **Explorer** and confirm it points to the official public ZEVARYQ Explorer.
12. Confirm no screen requests a private key, seed phrase or mnemonic.

## Safe-area acceptance

The current codebase already contains safe-area handling for both products. The final gate must confirm this visually on a real Android device as well as browser emulation:

- header content does not collide with status/cutout areas;
- bottom navigation clears the gesture/navigation area;
- fixed CTAs do not cover wallet controls;
- modal content stays reachable without clipped buttons;
- rotation/resizing does not create horizontal overflow.

## Physical Android evidence

Automated browser emulation is necessary but not sufficient. Final PASS requires one real Android device evidence set containing:

- device model;
- Android version;
- screenshots for Platform home, Wallet home, Connect, Assets, Receive, Send Preview and Swap Preview;
- a short screen recording showing navigation between KriptoAman Platform and ZEVARYQ Wallet;
- confirmation that no transaction was broadcast.

Do not capture seed phrases, private keys, wallet exports or sensitive authentication information.

## PASS boundary

This pack passes only when:

- every required browser profile passes;
- physical Android evidence is complete;
- Chain ID is consistently 22028 / 0x560c;
- public identity is ZEVARYQ / ZVQ;
- no fabricated balance or market value appears;
- wallet broadcast remains locked;
- no genesis, validator, private-key, balance-state, supply, liquidity, custody, DNS, consensus or RPC write-policy change occurs.

Until the physical-device evidence is collected, status remains **PREPARED / NOT EXECUTED**, not PASS.

# sKAM Governance v1 — Mainnet Runbook

This runbook finalizes the first governance foundation for sKAM on Solana mainnet without exposing any private key material.

## Pinned identity

- sKAM mint: `Dw9xf7EmMH5dD7rdqkFbzjJtcAWk4KXLBAXUkSRcLSLi`
- Squads v4 program: `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`
- Signer 1 / operator: `5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK`
- Signer 2: `9kyjft13umxb92C11qr9v6L8HnJ3t1cZuDohc5wLrFqB`
- Signer 3: `9qhMmV5T9gfPQ4yCZPMVgDbHUR9F65c3xBKnEmWLYxT2`
- Threshold: `2-of-3`
- Global timelock: `86400` seconds / 24 hours
- Config authority: none
- Spending limits at foundation: none

## Non-negotiable security gate

Before multisig creation, confirm that Signers 1, 2 and 3 are controlled by independent seed material or independent signing devices. Three imported copies of one seed are not independent signers.

Never paste a seed phrase, private key, wallet export, or keypair JSON into GitHub, chat, tickets, logs, environment files committed to source control, or screenshots.

## Phase A — read-only readiness

```bash
cd chain/solana-liquidity
npm install --no-audit --no-fund
npm run reserve:readiness
```

Do not continue unless the verifier reports the expected mint, exact 1,000,000,000 sKAM supply, the pinned member set, and no unexpected authority change.

## Phase B — create Squads v4 governance

Prepare a local `.env` that is excluded from source control. `KEYPAIR` must point to the local Signer 1 JSON file. Do not put JSON key material directly in `.env`.

```bash
RPC_URL=https://api.mainnet-beta.solana.com
KEYPAIR=/absolute/local/path/to/signer1.json
CONFIRM_INDEPENDENT_SIGNERS=I_CONFIRM_THREE_INDEPENDENT_SKAM_SIGNERS
CONFIRM_CREATE_SQUADS_MULTISIG=CREATE_SKAM_SQUADS_2_OF_3_MAINNET
```

Run only after the three independent controls have been confirmed:

```bash
npm run governance:create -- .env
```

The guarded creator:

1. validates the exact three pinned public keys;
2. requires Signer 1's local keypair to resolve to the pinned operator address;
3. fetches Squads ProgramConfig and its creation-fee treasury on-chain;
4. creates a Squads v4 multisig with `multisigCreateV2`;
5. uses threshold 2, 24-hour timelock, and `configAuthority=null`;
6. configures all three members with full Squads permissions;
7. keeps preflight enabled;
8. verifies the resulting account immediately after confirmation;
9. derives vault index 0 and index 1 as candidate Strategic and Ecosystem reserve owners;
10. writes only non-secret evidence to `artifacts/skam-squads-v4-created.json`.

## Phase C — independent read-only verification

Copy only the resulting public multisig address into the local environment:

```bash
MULTISIG_ADDRESS=<public_squads_multisig_address>
npm run governance:verify -- .env
```

Required PASS checks:

- owner program is the pinned Squads v4 program;
- exact three pinned members are present in the approved order;
- threshold is 2-of-3;
- timelock is 86,400 seconds;
- config authority is null.

If any check fails, stop. Do not fund reserve vaults and do not change token authorities.

## Phase D — pin governance addresses through review

After Phase C passes, update `skam-reserve-policy.json` through a separate reviewed PR with:

- the verified multisig address;
- Strategic Reserve owner = verified vault index 0;
- Ecosystem Reserve owner = verified vault index 1;
- independent signer attestation complete.

Do not place reserve-scale balances in an address before this pin-and-review step is complete.

## Phase E — canary reserve workflow

Before moving 300M sKAM:

1. create the appropriate Token-2022 token accounts/ATAs owned by the verified vault PDAs;
2. transfer a deliberately small sKAM amount to each reserve vault;
3. create a legitimate Squads vault transaction that moves the canary amount;
4. obtain approval from two independent signers;
5. respect the 24-hour timelock;
6. execute and verify the canary transfer;
7. confirm the recovery/operational process is understood by the signer operators.

Only after this workflow is proven should reserve-scale funding be considered.

## Phase F — reserve funding

Approved reserve targets from policy:

- Strategic Reserve: exactly `200,000,000 sKAM`
- Ecosystem Reserve: exactly `100,000,000 sKAM`

Run the reserve verifier again and require exact balances before authority hardening.

## Phase G — irreversible authority hardening

Mint and freeze authority changes are separate irreversible security actions.

The current policy requires reserve funding to be verified first. After that, revoke Mint Authority in one dedicated wallet-approved transaction, verify on-chain that it is null, then revoke Freeze Authority in a separate wallet-approved transaction and verify that it is null.

Do not publicly describe sKAM as fixed-supply until Mint Authority is actually null on-chain. Do not describe it as non-freezable until Freeze Authority is actually null on-chain.

Metadata update and metadata-pointer authorities remain separate branding-hardening decisions under the current policy.

## Phase H — final launch evidence

Run the live audit and preserve public evidence for:

- token mint identity and Token-2022 program ownership;
- supply and decimals;
- metadata identity and logo availability;
- verified Squads governance address and member policy;
- reserve vault addresses and exact balances;
- final mint/freeze authority state;
- Raydium sKAM/SOL pool identity;
- DEX Screener indexing and live venue-observed market data.

Public communications must distinguish sKAM on Solana from native KAM on KAM Network and must not claim guaranteed price, guaranteed liquidity, fabricated volume, or 1:1 backing/bridge status unless independently verifiable.

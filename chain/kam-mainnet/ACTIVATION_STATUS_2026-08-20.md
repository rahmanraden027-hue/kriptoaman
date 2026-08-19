# KAM Mainnet Activation Status — 2026-08-20

Verification time: approximately 06:01 WIB (Asia/Jakarta)

## Result

**STATUS: EXTERNAL ACTIVATION REQUIRED / NOT PUBLIC**

Direct external DNS/HTTPS verification was performed for the target public endpoints.

### RPC

Target: `https://rpc.kriptoaman.com`

Observed result:

```text
DNS: no address resolved
HTTPS: curl error (6) Could not resolve host: rpc.kriptoaman.com
```

### Explorer

Target: `https://explorer.kriptoaman.com`

Observed result:

```text
DNS: no address resolved
HTTPS: curl error (6) Could not resolve host: explorer.kriptoaman.com
```

## Decision

`network-profile.json` MUST remain `mainnet-candidate-not-public`.

Do not claim KriptoAman Mainnet is publicly active and do not submit the chain as an active public network to CoinGecko / ChainList until both endpoints resolve and all activation gates in `FINAL_ACTIVATION_PACKAGE.md` pass.

## What is already ready

- Candidate network identity and Chain ID 22028 / `0x560c`
- Restricted public RPC Worker source
- Cloudflare Custom Domain configuration for `rpc.kriptoaman.com`
- CORS/preflight support
- JSON-RPC method allowlist
- request/body and batch limits
- public endpoint verifier script
- DNS/origin plan
- final activation runbook
- draft ChainList metadata (`incubating`, not for submission yet)

## Remaining external prerequisites

1. Production validator/sentry infrastructure must be live.
2. `KAM_RPC_ORIGIN` must point to a protected RPC/sentry origin.
3. Deploy the Worker and attach `rpc.kriptoaman.com` as its Cloudflare Custom Domain.
4. Deploy the production explorer and publish `explorer.kriptoaman.com`.
5. Run the external verifier and capture a passing result.
6. Confirm 4-validator QBFT set privately.
7. Capture at least 24 hours of stable block progression.
8. Complete backup/restore and monitoring evidence.
9. Re-check Chain ID collision immediately before registry submission.
10. Only then change network status to public mainnet and proceed with directory/CoinGecko submissions.

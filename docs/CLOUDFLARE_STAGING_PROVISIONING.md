# Cloudflare isolated staging provisioning

This runbook prepares the non-production environment required by issues #301 and #299. It is intentionally separate from the production failover design in #275.

## Required topology

- Create a dedicated Cloudflare Pages project or dedicated non-production Pages origin from the current `main` revision.
- Prefer a dedicated `*.pages.dev` origin for capacity testing. Do not use `kriptoaman.com` or any `*.kriptoaman.com` hostname as a load-test target.
- Build command: `npm run build`.
- Build output directory: `dist`.
- Bind a dedicated non-production D1 database as `AUTH_DB`. Never bind the production auth database to staging.
- Configure a staging-only `SESSION_SECRET`.
- Set `APP_ENV=staging`.

## Required isolation flags

The staging deployment must satisfy `/api/staging-readiness` and the following controls before any load generation:

- capacity-test mode enabled;
- production writes disabled;
- synthetic data only;
- outbound email disabled, sinked, or test-inbox only;
- KYC disabled or sandbox-only;
- wallet/trading/admin state-changing integrations disabled;
- a non-sensitive staging database marker configured;
- a non-sensitive staging session marker configured.

Never place real secrets, raw D1 IDs, tokens, private keys, user data, treasury data, validator credentials, or signing material in repository files or workflow inputs.

## Verification order

1. Deploy the exact `main` commit to isolated staging.
2. Confirm `/api/staging-readiness` returns HTTP 200 with `ready=true` and `environment=staging`.
3. Run the manual `Staging Provisioning Verification` workflow with the isolated staging origin.
4. Record the resulting artifact and compare the redacted staging database/session fingerprints with production evidence to confirm they differ.
5. Only after provisioning verification passes, run `Large Scale Staging Gate` in order: `10x100`, `25x500`, `50x2000`, `100x10000`.
6. Stop immediately on any request failure, unexpected 5xx increase, auth readiness regression, database saturation, or provider quota pressure.

## Out of scope

This staging runbook must not change KAM genesis, Chain ID, validator set, RPC/explorer security posture, balances, treasury, token supply, production DNS, production auth data, KYC records, or wallet state.

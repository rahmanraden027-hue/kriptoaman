# KriptoAman Staging Isolation Contract

This contract defines the minimum non-production configuration required before any capacity test beyond low-rate production smoke checks.

## Mandatory staging environment variables

The staging deployment must explicitly set:

- `APP_ENV=staging`
- `ALLOW_CAPACITY_TESTS=true`
- `STAGING_WRITES_DISABLED=true`
- `STAGING_SYNTHETIC_ONLY=true`
- `STAGING_EMAIL_MODE=disabled|sink|test`
- `STAGING_KYC_MODE=disabled|sandbox`
- `STAGING_DB_MARKER=<non-secret stable staging marker>`
- `STAGING_SESSION_MARKER=<non-secret stable staging marker>`
- `DEPLOYMENT_COMMIT=<exact tested commit SHA>`

`STAGING_DB_MARKER` and `STAGING_SESSION_MARKER` are not credentials and must not contain raw database IDs, secrets, tokens, private keys, user data, or production identifiers. The readiness endpoint hashes them into short redacted fingerprints.

## Infrastructure requirements

- Dedicated HTTPS staging origin that is not `kriptoaman.com` and not any `*.kriptoaman.com` company/production hostname.
- Dedicated non-production `AUTH_DB` / D1 binding.
- Dedicated staging `SESSION_SECRET` and auth configuration.
- No copied production personal data. Synthetic accounts only.
- Email disabled, sinked, or controlled test inboxes only.
- KYC disabled or provider sandbox only.
- Wallet, trading, balance, treasury and admin state-changing integrations disabled for capacity tests.
- KAM mainnet RPC/explorer/validator/treasury/genesis/supply/configuration remain out of scope and must not be mutated.

## Readiness behavior

`GET /api/staging-readiness` returns HTTP 404 unless `APP_ENV=staging`.

A staging deployment only returns `ready: true` when all required isolation flags and redacted markers are present. No secret values are returned.

The `Large Scale Staging Gate` requires this attestation before it performs the existing read-only route preflight or any load generation.

## Progressive baseline

Run in order and stop at the first unexplained failure or saturation signal:

1. 10 concurrent / 100 requests
2. 25 / 500
3. 50 / 2,000
4. 100 / 10,000

Passing this sequence is staging baseline evidence only. It is not evidence that production supports one million simultaneous users.

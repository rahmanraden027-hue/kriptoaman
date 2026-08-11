# KriptoAman first-party authentication

This branch introduces the server-side foundation for authentication served from `kriptoaman.com`.

## Cloudflare bindings

Configure these for both Preview and Production before wiring the frontend to the new endpoints:

- D1 binding: `AUTH_DB`
- Secret: `GOOGLE_CLIENT_ID`
- Secret: `GOOGLE_CLIENT_SECRET`
- Secret: `SESSION_SECRET` (at least 32 random characters)
- Secret: `RESEND_API_KEY`
- Variable: `AUTH_ORIGIN=https://kriptoaman.com`
- Variable: `AUTH_EMAIL_FROM=KriptoAman <noreply@kriptoaman.com>`
- Variable: `ADMIN_EMAILS` (comma-separated verified Google accounts allowed to bootstrap the admin role)

Run `migrations/0001_auth_users.sql` and `migrations/0002_auth_consents.sql` against the D1 database before enabling login. The
authentication middleware also applies the same `CREATE ... IF NOT EXISTS` schema at
runtime as a recovery guard, so a newly bound or accidentally unmigrated production D1
database can initialize safely without overwriting existing records.

Password registration requires explicit acceptance of the Terms of Service and Privacy
Policy. The server records the document versions, acceptance time, a keyed hash of the
request IP (never the raw IP), and a truncated user agent for consent auditing.

## Google OAuth client

Add this exact authorized redirect URI to the Google Web OAuth client:

`https://kriptoaman.com/api/auth/google/callback`

The browser-facing flow is:

1. `/api/auth/google/start`
2. Google authorization
3. `/api/auth/google/callback`
4. signed `HttpOnly; Secure; SameSite=Lax` session cookie
5. redirect to `/dashboard`

## Migration boundary

Do not switch the production frontend to this auth layer until the D1 binding and Google secrets are configured. Existing Base44 profile/KYC data remains untouched during this phase.

Password registration uses a six-digit verification code delivered by Resend. Password reset uses a single-use 32-byte random token with a 30-minute lifetime. Passwords are stored using PBKDF2-HMAC-SHA256 with a unique salt and a Cloudflare-compatible 100,000 iterations. The iteration count is encoded in every stored hash to support future upgrades.


## Passwordless admin sign-in

The login page recognizes `kriptoaman@gmail.com` and requests a single-use admin magic link instead of a password.

Required production bindings:

- `AUTH_DB` with migration `0001_auth_users.sql` applied
- `SESSION_SECRET` with at least 32 random characters
- `RESEND_API_KEY`
- `AUTH_EMAIL_FROM` using a verified Resend sending domain
- `ADMIN_EMAILS=kriptoaman@gmail.com`

The link expires after 10 minutes, is limited to one use, and creates a secure HttpOnly admin session valid for 30 days. Never implement direct email-only authentication without mailbox verification.

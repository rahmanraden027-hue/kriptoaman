# KriptoAman web/app access failover

This runbook defines a conservative active-standby design for `kriptoaman.com` and its first-party authentication. It does not change KAM chain state, wallets, balances, genesis, supply, RPC, or explorer configuration.

## Objective

Keep the public web application, login, and new-user registration available when one application origin is unhealthy. Failover must not create a second independent authentication database or a different session trust domain.

## Required topology

- Public hostname: `https://kriptoaman.com`
- Primary application origin: current production deployment
- Standby application origin: a second deployment of the same `main` build, reachable through a dedicated health-check hostname such as `https://standby.kriptoaman.com`
- Edge traffic manager: Cloudflare Load Balancing or an equivalent health-checked reverse proxy in front of the two origins
- Authentication database: the same production D1 database binding `AUTH_DB` for both origins
- Session signing: the same production `SESSION_SECRET` for both origins
- Email: the same verified `RESEND_API_KEY` and `AUTH_EMAIL_FROM`
- Auth origin: `AUTH_ORIGIN=https://kriptoaman.com` on both origins

Do not configure the standby with a separate writable auth database. Two independent writable user databases would create split-brain registrations and inconsistent sessions.

## Standby deployment gate

Before adding the standby origin to a traffic pool, deploy the exact same repository revision as production and configure the same authentication bindings. The standby must pass all of these checks through its dedicated hostname:

1. `/` returns HTTP 200 HTML.
2. `/login` returns HTTP 200 HTML.
3. `/register` returns HTTP 200 HTML.
4. `/api/auth/readiness` returns HTTP 200 JSON with `ready=true`, `registration=true`, and `configuration/database/email/session=true`.
5. Auth readiness returns `Cache-Control: no-store`.
6. A non-mutating invalid registration request returns the expected HTTP 400 validation response.
7. Existing auth security controls remain enabled: same-origin writes, rate limits, password policy, OTP verification, secure HttpOnly sessions, and no-store auth responses.

The repository verifier is:

```bash
PRIMARY_ORIGIN=https://kriptoaman.com \
SECONDARY_ORIGIN=https://standby.kriptoaman.com \
REQUIRE_SECONDARY=true \
node scripts/check-access-resilience.mjs
```

## Traffic manager policy

Use active-standby rather than round-robin while the platform uses session cookies and one shared auth database.

Recommended behavior:

- Primary weight/priority: active.
- Standby weight/priority: failover only.
- Health probe path: `/api/auth/readiness`.
- Healthy response: HTTP 200 and JSON readiness true.
- Failure threshold: at least two consecutive failures, not one transient timeout.
- Recovery threshold: at least two consecutive successful checks before returning traffic to primary.
- Do not cache `/api/**`, `/login`, `/register`, verification, reset-password, or session responses at the load-balancer layer.
- Preserve the public `Host`/origin semantics so cookies remain scoped to `kriptoaman.com`.

A pure frontend-only probe is insufficient because it could declare the site healthy while registration/database/email/session is unavailable.

## GitHub monitoring variables

The workflow `.github/workflows/access-resilience.yml` checks production hourly and on deployments.

Set repository Actions variables after the standby is provisioned:

- `SECONDARY_ORIGIN=https://standby.kriptoaman.com`
- `REQUIRE_SECONDARY_ORIGIN=true`

Until `REQUIRE_SECONDARY_ORIGIN=true`, the workflow still verifies the primary path and reports that the standby is not yet configured without failing the repository.

## Activation sequence

1. Create the standby application deployment from current `main`.
2. Bind the same `AUTH_DB` and production auth secrets/variables.
3. Add the dedicated standby hostname and TLS.
4. Run `scripts/check-access-resilience.mjs` against primary + standby.
5. Enable `SECONDARY_ORIGIN` monitoring in GitHub.
6. Create the edge load-balancer pool with primary active and standby failover-only.
7. Set the health monitor to auth readiness, not only `/`.
8. Test a controlled primary-origin withdrawal and confirm web, login, and registration remain operational through the public hostname.
9. Restore primary and confirm traffic returns only after the configured recovery threshold.
10. Set `REQUIRE_SECONDARY_ORIGIN=true` so loss of standby readiness becomes a monitored failure.

## Emergency failover

If the primary origin is unhealthy but the standby readiness check is fully healthy, disable or drain only the primary pool member. Do not change the public auth origin, database, session secret, or user records during failover.

If both origins fail readiness because `AUTH_DB`, email, or session configuration is unhealthy, routing traffic between origins will not solve the incident. Keep the public static application available where possible and repair the shared dependency rather than creating a new database during the incident.

## Rollback and safety

Never perform these actions as part of web failover:

- create a new KAM genesis;
- change Chain ID;
- move or rewrite wallet balances;
- change KAM supply;
- expose validator/admin RPC;
- create a second independent production auth database;
- rotate `SESSION_SECRET` during an outage unless compromise is suspected;
- delete D1 data or migrations to restore availability.

The failover layer is strictly for application availability. Blockchain network continuity remains governed by the KAM mainnet infrastructure plan.

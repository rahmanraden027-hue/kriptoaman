# KriptoAman Payments

This integration is for **payments for KriptoAman services in IDR**. It must not be used as a crypto exchange, fiat on-ramp, custody flow, deposit balance, or token purchase mechanism unless the required licensing, store policy, and provider approvals are separately satisfied.

## Provider

Initial provider: Xendit Invoice API.

## Cloudflare environment variables

Configure these as encrypted production secrets in Cloudflare Pages/Workers. Never commit them to GitHub or expose them through `VITE_*` variables.

- `PAYMENT_PROVIDER=xendit`
- `XENDIT_SECRET_KEY=<production secret key>`
- `XENDIT_CALLBACK_TOKEN=<callback verification token>`

## Endpoints

- `POST /api/payments/create` creates an IDR service checkout.
- `POST /api/payments/webhook` accepts Xendit callbacks only when `x-callback-token` matches `XENDIT_CALLBACK_TOKEN`.

The create endpoint deliberately returns only checkout-safe fields and never provider credentials.

## Webhook configuration

Configure the Xendit invoice callback URL as:

`https://kriptoaman.com/api/payments/webhook`

The callback token configured at Xendit must exactly match the Cloudflare `XENDIT_CALLBACK_TOKEN` secret.

## Before production activation

1. Complete the payment provider merchant/business verification.
2. Add production secrets in Cloudflare.
3. Configure and verify the callback URL/token.
4. Add a canonical payment database table and idempotent webhook persistence before granting any paid entitlement automatically.
5. Test success, expiration, duplicate callback, invalid callback token, provider outage, refund, and reconciliation paths.
6. Review Play Store billing/financial-services policy for each paid product before exposing the checkout in a Play-distributed build.

## Security rules

- Never accept `PAID` status from the Android client.
- Never put the provider secret key in browser/mobile source.
- Never grant an entitlement solely from a redirect URL.
- Only a verified server callback and server-side stored payment record may finalize an order.
- Do not collect seed phrases, private keys, or crypto deposit credentials in this payment flow.

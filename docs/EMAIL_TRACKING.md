# KriptoAman First-Party Email Engagement Tracking

This feature provides privacy-minimized first-party email engagement signals for KriptoAman campaigns.

## What it records

- First/last open timestamp and open count
- First/last click timestamp and click count
- Opaque campaign ID
- Opaque recipient ID

It intentionally does **not** persist IP address, user-agent, email body, or raw email address.

## Cloudflare bindings required

Create a KV namespace and bind it to Pages Functions as:

- `EMAIL_TRACKING_KV`

Create a secret used to protect reporting as:

- `EMAIL_TRACKING_ADMIN_KEY`

Without these bindings, open pixels still render and click redirects still work, but no engagement event is persisted and the status endpoint returns HTTP 503.

## Email URLs

Open pixel:

`https://kriptoaman.com/api/email-track/open?c=<campaign-id>&r=<opaque-recipient-id>`

Tracked click:

`https://kriptoaman.com/api/email-track/click?c=<campaign-id>&r=<opaque-recipient-id>&u=https%3A%2F%2Fkriptoaman.com%2F`

Only HTTPS destinations on `kriptoaman.com` or `www.kriptoaman.com` are allowed by the redirect endpoint.

## Admin report

`GET /api/email-track/status?c=<campaign-id>`

Header:

`Authorization: Bearer <EMAIL_TRACKING_ADMIN_KEY>`

## Interpretation limits

An open event is an engagement signal, not proof that a human read the message. Email clients may block remote images, prefetch them, or proxy image requests. Clicks are generally a stronger signal but can also be produced by security scanners or link-preview systems.

## Retention

KV event records expire after 180 days.

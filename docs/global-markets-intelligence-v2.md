# KriptoAman Global Markets Intelligence V2

## Product scope

This layer extends KriptoAman with market-information tooling for Crypto, Forex, Metals, USD macro context, and cross-asset analytics. It does not provide broker execution, leverage, margin, deposits, or buy/sell order placement.

## Professional market data

Server-side environment variables:

- `TWELVE_DATA_API_KEY` — Twelve Data API key. Keep this secret server-side; never expose it through Vite/client variables.
- `TWELVE_DATA_DXY_SYMBOL` — optional provider symbol for the US Dollar Index. Defaults to `DXY`. Set this to the exact entitled symbol returned by your Twelve Data account/catalog if different.

When `TWELVE_DATA_API_KEY` is configured, `/api/global-markets` prefers Twelve Data and enables professional quote metadata. Without it, the existing hourly reference provider remains the fallback.

Professional-only endpoints:

- `/api/global-markets-history?symbol=XAU%2FUSD&interval=1h&outputsize=96`
- `/api/global-market-intelligence`

The history endpoint uses an allowlist for symbols and intervals. Cross-asset intelligence calculates Pearson correlation on overlapping daily returns, annualized historical volatility, and 20-session momentum. These are descriptive statistics, not forecasts or trading signals.

Public displays using Twelve Data must keep provider attribution unless the applicable commercial agreement explicitly permits otherwise.

## Economic calendar

Server-side environment variable:

- `TRADING_ECONOMICS_CREDENTIAL` — Trading Economics API credential in the format supplied by the provider account.

The endpoint `/api/economic-calendar` requests medium/high-importance United States events for the upcoming seven days. No guest/demo credential is committed to the repository.

## Resilience behavior

- Professional quote failure falls back to the existing reference market feed.
- OHLC, correlation, DXY, or calendar data is shown as unavailable when its professional source is not configured or cannot verify data.
- No synthetic values are invented to fill missing provider data.
- Local price alerts are stored only in the user's browser and do not place transactions.

## Release gate

Global Markets V2 endpoints and UI surfaces are included in the production security lint gate, normal regression tests, and production build checks before merge.

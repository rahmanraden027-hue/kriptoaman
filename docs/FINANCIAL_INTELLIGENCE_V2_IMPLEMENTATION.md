# KriptoAman Financial Intelligence V2

Status: implementation branch only; production/main remains unchanged.

## Objectives
1. AI Insight detail page: market regime, momentum, volatility, correlation, sentiment, risk and data timestamps.
2. Security Center: KYC, 2FA, login/session/device visibility, wallet connection state and actionable recommendations.
3. Trading Workspace: chart-first layout, pair selector, watchlist, order panel, positions/history and risk summary. Preserve Paper Trading behavior.
4. Portfolio Analytics: allocation, realized/unrealized P&L, performance by asset/network and historical balance.
5. Market Intelligence: breadth, dominance, volume, sectors, gainers/losers, trending and alerts.
6. Notification Center: price, security, KAM network, portfolio and system notifications with severity/read state.
7. Global Search: coins, pairs, networks, wallet addresses, transaction hashes and platform navigation.
8. New-user Onboarding: progressive setup for account security, KYC, wallet and watchlist without blocking exploration unnecessarily.
9. Loading/empty/error states: consistent skeletons, retry actions, stale-data indicators and AppErrorBoundary-safe fallbacks.
10. Mobile refinement: Home/Market/Trade/Wallet/More bottom navigation, single-column cards, touch-safe controls and mobile trading/portfolio layouts.

## Safety boundaries
- Do not modify authentication/OTP semantics as part of UI work.
- Do not modify KYC provider integration or stored verification data.
- Do not modify wallet signing/private-key behavior.
- Do not modify KAM Mainnet RPC, contracts, treasury or consensus infrastructure.
- Do not weaken security headers, CSP, rate limits or existing security-hardening tests.
- Never display fabricated live values. Unknown/unavailable data must be labelled unavailable/stale/demo as applicable.
- AI Insight is market intelligence, not a guarantee of returns or personalized investment advice; show source/timestamp/confidence where available.
- Security Score must be derived from measurable controls; never use a decorative arbitrary score.

## Rollout gates
A. Shared design tokens + responsive shell/sidebar/mobile nav.
B. Dashboard hierarchy + portfolio + market overview.
C. AI Insight + Security Center.
D. Trading Workspace + Portfolio Analytics + Market Intelligence.
E. Notifications + Global Search + Onboarding.
F. Empty/loading/error states + accessibility + mobile refinement.
G. Regression: build, security-hardening, auth/OTP, KYC, wallet, market data, paper trading, routing, Android/mobile viewport.
H. Preview deployment and manual review before any merge to main.

## Acceptance criteria
- No production change until preview review passes.
- Existing critical flows remain reachable and behaviorally unchanged unless separately approved.
- Desktop and mobile navigation are consistent.
- All intelligence/security metrics expose provenance/status instead of implying unsupported certainty.
- Failed APIs produce useful fallback states, not a blank/black screen.
- Main branch merge occurs only after regression checks and explicit review of the preview.

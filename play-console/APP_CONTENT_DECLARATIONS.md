# KriptoAman — Play Console App Content Declarations

Prepared: 18 August 2026

This document is the copy-ready source of truth for Play Console. Final selections must match the exact build uploaded to Google Play.

## 1. App access / sign-in details

### Does the app restrict all or some functionality behind sign-in?

**Answer: Yes.**

Public content exists, but Home/Portfolio/Wallet/Security and account features require authentication.

### Reviewer account requirement

Create one dedicated **normal user** reviewer account. Do not use the KriptoAman admin account.

Required properties:

- Role: standard user
- Active and reusable at all times
- No location restriction
- No expiring password during review
- No payment/subscription requirement
- Must not require a one-time OTP that Google cannot retrieve
- Must not require admin TOTP or biometrics
- Must allow Google to access the core authenticated experience

### Play Console instructions — English

Use this text after a dedicated reviewer account exists:

`Open KriptoAman and select Login. Enter the reviewer email and password provided below. This account is a standard non-admin test account with access to the authenticated market-intelligence, watch-only portfolio, wallet-monitoring, and account-security experience. Do not use the administrator login. No payment or subscription is required. If identity verification is shown, it is not required to access the core review flow unless specifically stated in these instructions.`

Fields still requiring an actual account before submission:

- Reviewer email: `TO_BE_CREATED`
- Reviewer password: `TO_BE_CREATED`

Do not put real admin credentials in Play Console.

## 2. Ads declaration

### Does the app contain ads?

**Prepared answer: No.**

Repository audit found no AdMob/advertising SDK references in the submitted code path. Reconfirm immediately before upload if any monetization or ad SDK is added.

## 3. Target audience and content

### Target age group

**Prepared answer: 18 and over.**

Rationale: KriptoAman is a crypto market-intelligence, portfolio-monitoring, and financial-information product and is not designed for children.

### Is the app designed for children?

**Answer: No.**

### Store listing appeal to children

**Answer: No.**

Do not use child-oriented characters, school-age targeting, toy/game framing, or youth-directed advertising in store assets.

## 4. Financial Features Declaration

All apps must complete this declaration.

### Prepared selection for the current public build

**Select: Other**

Suggested description:

`KriptoAman provides digital-asset market intelligence, educational information, watch-only portfolio monitoring, and monitoring of public blockchain addresses. The submitted public build does not custody users' crypto assets, does not request seed phrases or private keys, and does not execute cryptocurrency exchange, deposits, withdrawals, swaps, lending, staking, or trading.`

### Do not select for the current build

- Cryptocurrency exchange
- Cryptocurrency wallet, if Google is using this term for software that stores keys/signs transactions
- Mobile payments or digital wallet
- Money transfer/wire services
- Personal loans or lending
- Stock trading
- NFT sales/trading/awards

If Play Console specifically classifies the watch-only connected-wallet experience as a cryptocurrency wallet despite the absence of key custody/signing, stop and re-evaluate the form rather than forcing an inaccurate answer.

### Crypto policy positioning

KriptoAman current release is watch-only/non-custodial monitoring. It must not be represented as a licensed exchange or custodial wallet unless those functions and required legal authorizations actually exist.

## 5. Data Safety — top-level answers

### Does the app collect or share any required user data types?

**Answer: Yes — data is collected.**

The current code can transmit account/analytics/KYC-related data off device, so `No data collected` would be inaccurate.

### Is all user data encrypted in transit?

**Prepared answer: Yes**, subject to final production verification that every production endpoint and third-party integration uses HTTPS/TLS.

### Can users request deletion of their data?

**Answer: Yes.**

- In-app: Settings/Profile or Security → Hapus Akun
- Public web path: `https://kriptoaman.com/AccountDeletion`
- Privacy policy: `https://kriptoaman.com/PrivacyPolicy`

## 6. Data Safety — data type matrix

The matrix below is intentionally conservative. It reflects current source behavior and should be reconciled against production environment variables and vendor contracts at submission time.

### Personal info — Name

- Collected: **Yes**, when the user provides a profile name and analytics is enabled.
- Purpose: Account management; Analytics/personalization if Mixpanel is enabled.
- Optional: User-entered profile field.
- Shared: Mark **No** only if Mixpanel/other recipient qualifies as a Google-defined service provider acting on KriptoAman's behalf. Otherwise mark Yes.

### Personal info — Email address

- Collected: **Yes**.
- Purpose: Account management, authentication, security, support; analytics when enabled.
- Required: Yes for account creation/login.
- Shared: Evaluate service-provider exemption for Mixpanel and any email/auth provider.

### Personal info — User IDs

- Collected: **Yes**.
- Purpose: Account management, authentication, analytics, fraud/security.
- Shared: Evaluate service-provider exemption for analytics providers.

### Financial info — Other financial information

Use this conservatively for portfolio/holdings/public-wallet monitoring if Play Console treats monitored asset/portfolio information as financial information.

- Collected: **Yes when users save or monitor portfolio/public-address information off device.**
- Purpose: App functionality; account-related portfolio monitoring.
- Shared: Normally No unless the data is sent to a third party outside a service-provider/user-initiated exemption.

### App activity — App interactions

- Collected: **Yes when Mixpanel analytics is enabled.**
- Examples in source: login success, logout, page view, preference/security interactions.
- Purpose: Analytics; app functionality/quality.
- Shared: Evaluate Mixpanel service-provider status under the applicable contract.

### App info and performance — Crash logs / Diagnostics

- Collected: **Potentially Yes** if production crash/error events are transmitted to analytics; local-only logs do not count as collection until transmitted off device.
- Purpose: Analytics; app stability/debugging.
- Shared: Evaluate analytics service-provider status.

### Device or other IDs

- Collected: **Likely Yes when analytics is enabled**, because analytics SDKs can create/use distinct identifiers even without Android advertising permission.
- Purpose: Analytics; account/session measurement.
- Shared: Evaluate service-provider status.

### Approximate location

The privacy policy allows server/network infrastructure to derive approximate city/country from network metadata. Google requires inferred approximate location to be disclosed if collected.

- Collected: **Confirm production behavior.** If IP-derived city/country is stored/transmitted as user data, mark Yes.
- Purpose: Security/fraud prevention and account/session protection.

### Photos and videos / identity documentation

Do not classify KYC only by the Android permission model. If the submitted app launches Didit's official verification flow and the user provides an identity document and live selfie, the applicable Data Safety disclosure must reflect what the app/SDK/provider collects through that flow.

Current product disclosure:

- Identity document and live selfie are processed through the official Didit verification flow.
- KriptoAman stores the required session reference/status rather than seed phrases/private keys.
- Confirm with the Didit integration documentation/contract which Google Play Data Safety categories must be marked as collected/shared by the app versus user-initiated/provider processing.

## 7. Privacy policy

Use:

`https://kriptoaman.com/PrivacyPolicy`

The policy must remain publicly accessible without login and match the submitted production build.

## 8. Account deletion

Use:

`https://kriptoaman.com/AccountDeletion`

The public page should explain:

- how to request/delete an account;
- what data is deleted;
- any limited retention required for legal/security purposes;
- that public blockchain data outside KriptoAman's control cannot be erased from the blockchain.

## 9. Content rating questionnaire — prepared direction

Answer based on actual app content. For the current release:

- Violence: None
- Sexual content/nudity: None
- Profanity/crude humor: None
- Controlled substances: None
- Gambling/simulated gambling: None
- User-generated public social content: None, unless a public posting/chat feature is actually enabled
- Location sharing: No public location-sharing feature
- In-app purchases: No, unless a paid Play Billing product is added
- Financial/crypto information: Yes, where questionnaire context asks about financial subject matter

Do not guess answers if the questionnaire wording differs materially; use the submitted build as the source of truth.

## 10. News declaration

Prepared answer: **Not a News app**, unless Google presents a broader question that includes market data/news aggregation and the submitted build materially functions as a news publisher.

## 11. Government app declaration

Prepared answer: **No.**

Do not imply government affiliation, OJK approval, or regulator endorsement.

## 12. Health app declaration

Prepared answer: **No.**

## 13. Ads / monetization / Play Billing

Current release package should not claim subscriptions, digital-item sales, or paid functionality unless those functions are actually enabled and use the required Google Play billing mechanism where applicable.

## 14. Country/region targeting

Fastest conservative launch path:

- Start with Indonesia and other jurisdictions only after confirming the app's actual feature classification and local requirements.
- Because the current build is market-intelligence/watch-only and not an exchange/custodial wallet, do not voluntarily describe it as an exchange to unlock broader targeting.
- If future builds add crypto exchange/custody/signing, re-run jurisdictional licensing review before expanding distribution.

## 15. Final mandatory verification immediately before Play submission

1. Confirm production Mixpanel token status and exactly which analytics data leaves the device.
2. Confirm Didit production flow and Data Safety categories/vendor relationship.
3. Confirm `privacy@kriptoaman.com` can receive mail, or replace it with an active privacy mailbox.
4. Create the reusable normal-user Google reviewer account.
5. Verify no ad SDK was added.
6. Verify account deletion end-to-end on a normal test account.
7. Verify every store claim against the exact signed AAB uploaded to Play Console.
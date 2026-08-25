# KriptoAman Store Submission Package

Release line: KriptoAman 1.5
Android package: `com.kriptoaman.app`
Android `versionCode`: `6`
Product position: digital-asset intelligence, public-address monitoring, market data, portfolio simulation, security and risk-analysis workspace. Public release must not claim custody, exchange execution, guaranteed investment returns, or regulatory approval unless separately supported.

## Master listing identity

**App name**
KriptoAman

**English subtitle / short positioning**
Digital Asset Intelligence

**Indonesian short positioning**
Intelijen Aset Digital

**Primary category recommendation**
Finance

**Secondary positioning**
Utilities / market monitoring, where the store supports a secondary category.

## English short description

Monitor digital assets, public wallet addresses, market data, portfolio scenarios, and security signals in one intelligence workspace.

## Indonesian short description

Pantau aset digital, alamat dompet publik, data pasar, simulasi portofolio, dan sinyal keamanan dalam satu ruang kerja intelijen.

## English full description

KriptoAman is a digital-asset intelligence workspace designed for market monitoring, public-address observation, portfolio analysis, and security awareness.

Use KriptoAman to explore market information, review supported digital-asset data, monitor public blockchain addresses, organize portfolio scenarios, and access security-focused tools from one modern interface.

Core capabilities include:

- Digital-asset market monitoring and market intelligence.
- Public blockchain address monitoring without requesting seed phrases or private keys.
- Portfolio analysis and scenario tools.
- Security and account-protection guidance.
- Multi-network status and data-source transparency.
- Indonesian and English interface support.

KriptoAman is designed around transparent data handling and clear product boundaries. The public application does not require users to provide wallet seed phrases or private keys for watch-only monitoring.

Market information may be delayed, unavailable, or supplied by third-party data providers. Information shown in KriptoAman is informational and should not be treated as a promise of performance, guaranteed price, or personalized investment advice.

## Indonesian full description

KriptoAman adalah ruang kerja intelijen aset digital yang dirancang untuk pemantauan pasar, pengamatan alamat publik, analisis portofolio, dan peningkatan kesadaran keamanan.

Gunakan KriptoAman untuk menjelajahi informasi pasar, meninjau data aset digital yang didukung, memantau alamat blockchain publik, mengatur skenario portofolio, dan mengakses perangkat keamanan dalam satu antarmuka modern.

Kemampuan utama mencakup:

- Pemantauan pasar aset digital dan market intelligence.
- Pemantauan alamat blockchain publik tanpa meminta seed phrase atau private key.
- Analisis portofolio dan perangkat simulasi skenario.
- Panduan keamanan dan perlindungan akun.
- Transparansi status multi-jaringan dan sumber data.
- Dukungan antarmuka Bahasa Indonesia dan Bahasa Inggris.

KriptoAman dirancang dengan batas produk yang jelas dan transparansi pengelolaan data. Aplikasi publik tidak meminta pengguna memberikan seed phrase atau private key untuk fungsi pemantauan watch-only.

Informasi pasar dapat terlambat, tidak tersedia sementara, atau berasal dari penyedia data pihak ketiga. Informasi di KriptoAman bersifat informatif dan bukan janji performa, jaminan harga, atau nasihat investasi personal.

## Privacy and data declarations — preparation checklist

Before any production submission, the publisher must reconcile declarations with the exact production build and all integrated SDKs.

Prepare and verify:

- Privacy Policy URL on an active HTTPS page.
- In-app privacy-policy access.
- Account-deletion path and deletion instructions.
- Authentication data: email address, account identifier and security/session data where applicable.
- KYC/identity data only if the production release exposes identity-verification functionality.
- Public wallet addresses and blockchain/network queries used for watch-only features.
- Diagnostics, analytics or product-usage data collected by enabled SDKs.
- Third-party SDK collection/sharing behavior.
- Encryption-in-transit status.
- Whether data is required or optional for each feature.
- Data-retention and account-deletion behavior.

Do not mark a data type as collected, shared, encrypted, optional, or deletable until verified against the production implementation and third-party SDK behavior.

## Google Play submission record

Required package: signed AAB from the latest green `main` build.

Before submission:

- Confirm Play developer identity and package registration.
- Complete store listing, category, tags and support contact details.
- Complete Privacy Policy and Data safety declarations.
- Complete App content declarations including ads, target audience, content rating and any restricted-access instructions.
- Provide a working reviewer/demo account and instructions if authenticated areas are needed for review.
- Upload current screenshots and feature graphic.
- Verify the submitted AAB is produced from the recorded release commit and production signing identity.

## Apple App Store submission record

Bundle identity: `com.kriptoaman.app` unless the Apple Developer account requires an approved alternate identifier.

Current repository gate:

- iOS Capacitor project can be generated and synced in CI.
- iOS identity validation passes.
- Unsigned Release compile for the iOS Simulator passes on macOS CI.
- Final App Store archive is still an external signed release step.

Before App Store submission:

- Confirm Apple Developer membership and App Store Connect app record.
- Configure Apple Distribution signing and provisioning.
- Produce an App Store archive/IPA from the exact release commit.
- Provide app name, subtitle, categories, age rating, privacy-policy URL and App Privacy answers.
- Provide screenshots and product-page metadata for required device classes.
- Add review notes and working credentials for authenticated functionality.
- Validate in TestFlight before production review.

## Samsung Galaxy Store

Use the signed production APK or the package format currently accepted by Seller Portal. Confirm package policy at submission time. Complete seller verification, listing metadata, age/content declarations, privacy information, screenshots, countries/regions and reviewer access before review.

## Xiaomi / GetApps

Use the signed production APK or currently accepted package format. Confirm developer-account regional eligibility, app category, privacy/compliance declarations, screenshots, reviewer access and local distribution requirements before submission.

## Huawei AppGallery

Use the signed Android artifact in the format currently accepted by AppGallery Connect. Complete developer verification, app information, privacy/compliance declarations, countries/regions, screenshots, content rating and reviewer access before review.

## Amazon Appstore

Use the signed production APK. Verify target device compatibility and Amazon policy requirements, then complete listing metadata, privacy/compliance disclosures, screenshots, content rating and test/reviewer access.

## Review-account template

Create a dedicated non-admin reviewer account for each store when authenticated access is required.

Reviewer account rules:

- Never use the production administrator account.
- Do not expose private keys, seed phrases, signing secrets or privileged API credentials.
- Seed only non-sensitive demonstration data when needed.
- Keep the account active through the review period.
- Document exact navigation steps needed to reach restricted features.

## Screenshot set

Capture from the final production build, not design mockups.

Recommended story sequence:

1. Home / intelligence overview.
2. Market monitoring.
3. Portfolio analysis or empty-state workflow using real app behavior.
4. Public-address watch-only monitoring.
5. Security workspace.
6. Language support / additional product capability where useful.

Screenshots must not show fabricated balances, synthetic live prices presented as real, private credentials, seed phrases, internal administrator controls or unsupported regulatory claims.

## Release evidence record

For every submitted binary retain:

- Git commit SHA.
- CI workflow run ID.
- Store-facing version and Android `versionCode` or iOS build number.
- Artifact filename.
- Artifact SHA-256 digest where available.
- Signing identity/certificate fingerprint recorded securely.
- Date submitted.
- Store and track/channel.
- Review outcome and reviewer notes.

## Current release boundary

Android 1.5 has a signed AAB and signed APK build path on `main`. iOS has a green unsigned App Store preflight path. Final publication remains complete only after each external publisher console accepts the metadata, binary, compliance declarations and review submission.
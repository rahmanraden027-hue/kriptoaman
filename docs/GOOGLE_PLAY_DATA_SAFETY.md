# Google Play Data Safety — KriptoAman

Updated: 2026-08-17

This document is an internal declaration guide for the current public/store build. It must be checked again against the exact AAB uploaded to Google Play Console.

## Product scope

The public build is watch-only / market intelligence. It does not provide custody, deposits, withdrawals, swaps, lending, staking, bridge execution, or trading execution. The public KYC page does not accept new identity documents, selfies, or identity numbers.

## Data categories currently processed

### Personal information
- Email address: collected for account creation, authentication, verification, account recovery, security, and service communication.
- Name/profile fields: optional, collected when the user chooses to add them for account profile functionality.

### App activity / account activity
- Account preferences and security settings used to operate user-requested features.
- Authentication challenges and consent records used for account and security operations.

### Device or other identifiers / diagnostics
- User-Agent-derived browser and operating-system label.
- Session timestamps.
- IP address: processed for security; stored as a one-way hash and a masked display value in the session registry.
- Approximate country/city only when provided by network infrastructure.

### Security information
- Password is never stored as plaintext; a password hash is stored.
- TOTP secret is encrypted server-side when 2FA is enabled.
- Backup-code verifiers are stored as hashes.

### Public wallet data
- Public wallet addresses intentionally connected by the user may be processed to provide watch-only portfolio monitoring.
- KriptoAman does not request or store seed phrases or private keys in the public build.

## Data not collected by the current public build
- New government ID document images.
- New selfies for KYC.
- New government ID numbers through the public KYC screen.
- Payment card data.
- Bank-account credentials.
- Private wallet keys or seed phrases.
- Custodial crypto transaction instructions.

## Sharing / sale

KriptoAman does not sell user personal data. Infrastructure providers, RPC/blockchain endpoints, and market-data providers can receive technical network metadata that is inherent to a network request. Do not mark data as shared merely because it is processed by a service provider acting on behalf of KriptoAman; answer the Play Console form according to Google's current definitions and the contracts/configuration actually in use.

## Encryption and deletion

- Network transport uses HTTPS/TLS.
- Auth sessions use secure HttpOnly cookies.
- Users can initiate permanent account deletion in-app from Settings/Profile.
- A public deletion page is available at `/AccountDeletion` and provides an email path for users who cannot sign in.
- First-party deletion removes the authentication profile, sessions, TOTP record, internal balance record, account consent, and authentication challenges associated with the email/account.
- Limited retention can apply only where needed for legal, security, fraud-prevention, or dispute purposes and is disclosed in the privacy policy.

## Console review checklist

Before submitting Data Safety, compare every answer against: the exact release AAB, Android permissions, active SDKs, network calls, privacy policy, account-deletion flow, and any third-party service configured in production. If a new analytics, crash-reporting, advertising, KYC, payment, or identity SDK is enabled, this declaration must be updated before release.

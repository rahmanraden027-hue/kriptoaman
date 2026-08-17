# Google Play Release Checklist — KriptoAman

Updated: 2026-08-17

## Store positioning
- App name: KriptoAman
- Positioning: crypto market intelligence, watch-only monitoring, education, and risk information.
- Do not describe the public build as an exchange, custodian, deposit service, withdrawal service, lending service, staking service, swap service, or auto-trading service.
- Avoid promises of profit, guaranteed safety, guaranteed scam prevention, or unverified regulatory approval.

## Privacy and account deletion
- Privacy policy public page: `/PrivacyPolicy`.
- Account deletion public page: `/AccountDeletion`.
- In-app deletion: Settings/Profile → Hapus Akun.
- Play Console account-deletion URL should point to the public AccountDeletion page on the production `https://kriptoaman.com` domain after deployment is verified.
- Confirm `privacy@kriptoaman.com` is receiving mail before submission.

## Data Safety
- Use `docs/GOOGLE_PLAY_DATA_SAFETY.md` as the internal source of truth.
- Recheck the exact release AAB for SDKs, permissions, and network behavior before answering the console form.
- Current public KYC screen must remain non-collecting unless Data Safety and privacy disclosures are updated before release.
- Any future KYC/identity-document collection requires a new Data Safety review and verified deletion lifecycle.

## Android release
- Release regression tests pass.
- Android sync passes.
- Release AAB and APK build with signing step successful.
- Verify package/application ID and version code are correct and incremented as required.
- Keep only permissions necessary for the public functionality.
- Run smoke test on a physical Android device: registration, email verification, login, 2FA, session list/revoke, market, wallet watch-only, network/gas, referral, privacy policy, account deletion entry point, logout/login.

## Play Console content
- Category and tags must match finance-information/watch-only functionality, not exchange execution.
- Short and full descriptions must match actual enabled features.
- Screenshots must be from the current release build and must not show disabled financial execution features.
- App-access instructions must explain any login requirement and provide reviewer access if Google requests it.
- Complete content rating, target audience, ads declaration, financial features declaration, and Data Safety based on the current build.

## Submission gate
Do not promote beyond internal/closed testing until the production privacy-policy URL and deletion URL are accessible without authentication, the exact AAB has passed CI, and the Data Safety answers have been compared against the exact build being uploaded.

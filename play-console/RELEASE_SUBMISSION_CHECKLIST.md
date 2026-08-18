# KriptoAman — Google Play Submission Checklist

Prepared: 18 August 2026

Legend:

- `[READY]` prepared/verified in repository or Android pipeline
- `[ACTION]` must be completed in Play Console or on a real device
- `[EXTERNAL]` depends on an external organization/provider
- `[VERIFY]` must be reconfirmed against production before submission

## A. Developer organization

- `[EXTERNAL]` D-U-N-S number for PT KRIPTO AMAN INDONESIA — pending D&B Indonesia.
- `[ACTION]` Create/complete Google Play developer account as Organization after D-U-N-S is available.
- `[ACTION]` Enter legal organization identity exactly as validated by D&B/Google payments profile.
- `[VERIFY]` Do not place legal IDs, tax numbers, private identity documents, or signing credentials in this public repository.

## B. Android release

- `[READY]` Package ID: `com.kriptoaman.app`
- `[READY]` Version name: `1.3`
- `[READY]` Version code: `4`
- `[READY]` Target SDK: API 36
- `[READY]` Signed AAB pipeline has previously succeeded on trusted `main`.
- `[READY]` Android manifest currently requests INTERNET only and disables app backup.
- `[ACTION]` After all release copy/compliance changes are merged, produce/verify the latest trusted signed AAB from `main` before upload.

## C. Main store listing

Copy from `play-console/STORE_LISTING.md`.

- `[READY]` App name
- `[READY]` Indonesian short description
- `[READY]` Indonesian full description
- `[READY]` English short description
- `[READY]` English full description
- `[READY]` Category recommendation: Finance
- `[READY]` Website
- `[READY]` Support email
- `[READY]` Privacy-policy URL
- `[READY]` Account-deletion URL
- `[READY]` 512 × 512 icon exists in repository
- `[ACTION]` Produce final 1024 × 500 feature graphic
- `[ACTION]` Capture at least 4 real production-build phone screenshots at 1080 × 1920

## D. App content

Copy from `play-console/APP_CONTENT_DECLARATIONS.md`.

- `[READY]` Ads declaration prepared: No, subject to final code recheck
- `[READY]` Target audience prepared: 18+
- `[READY]` Children declaration prepared: not designed for children
- `[READY]` Financial Features Declaration narrative prepared
- `[READY]` Data Safety matrix prepared
- `[READY]` Privacy policy route exists
- `[READY]` Public account deletion route exists
- `[READY]` In-app account deletion implementation exists for normal users
- `[READY]` Content-rating answer direction prepared
- `[READY]` Government app: No
- `[READY]` Health app: No
- `[ACTION]` Create a reusable standard reviewer account
- `[ACTION]` Enter reviewer credentials/instructions in Play Console in English
- `[VERIFY]` Confirm production analytics/Mixpanel behavior
- `[VERIFY]` Confirm Didit Data Safety/vendor classification

## E. Data Safety final gate

Do not submit `No data collected`.

At minimum, reconcile these current production behaviors:

- account email/user ID/profile information;
- authentication and session/security metadata;
- Mixpanel analytics when enabled;
- app interactions and potentially analytics identifiers;
- monitored portfolio/public blockchain address data where stored off-device;
- KYC session/status and official Didit flow;
- any approximate location inferred/stored from network metadata;
- crash/diagnostic data if transmitted off-device.

For third-party transfers, apply Google's service-provider exemption only when the actual vendor relationship qualifies. Do not guess.

## F. Reviewer access final gate

Reviewer credentials must:

- remain valid throughout review;
- be reusable;
- work regardless of reviewer location;
- not require a one-time OTP inaccessible to Google;
- not require admin TOTP;
- not require biometrics;
- not require a paid subscription;
- expose core authenticated app functionality.

Recommended: a dedicated normal-user reviewer account with the smallest privileges necessary to review the public build.

## G. Testing track

- `[ACTION]` Create Internal testing release.
- `[ACTION]` Upload the latest trusted signed AAB.
- `[ACTION]` Add internal testers.
- `[ACTION]` Install KriptoAman from the Google Play testing link on a physical Android device.
- `[ACTION]` Run smoke tests:
  - install/update;
  - launch/splash/icon;
  - login;
  - registration/email verification separately if reviewer flow does not use it;
  - Home;
  - Market;
  - Portfolio;
  - Wallet/watch-only;
  - Security/2FA/session management;
  - KYC entry flow when enabled;
  - back navigation;
  - keyboard/input on small screen;
  - offline/reconnect;
  - legal links;
  - account deletion on a disposable normal test account.

## H. Production submission gate

Do not send for production review until all of the following are true:

1. D-U-N-S/Organization verification completed.
2. Latest signed AAB generated after final release changes.
3. Internal-testing installation from Google Play succeeds.
4. Real-device smoke test succeeds.
5. Reviewer account works without OTP/TOTP/biometric dependency.
6. Store screenshots match the submitted build.
7. Data Safety matches actual production data flow.
8. Financial Features Declaration matches watch-only/non-custodial behavior.
9. Privacy Policy and Account Deletion URLs are publicly reachable.
10. No unsupported claim of exchange, custody, regulator approval, guaranteed returns, rankings, or security certification appears in store metadata or screenshots.

## I. Fastest execution order once D-U-N-S arrives

1. Finish Organization verification.
2. Create the app entry with package `com.kriptoaman.app`.
3. Paste Main Store Listing copy.
4. Upload icon, feature graphic, and screenshots.
5. Complete App Content declarations.
6. Add reviewer credentials.
7. Upload latest signed AAB to Internal testing.
8. Install/test from Play.
9. Correct any Play Console warnings/blockers.
10. Send eligible release for review.
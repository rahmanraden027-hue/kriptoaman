# KriptoAman Global Store Release Readiness

Release candidate: Android 1.5 (`versionCode 6`) / application ID `com.kriptoaman.app`.

## Release objective

Prepare one controlled KriptoAman release line for Google Play and Android stores that accept APK/AAB packages, while keeping Apple App Store work on a separate signed iOS pipeline.

## Android production artifacts

The repository CI builds and verifies both signed artifacts:

- `kriptoaman-play-aab` — primary package for Google Play and any store that accepts Android App Bundles.
- `kriptoaman-direct-apk` — signed release APK for stores/distribution channels that accept APK upload.

The release pipeline must pass regression tests, Android identity validation, signing configuration validation, signed artifact verification, checksum generation, and production security checks before publication.

## Store matrix

| Store / channel | Package | Repository readiness | External publisher action |
| --- | --- | --- | --- |
| Google Play | AAB | Ready after CI passes | Upload release, complete Data safety/content declarations, submit for review |
| Samsung Galaxy Store | APK or accepted Android package per portal | Signed APK available | Create/verify Seller Portal account, listing, compliance declarations, submit binary |
| Xiaomi / GetApps | APK or package accepted by regional developer console | Signed APK available | Verify developer account/region eligibility, listing, declarations, submit binary |
| Huawei AppGallery | APK/App Bundle format supported by console | Signed Android artifact available | AppGallery Connect account, listing/compliance, submit binary |
| Amazon Appstore | APK | Signed APK available | Developer account, listing/compliance, device review, submit binary |
| Other Android stores | APK/AAB depending on store | Package set available | Check each store's current package and policy requirements before upload |
| Apple App Store | IPA/App Store archive | Not yet release-ready in this repository | Apple Developer membership, iOS Capacitor platform, bundle signing, provisioning, App Store Connect metadata and review |

## Android release gate

A release is considered technically ready only when all of the following are true:

- CI / regression tests pass.
- Production security gate passes.
- Live smoke tests pass.
- Android application ID remains `com.kriptoaman.app`.
- Release versionCode is unique and incremented.
- Release AAB is signed with the production Play key.
- Direct APK is signed with the same controlled production identity unless a store explicitly requires a different signing arrangement.
- SHA-256 checksum is generated for direct APK distribution.
- Privacy policy, account deletion path, support contact, screenshots, icon, feature graphic and bilingual listing copy are current.
- Store declarations accurately describe KriptoAman as a market-intelligence / watch-only product where applicable; no listing text may claim custody, exchange execution, regulatory approval, or investment guarantees unless the product and approvals actually support those claims.

## Apple App Store blocker

The current repository contains the Android Capacitor platform but does not yet contain an iOS platform or `@capacitor/ios` dependency. Therefore an IPA/App Store archive cannot yet be produced from this repository. The iOS release requires a separate hardening step on macOS with Apple signing credentials and App Store Connect access.

Required iOS preparation:

1. Add `@capacitor/ios` at the same Capacitor major/minor line used by the app.
2. Generate and commit/safely manage the iOS Capacitor project.
3. Set the iOS bundle identifier to the approved KriptoAman identifier.
4. Configure app icons, launch assets, privacy usage descriptions and entitlements.
5. Configure Apple Distribution certificate and App Store provisioning profile through protected CI secrets or App Store Connect API credentials.
6. Build, archive, export and validate an App Store IPA.
7. Run TestFlight validation before production submission.

## Publication discipline

Do not reuse old binaries after a release-candidate code change. Rebuild from the exact merged `main` commit and retain the commit SHA, CI run ID, artifact digest and store version number in the release record.

Do not bypass required security checks or branch protections. Store submission is the final external publishing step after repository and binary gates are green.

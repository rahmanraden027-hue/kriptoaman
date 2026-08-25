# KriptoAman Global Store Release Readiness

Release candidate: Android 1.5 (`versionCode 6`) / application ID `com.kriptoaman.app`.

## Release objective

Prepare one controlled KriptoAman release line for Google Play and Android stores that accept APK/AAB packages, while keeping Apple App Store signing and publication on a separate protected iOS release path.

## Android production artifacts

The repository CI builds and verifies both signed artifacts:

- `kriptoaman-play-aab` — primary package for Google Play and any store that accepts Android App Bundles.
- `kriptoaman-direct-apk` — signed release APK for stores/distribution channels that accept APK upload.

The release pipeline must pass regression tests, Android identity validation, signing configuration validation, signed artifact verification, checksum generation, and production security checks before publication.

## Store matrix

| Store / channel | Package | Repository readiness | External publisher action |
| --- | --- | --- | --- |
| Google Play | AAB | Signed AAB production path ready after green `main` CI | Upload release, complete Data safety/app-content declarations and submit for review |
| Samsung Galaxy Store | APK or accepted Android package per portal | Signed APK production path available | Seller Portal verification, listing, compliance declarations and binary submission |
| Xiaomi / GetApps | APK or package accepted by regional developer console | Signed APK production path available | Developer account/region eligibility, listing, declarations and binary submission |
| Huawei AppGallery | Package format supported by AppGallery Connect | Signed Android artifact available | AppGallery Connect account, listing/compliance and binary submission |
| Amazon Appstore | APK | Signed APK production path available | Developer account, listing/compliance, device review and binary submission |
| Other Android stores | APK/AAB depending on store | Controlled Android package set available | Check current package and policy requirements before upload |
| Apple App Store | Signed App Store archive / IPA | iOS project generation, sync, identity validation and unsigned Release compile pass in macOS CI | Apple signing/provisioning, App Store Connect metadata, TestFlight and App Review |

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

## Apple App Store release gate

The repository now has an iOS App Store preflight workflow on macOS. The workflow installs the matching Capacitor iOS platform for CI, runs regression tests and the web build, generates and syncs the iOS project, validates the KriptoAman bundle identity, resolves Xcode build settings and successfully performs an unsigned Release compile for the iOS Simulator.

This proves the shared application can compile through the iOS preflight path, but it is not equivalent to a signed App Store archive.

Required external iOS publication steps:

1. Confirm Apple Developer membership and App Store Connect application record.
2. Configure the final Apple bundle identifier and capabilities in the developer account.
3. Configure Apple Distribution certificate and App Store provisioning through protected signing infrastructure.
4. Produce an archive from the exact release commit for a physical-device/App Store destination.
5. Export and validate the App Store build.
6. Complete App Store Connect metadata, App Privacy declarations, age rating, screenshots and reviewer access.
7. Validate through TestFlight before production submission.
8. Submit to App Review and record the reviewed build number and outcome.

## Submission package

Use `STORE_SUBMISSION_PACKAGE.md` as the controlled source for bilingual listing copy, privacy/data declaration preparation, reviewer-account rules, screenshot planning and release evidence records.

## Publication discipline

Do not reuse old binaries after a release-candidate code change. Rebuild from the exact merged `main` commit and retain the commit SHA, CI run ID, artifact digest and store version number in the release record.

Do not bypass required security checks or branch protections. Store submission is the final external publishing step after repository and binary gates are green.
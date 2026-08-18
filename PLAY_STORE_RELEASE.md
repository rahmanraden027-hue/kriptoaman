# Rilis KriptoAman ke Google Play

## Identitas aplikasi

- Package ID: `com.kriptoaman.app`
- Nama: `KriptoAman`
- Versi Android: `1.3` (`versionCode 4`)
- Target SDK: API 36
- Mode rilis awal: market intelligence, edukasi, keamanan akun, portfolio/watch-only, dan pemantauan wallet/alamat publik non-kustodial.
- Tidak menyatakan diri sebagai kustodian aset atau bursa kripto selama fungsi tersebut tidak benar-benar tersedia dan belum didukung perizinan yang relevan.

## Signed release tervalidasi

Workflow: **Android Release Artifacts**

Trusted `main` run: `32121808660`

Hasil tervalidasi:

- Play AAB: `kriptoaman-play-aab`
  - Size: `6,986,427 bytes`
  - Artifact digest: `sha256:f1611f4365960b9053261ac8181e657a1b8ac4973040eb6f77c775fe272eeba5`
- Direct APK: `kriptoaman-direct-apk`
  - Size: `6,899,098 bytes`
  - Artifact digest: `sha256:cce3a89c4f9393141b801f7a7bad49b1184442a752f030d4ea362845f3877976`

Run tersebut berhasil melewati:

- release regression tests
- Capacitor sync
- validasi signing secrets
- restore dan verifikasi Play signing key
- signed AAB + APK build
- verifikasi release artifacts
- APK checksum
- artifact upload

Commit status resmi pipeline: `kriptoaman/android-signed-release = success`.

## Keamanan signing

GitHub Actions secrets yang dibutuhkan:

- `PLAY_KEYSTORE_BASE64`
- `PLAY_KEYSTORE_PASSWORD`
- `PLAY_KEY_ALIAS`
- `PLAY_KEY_PASSWORD`

Jangan pernah memasukkan file `.jks`, password, token, private key, atau seed phrase ke Git.

Pull request hanya menjalankan **unsigned Android preflight**. Signing secrets hanya digunakan pada trusted `main`, tag Android, atau workflow dispatch.

## Play Console — rilis awal

Jalur yang direkomendasikan:

`Internal testing` → `Closed testing` bila diwajibkan oleh jenis/usia akun developer → `Production`.

Untuk internal testing:

1. Buka Play Console → Testing → Internal testing.
2. Buat release baru.
3. Unggah artifact `kriptoaman-play-aab` dari trusted signed run terbaru.
4. Tambahkan tester internal.
5. Simpan dan roll out ke internal testing.
6. Uji instalasi/update melalui Google Play, bukan APK sideload saja.

## Financial Features Declaration

Isi deklarasi berdasarkan fungsi yang **benar-benar aktif** pada build yang diajukan.

Untuk konfigurasi KriptoAman rilis awal saat ini, gunakan deskripsi produk yang konsisten dengan:

- informasi dan data pasar aset digital;
- analytics / risk monitoring;
- portfolio/watch-only;
- pemantauan wallet/alamat publik non-kustodial;
- KYC/identity verification jika flow tersebut tersedia pada build;
- tidak mengklaim exchange/custody bila aplikasi tidak mengeksekusi perdagangan atau menyimpan aset pengguna.

Jika di masa depan KriptoAman menambahkan exchange, custody, software wallet custodial, pembayaran, lending, atau layanan finansial lain, deklarasi Play Console dan analisis perizinan harus diperbarui sebelum fitur tersebut dipublikasikan.

## Data Safety

Data Safety harus mencerminkan perilaku build produksi dan Kebijakan Privasi. Audit minimal sebelum submit:

- account identifiers / email;
- authentication and security events;
- KYC/identity data bila dikumpulkan atau diproses;
- device/session data;
- analytics/diagnostics SDK data;
- wallet public address / blockchain monitoring data;
- apakah data dibagikan ke provider KYC, analytics, payment, RPC, atau provider lain;
- encryption in transit;
- account deletion path.

URL legal:

- Privacy Policy: `https://kriptoaman.com/PrivacyPolicy`
- Account Deletion: `https://kriptoaman.com/AccountDeletion`

## App Content yang harus diselesaikan

- Financial features declaration
- Data safety
- App access (jika login diperlukan)
- Ads declaration
- Target audience and content
- Content rating
- Privacy policy
- Account deletion
- Country/region targeting

## Checklist perangkat nyata sebelum production

Verifikasi di Android fisik:

- install dari Internal testing;
- splash/icon/launcher;
- login, register, verifikasi email/OTP, logout;
- admin TOTP tidak dapat dilewati;
- KYC flow;
- Home, Market, Portfolio, Wallet, Security;
- bottom navigation dan tombol back;
- keyboard/input pada layar kecil;
- offline/reconnect;
- PWA/service-worker update tidak membuat WebView terjebak pada bundle lama;
- external wallet/deep-link behavior;
- legal links dan account deletion;
- update dari build sebelumnya tanpa kehilangan session yang seharusnya tetap valid.

## Release gate

KriptoAman hanya boleh dinyatakan **Play Store production ready** setelah:

1. signed AAB terbaru berhasil dibangun;
2. Internal testing berhasil dipasang dari Google Play;
3. smoke test perangkat nyata selesai;
4. Financial Features Declaration selesai sesuai fungsi aplikasi;
5. Data Safety selesai sesuai perilaku data aktual;
6. store listing dan country targeting sudah dikonfirmasi;
7. tidak ada blocking issue pada Play Console.

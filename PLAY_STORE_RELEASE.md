# Rilis KriptoAman ke Google Play

## Identitas aplikasi

- Package ID: `com.kriptoaman.app`
- Nama: `KriptoAman`
- Versi saat ini: `1.1` (`versionCode 2`)
- Mode rilis awal: informasi, edukasi, keamanan, dan pemantauan read-only.

## Build AAB bertanda tangan

1. Buat upload key sekali dan simpan cadangan terenkripsi.
2. Tambahkan GitHub Actions secrets: `PLAY_KEYSTORE_BASE64`, `PLAY_KEYSTORE_PASSWORD`, `PLAY_KEY_ALIAS`, dan `PLAY_KEY_PASSWORD`.
3. Jalankan workflow **Android Play Bundle** dari GitHub Actions.
4. Unduh artifact `kriptoaman-play-aab` dan unggah ke Internal testing Play Console.

Jangan pernah memasukkan file `.jks`, password, token, private key, atau seed phrase ke Git.

## Formulir Play Console

- Kategori: Finance
- URL kebijakan privasi: `https://kriptoaman.com/PrivacyPolicy`
- URL penghapusan akun: `https://kriptoaman.com/AccountDeletion`
- Financial features declaration: pilih hanya fitur informasi/pemantauan yang benar-benar aktif.
- Data safety harus sama dengan perilaku aplikasi dan Kebijakan Privasi.
- Content rating, App access, Ads, Target audience, dan Data safety wajib diselesaikan.

## Jalur publikasi

Internal testing → Closed testing (jika diwajibkan akun developer) → Production. Verifikasi login Google/email, penghapusan akun, lima tab utama, rotasi/keyboard, tautan legal, dan perangkat Android fisik sebelum mengajukan production.

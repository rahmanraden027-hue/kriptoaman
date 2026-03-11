import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, ExternalLink, Shield, Key, User, Copy, Terminal } from 'lucide-react';

// ─── IDENTITAS PEMILIK APLIKASI ───────────────────────────────────────────────
const OWNER_INFO = {
  name: 'Rahmanraden',
  email: 'rahmanraden027@gmail.com',
  appName: 'KriptoAman',
  packageId: 'com.kriptoaman.app',
  bundleId: 'com.kriptoaman.app',
  keystoreAlias: 'kriptoaman',
  keystoreFile: 'kriptoaman-release.jks',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-2 p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
      title="Salin"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code }) {
  return (
    <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 mt-2 flex items-start gap-2">
      <Terminal className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
      <code className="text-green-300 text-xs font-mono break-all flex-1">{code}</code>
      <CopyButton text={code} />
    </div>
  );
}

const ANDROID_STEPS = [
  {
    title: '1. Daftar Google Play Developer (atas nama Anda)',
    color: 'indigo',
    items: [
      { label: 'Buka', value: 'https://play.google.com/console', link: true },
      { label: 'Login dengan Google Account Anda:', value: OWNER_INFO.email },
      { label: 'Bayar biaya one-time:', value: '$25 USD (dibayar sendiri via kartu/PayPal Anda)' },
      { label: 'Isi Developer Name:', value: OWNER_INFO.name + ' (nama asli / nama bisnis Anda)' },
      { label: 'Verify identity dengan KTP/paspor Anda' },
    ],
    warning: '⚠️ PENTING: Daftar menggunakan email & kartu kredit/debit Anda sendiri. Jangan pakai akun orang lain — akun harus atas nama Anda sebagai pemilik legal.'
  },
  {
    title: '2. Generate Keystore (ANDA yang pegang)',
    color: 'yellow',
    items: [
      { label: 'Install Java JDK di komputer Anda (jika belum ada)' },
      { label: 'Jalankan perintah berikut di terminal/cmd Anda:' },
    ],
    code: `keytool -genkey -v -keystore ${OWNER_INFO.keystoreFile} -keyalg RSA -keysize 2048 -validity 10000 -alias ${OWNER_INFO.keystoreAlias}`,
    codeDesc: 'Isi form saat diminta (nama, organisasi, lokasi). Password yang Anda buat = PASSWORD ANDA SENDIRI.',
    critical: [
      `File keystore: ${OWNER_INFO.keystoreFile} → simpan di komputer Anda + backup ke Google Drive/USB Anda`,
      'Password keystore: HANYA Anda yang tahu. Catat di tempat aman.',
      'JANGAN pernah share keystore ke developer lain / siapapun',
      'Jika keystore hilang → Anda tidak bisa update app selamanya!',
    ]
  },
  {
    title: '3. Setup App (Bubblewrap / TWA)',
    color: 'blue',
    items: [
      { label: 'Install Node.js & Bubblewrap:' },
    ],
    code: 'npm install -g @bubblewrap/cli',
    codeDesc: `Jalankan init dengan Package ID: ${OWNER_INFO.packageId}`,
    code2: `bubblewrap init --manifest https://kriptoaman.app/manifest.json`,
    items2: [
      { label: 'applicationId:', value: OWNER_INFO.packageId },
      { label: 'Developer Name:', value: OWNER_INFO.name },
      { label: 'Keystore path:', value: OWNER_INFO.keystoreFile },
      { label: 'Keystore alias:', value: OWNER_INFO.keystoreAlias },
    ]
  },
  {
    title: '4. Build & Sign APK/AAB',
    color: 'green',
    items: [{ label: 'Copy keystore ke folder project, lalu build:' }],
    code: 'bubblewrap build',
    codeDesc: 'Masukkan password keystore Anda saat diminta. Output: app-release-signed.aab',
  },
  {
    title: '5. Upload ke Google Play Console',
    color: 'purple',
    items: [
      { label: 'Login ke Play Console dengan akun Anda:', value: OWNER_INFO.email },
      { label: 'Create New App → nama:', value: OWNER_INFO.appName },
      { label: 'Upload file app-release-signed.aab' },
      { label: 'Isi Store Listing (deskripsi, screenshot, ikon)' },
      { label: 'Set Content Rating → 18+ (Financial app)' },
      { label: 'Tambahkan Privacy Policy & Terms of Service URL' },
      { label: 'Submit for Review (24–48 jam)' },
    ]
  },
];

const IOS_STEPS = [
  {
    title: '1. Daftar Apple Developer (atas nama Anda)',
    color: 'indigo',
    items: [
      { label: 'Buka', value: 'https://developer.apple.com/account', link: true },
      { label: 'Login / buat Apple ID dengan email Anda:', value: OWNER_INFO.email },
      { label: 'Bayar Annual fee:', value: '$99 USD/tahun (dari kartu Anda)' },
      { label: 'Developer Name / Organization:', value: OWNER_INFO.name },
      { label: 'Buat App ID (Bundle ID):', value: OWNER_INFO.bundleId },
    ],
    warning: '⚠️ PENTING: Apple Developer Account harus atas nama DIRI SENDIRI atau badan usaha Anda. Akun tidak bisa ditransfer.'
  },
  {
    title: '2. Certificates & Signing (Anda yang pegang)',
    color: 'yellow',
    items: [
      { label: 'Di Xcode: Preferences → Accounts → Add Apple ID Anda' },
      { label: 'Xcode otomatis generate Signing Certificate atas nama Anda' },
      { label: 'Export .p12 certificate (Distribution Certificate) → simpan di komputer Anda' },
      { label: 'Buat Provisioning Profile di developer.apple.com → download & simpan' },
    ],
    critical: [
      '.p12 certificate = kunci signing Anda. HANYA Anda yang simpan.',
      'Backup certificate ke Keychain export + simpan di tempat aman',
      'Password certificate = dibuat sendiri oleh Anda',
    ]
  },
  {
    title: '3. Prepare App dengan Capacitor',
    color: 'blue',
    items: [{ label: 'Install & setup Capacitor:' }],
    code: 'npm install @capacitor/core @capacitor/cli @capacitor/ios',
    code2: `npx cap init "${OWNER_INFO.appName}" "${OWNER_INFO.bundleId}" --web-dir dist`,
    items2: [
      { label: 'Build & sync:' },
    ],
    code3: 'npm run build && npx cap sync ios && npx cap open ios',
  },
  {
    title: '4. Xcode Setup & Archive',
    color: 'green',
    items: [
      { label: 'Bundle Identifier:', value: OWNER_INFO.bundleId },
      { label: 'Team:', value: OWNER_INFO.name + ' (pilih Apple ID Anda)' },
      { label: 'Version: 1.0.0 | Build: 1' },
      { label: 'Product → Archive → Distribute App → App Store Connect' },
      { label: 'Signing: Anda pilih certificate Anda sendiri' },
    ]
  },
  {
    title: '5. App Store Connect Submission',
    color: 'purple',
    items: [
      { label: 'Login ke', value: 'https://appstoreconnect.apple.com', link: true },
      { label: 'Masuk dengan Apple ID Anda:', value: OWNER_INFO.email },
      { label: 'My Apps → + → New App → nama:', value: OWNER_INFO.appName },
      { label: 'Bundle ID:', value: OWNER_INFO.bundleId },
      { label: 'Upload screenshots (iPhone 6.5" & 5.5")' },
      { label: 'Category: Finance | Age Rating: 17+' },
      { label: 'Submit for Review (1–3 hari)' },
    ]
  },
];

const colorMap = {
  indigo: 'border-indigo-500/30 bg-indigo-500/5',
  yellow: 'border-yellow-500/30 bg-yellow-500/5',
  blue: 'border-blue-500/30 bg-blue-500/5',
  green: 'border-green-500/30 bg-green-500/5',
  purple: 'border-purple-500/30 bg-purple-500/5',
};

function StepCard({ step }) {
  return (
    <div className={`border rounded-xl p-5 mb-4 ${colorMap[step.color] || 'border-slate-700/50 bg-slate-800/30'}`}>
      <h3 className="text-white font-bold text-base mb-3">{step.title}</h3>

      {step.warning && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4 text-orange-300 text-xs">
          {step.warning}
        </div>
      )}

      <ul className="space-y-2 mb-3">
        {step.items?.map((item, i) => (
          <li key={i} className="flex flex-wrap gap-1 items-start text-sm">
            <span className="text-slate-400 shrink-0">→</span>
            <span className="text-slate-300">{item.label}</span>
            {item.value && (
              item.link
                ? <a href={item.value} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">{item.value} <ExternalLink className="w-3 h-3" /></a>
                : <span className="text-white font-semibold bg-slate-700 px-2 py-0.5 rounded text-xs">{item.value}</span>
            )}
          </li>
        ))}
      </ul>

      {step.code && <CodeBlock code={step.code} />}
      {step.codeDesc && <p className="text-slate-400 text-xs mt-2">{step.codeDesc}</p>}
      {step.code2 && <CodeBlock code={step.code2} />}
      {step.code3 && <CodeBlock code={step.code3} />}

      {step.items2?.map((item, i) => (
        <p key={i} className="text-slate-300 text-sm mt-2">→ {item.label} {item.value && <span className="text-white font-semibold">{item.value}</span>}</p>
      ))}

      {step.critical && (
        <div className="mt-4 bg-red-900/20 border border-red-500/40 rounded-lg p-3">
          <p className="text-red-400 font-bold text-xs mb-2">🔐 CRITICAL — HANYA ANDA YANG PEGANG:</p>
          <ul className="space-y-1">
            {step.critical.map((c, i) => (
              <li key={i} className="text-red-300 text-xs flex gap-2"><span>•</span><span>{c}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function StoreDeploymentGuide() {
  const [activeTab, setActiveTab] = useState('android');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">📦 Panduan Submit ke Store</h1>
          <p className="text-slate-400 text-sm">Google Play & App Store — akun & keystore atas nama Anda</p>
        </div>

        {/* Owner Info Card */}
        <div className="bg-slate-800/60 border border-indigo-500/40 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-white font-bold">Identitas Pemilik Aplikasi</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            {[
              { icon: User, label: 'Developer Name', value: OWNER_INFO.name },
              { icon: User, label: 'Email', value: OWNER_INFO.email },
              { icon: Key, label: 'App Package ID', value: OWNER_INFO.packageId },
              { icon: Key, label: 'Keystore File', value: OWNER_INFO.keystoreFile },
              { icon: Key, label: 'Keystore Alias', value: OWNER_INFO.keystoreAlias },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-400 text-xs">{label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-mono text-xs">{value}</span>
                  <CopyButton text={value} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-indigo-300 text-xs mt-3 bg-indigo-500/10 rounded-lg p-2">
            ✅ Semua akun developer didaftarkan atas nama Anda. Keystore & signing certificate hanya Anda yang pegang. Tidak ada pihak ketiga yang bisa update atau ambil alih aplikasi Anda.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700 rounded-xl">
            <TabsTrigger value="android" className="flex items-center gap-2">
              <span>🤖</span> Google Play
            </TabsTrigger>
            <TabsTrigger value="ios" className="flex items-center gap-2">
              <span>🍎</span> App Store
            </TabsTrigger>
          </TabsList>

          <TabsContent value="android" className="mt-4 space-y-1">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 text-xs text-green-300">
              ✅ One-time fee $25 · Review 24-48 jam · Kebijakan kripto lebih fleksibel
            </div>
            {ANDROID_STEPS.map((step, i) => <StepCard key={i} step={step} />)}
          </TabsContent>

          <TabsContent value="ios" className="mt-4 space-y-1">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4 text-xs text-blue-300">
              ⚠️ Annual fee $99 · Butuh Mac + Xcode · Review 1-3 hari · Kebijakan kripto lebih ketat
            </div>
            {IOS_STEPS.map((step, i) => <StepCard key={i} step={step} />)}
          </TabsContent>
        </Tabs>

        {/* Pre-submission Checklist */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Checklist Sebelum Submit
          </h2>
          <div className="space-y-2 text-sm">
            {[
              ['✅', 'Akun developer didaftar ATAS NAMA ANDA sendiri'],
              ['✅', 'Keystore/Certificate tersimpan aman di komputer/cloud Anda'],
              ['✅', 'Password keystore dicatat di password manager Anda'],
              ['✅', 'App Icon 512x512px (PNG, no alpha untuk Play Store)'],
              ['✅', 'Screenshots min. 4 buah (Android) / 2-5 buah (iOS)'],
              ['✅', 'Privacy Policy URL public & accessible'],
              ['✅', 'Terms of Service URL public & accessible'],
              ['✅', 'Deskripsi app (bahasa Indonesia & Inggris)'],
              ['✅', 'Age Rating: 18+ / Financial App'],
              ['⚠️', 'Disclaimer risiko kripto sudah tampil di app'],
              ['⚠️', 'KYC flow sudah ada di app'],
            ].map(([icon, text], i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="shrink-0">{icon}</span>
                <span className={icon === '⚠️' ? 'text-yellow-300' : 'text-slate-300'}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Keystore Backup Reminder */}
        <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-5">
          <p className="text-red-400 font-bold mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" /> WAJIB BACKUP KEYSTORE
          </p>
          <div className="space-y-1 text-xs text-red-300">
            <p>• Simpan <strong>{OWNER_INFO.keystoreFile}</strong> di minimal 3 tempat berbeda</p>
            <p>• Lokasi rekomendasi: Hard drive lokal + Google Drive + USB enkripsi</p>
            <p>• Password keystore: simpan di password manager (Bitwarden, 1Password, dll)</p>
            <p>• <strong>JANGAN PERNAH</strong> share keystore ke developer lain / siapapun</p>
            <p>• Keystore hilang = tidak bisa update app = harus publish ulang dengan nama baru</p>
          </div>
        </div>

        {/* Links */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3">🔗 Link Penting</h2>
          <div className="space-y-2">
            {[
              ['Google Play Console', 'https://play.google.com/console'],
              ['Apple Developer', 'https://developer.apple.com/account'],
              ['App Store Connect', 'https://appstoreconnect.apple.com'],
              ['Bubblewrap CLI Docs', 'https://www.bubblewrap.app/'],
              ['Capacitor Docs', 'https://capacitorjs.com/docs'],
              ['Google Play Policies', 'https://play.google.com/about/developer-content-policy/'],
              ['Apple App Review Guidelines', 'https://developer.apple.com/app-store/review/guidelines/'],
            ].map(([label, url]) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                {label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
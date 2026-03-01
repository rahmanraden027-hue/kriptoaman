import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const DEPLOYMENT_STEPS = {
  ios: [
    {
      title: 'Setup Apple Developer Account',
      items: [
        'Buka https://developer.apple.com',
        'Daftar dengan Apple ID',
        'Bayar biaya annual ($99)',
        'Buat App ID unik (com.coinvault.app)',
        'Setup certificates & provisioning profiles'
      ],
      time: '1-2 hari'
    },
    {
      title: 'Prepare Your App (Capacitor)',
      items: [
        'npm install @capacitor/core @capacitor/cli',
        'npx cap init --web-dir dist',
        'npx cap add ios',
        'Edit capacitor.config.json dengan app ID',
        'Build: npm run build && npx cap sync ios'
      ],
      time: '2-3 jam'
    },
    {
      title: 'Xcode Setup',
      items: [
        'Open iOS project: open ios/App/App.xcworkspace',
        'Select Team untuk signing',
        'Update Bundle Identifier ke App ID',
        'Set Version & Build numbers',
        'Archive app: Product → Archive'
      ],
      time: '1 jam'
    },
    {
      title: 'App Store Connect Submission',
      items: [
        'Login ke appstoreconnect.apple.com',
        'Create New App',
        'Fill app metadata:',
        '  • Name, description, keywords',
        '  • Screenshots (min 2-5 per device)',
        '  • Preview video (opsional)',
        '  • Support URL, privacy policy',
        '  • Age rating (IARC)',
        'Upload build dari Xcode',
        'Submit untuk review (1-3 hari)'
      ],
      time: '2-3 jam'
    }
  ],
  android: [
    {
      title: 'Setup Google Play Developer Account',
      items: [
        'Buka https://play.google.com/console',
        'Daftar dengan Google Account',
        'Bayar biaya one-time ($25)',
        'Verify akun dan identity'
      ],
      time: '1 hari'
    },
    {
      title: 'Generate Signing Key',
      items: [
        'Buat keystore: keytool -genkey -v -keystore coinvault.jks -keyalg RSA -keysize 2048 -validity 10000 -alias coinvault',
        'Simpan keystore di tempat aman',
        'Ingat password (JANGAN lupa!)',
        'Backup keystore - CRITICAL untuk updates!'
      ],
      time: '30 menit'
    },
    {
      title: 'Setup Bubblewrap',
      items: [
        'npm install -g @bubblewrap/cli',
        'bubblewrap init --manifest-url https://coinvault.app/manifest.json',
        'Edit app metadata di bubblewrap.json',
        'Copy keystore ke project directory'
      ],
      time: '1 jam'
    },
    {
      title: 'Build & Sign APK',
      items: [
        'bubblewrap build',
        'Input keystore password saat diminta',
        'Tunggu hingga selesai (~5 menit)',
        'Output: dist/signed.apk atau signed.aab'
      ],
      time: '15 menit'
    },
    {
      title: 'Google Play Console Upload',
      items: [
        'Login ke Google Play Console',
        'Create New App',
        'Fill store listing:',
        '  • Title, short description, full description',
        '  • Screenshots (min 4-8)',
        '  • Feature graphic (1024x500)',
        '  • Privacy policy URL',
        'Go to Release → Production',
        'Upload signed.aab (App Bundle)',
        'Fill rollout percentage',
        'Submit untuk review (24-48 jam)'
      ],
      time: '2-3 jam'
    }
  ]
};

function StepCard({ step }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{step.title}</h3>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full whitespace-nowrap">
          ⏱️ {step.time}
        </span>
      </div>
      <ol className="space-y-2 text-slate-300 text-sm">
        {step.items.map((item, idx) => (
          <li key={idx} className="flex gap-3">
            <span className="text-indigo-400 font-semibold shrink-0">{idx + 1}.</span>
            <span className="text-slate-300 whitespace-pre-wrap">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function StoreDeploymentGuide() {
  const [activeTab, setActiveTab] = useState('ios');

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">📦 Store Deployment Guide</h1>
        <p className="text-slate-400">
          Step-by-step petunjuk untuk submit COINVAULT ke App Store dan Play Store
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            <span className="text-2xl">🍎</span>
            App Store (iOS)
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            Untuk iPhone & iPad
          </p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>✓ Annual fee: $99</li>
            <li>✓ Review time: 1-3 hari</li>
            <li>✓ Require: Capacitor</li>
            <li>✓ Min iOS: 13.0</li>
          </ul>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            Play Store (Android)
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            Untuk semua Android
          </p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>✓ One-time fee: $25</li>
            <li>✓ Review time: 24-48 jam</li>
            <li>✓ Require: Bubblewrap</li>
            <li>✓ Min SDK: 21</li>
          </ul>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700 rounded-xl">
          <TabsTrigger value="ios" className="flex items-center gap-2">
            <span className="text-lg">🍎</span>
            <span>App Store</span>
          </TabsTrigger>
          <TabsTrigger value="android" className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span>Play Store</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ios" className="mt-6 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <p className="text-blue-300 text-sm font-medium mb-2">⚠️ Important untuk iOS:</p>
            <ul className="text-blue-200 text-xs space-y-1">
              <li>• Apple strict dengan crypto apps - baca guidelines mereka dulu</li>
              <li>• Beberapa region tidak allow trading features</li>
              <li>• Butuh Xcode di Mac untuk build</li>
              <li>• Privacy policy HARUS jelas tentang data collection</li>
            </ul>
          </div>

          {DEPLOYMENT_STEPS.ios.map((step, idx) => (
            <StepCard key={idx} step={step} />
          ))}

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mt-6">
            <p className="text-green-300 font-semibold mb-2">✅ Checklist sebelum submit:</p>
            <ul className="text-green-200 text-sm space-y-1">
              <li>☐ App tested di iPhone & iPad</li>
              <li>☐ Screenshots dengan bahasa lokal (min 2-5)</li>
              <li>☐ Privacy policy URL public & accessible</li>
              <li>☐ Terms of Service ready</li>
              <li>☐ Support email address set</li>
              <li>☐ No use of private APIs</li>
              <li>☐ App rating (age rating dipilih)</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="android" className="mt-6 space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <p className="text-green-300 text-sm font-medium mb-2">✅ Android benefits:</p>
            <ul className="text-green-200 text-xs space-y-1">
              <li>• More lenient crypto policies</li>
              <li>• Faster review process (24-48 jam)</li>
              <li>• Can cross-compile di Windows/Mac/Linux</li>
              <li>• Easier to update (no app review delay)</li>
            </ul>
          </div>

          {DEPLOYMENT_STEPS.android.map((step, idx) => (
            <StepCard key={idx} step={step} />
          ))}

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-6">
            <p className="text-red-300 font-semibold mb-2">⚠️ CRITICAL - Keystore Management:</p>
            <div className="text-red-200 text-sm space-y-2">
              <p>
                Jangan pernah kehilangan keystore file! Jika hilang, Anda tidak bisa update app di Play Store.
              </p>
              <p>Best practices:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Backup keystore di multiple locations</li>
                <li>Store password di password manager</li>
                <li>Dokumentasikan: keystore path, alias, password</li>
                <li>Share dengan team via secure channel</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          Final Checklist
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Manifest & PWA Requirements</p>
              <p className="text-sm text-slate-400">manifest.json dengan icons, Service Worker, HTTPS</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Legal Documents</p>
              <p className="text-sm text-slate-400">Privacy Policy & Terms of Service URLs harus public</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Content & Metadata</p>
              <p className="text-sm text-slate-400">App name, description, keywords, screenshots (HD quality)</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Compliance (Crypto Apps)</p>
              <p className="text-sm text-slate-400">Age 18+, Risk disclaimer, KYC info, Geo restrictions docs</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Lighthouse Score</p>
              <p className="text-sm text-slate-400">Target minimum 90+ in all categories</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Device Testing</p>
              <p className="text-sm text-slate-400">Test on real iPhone/Android devices, various screen sizes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">📚 Useful Resources</h2>
        <div className="space-y-3">
          <a href="https://developer.apple.com/app-store/review/guidelines/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Apple App Store Review Guidelines
          </a>
          <a href="https://play.google.com/about/developer-content-policy/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Google Play Policies & Guidelines
          </a>
          <a href="https://web.dev/pwa/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Google Web.dev PWA Documentation
          </a>
          <a href="https://www.bubblewrap.app/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Bubblewrap Official Documentation
          </a>
          <a href="https://capacitor.ionicframework.com/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Capacitor Official Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
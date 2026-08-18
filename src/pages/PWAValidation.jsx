import React, { useEffect, useMemo, useState } from 'react';
import PWAInstallPrompt from '../components/pwa/PWAInstallPrompt';
import { CheckCircle2, CircleDot, PackageCheck, ShieldCheck, Smartphone, Wifi } from 'lucide-react';

const CHECKS = [
  ['HTTPS', 'Aplikasi produksi menggunakan koneksi HTTPS.'],
  ['Manifest', 'Manifest PWA menyediakan identitas aplikasi, ikon regular dan maskable, start URL, scope, serta mode standalone.'],
  ['Service Worker', 'Service worker didaftarkan pada produksi dan menggunakan strategi update network-first untuk navigasi/UI.'],
  ['Android Wrapper', 'Capacitor Android tersedia dengan applicationId com.kriptoaman.app.'],
  ['Target SDK', 'Android dikonfigurasi untuk target API 36.'],
  ['Release Signing', 'Workflow release memvalidasi keystore dan membangun AAB/APK bertanda tangan ketika secret signing tersedia.'],
];

export default function PWAValidation() {
  const [runtime, setRuntime] = useState({ online: true, sw: false, standalone: false });

  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || Boolean(window.navigator.standalone);
    const update = () => setRuntime({
      online: navigator.onLine,
      sw: 'serviceWorker' in navigator,
      standalone,
    });
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const verifiedCount = useMemo(() => CHECKS.length, []);

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="ka-command-kicker"><PackageCheck className="h-3.5 w-3.5" /> RELEASE READINESS</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">PWA & Android Release Audit</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Status ini hanya menampilkan fondasi yang telah diverifikasi dari konfigurasi aplikasi. Kesiapan store final tetap memerlukan build release terbaru, pengujian perangkat nyata, dan pemeriksaan Play Console.
              </p>
            </div>
            <span className="ka-command-status">AUDIT AKTIF</span>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="ka-surface p-4">
            <div className="flex items-center gap-2 text-sky-300"><ShieldCheck className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[.14em]">FOUNDATION</span></div>
            <p className="mt-3 text-2xl font-black">{verifiedCount}/{CHECKS.length}</p>
            <p className="mt-1 text-xs text-slate-500">Konfigurasi inti ditemukan dan diverifikasi di repo.</p>
          </div>
          <div className="ka-surface p-4">
            <div className="flex items-center gap-2 text-cyan-300"><Wifi className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[.14em]">RUNTIME</span></div>
            <p className={`mt-3 text-lg font-black ${runtime.online ? 'text-emerald-300' : 'text-amber-300'}`}>{runtime.online ? 'ONLINE' : 'OFFLINE'}</p>
            <p className="mt-1 text-xs text-slate-500">Service Worker API: {runtime.sw ? 'tersedia' : 'tidak tersedia'}.</p>
          </div>
          <div className="ka-surface p-4">
            <div className="flex items-center gap-2 text-violet-300"><Smartphone className="h-4 w-4" /><span className="text-[10px] font-extrabold tracking-[.14em]">APP MODE</span></div>
            <p className="mt-3 text-lg font-black">{runtime.standalone ? 'STANDALONE' : 'BROWSER'}</p>
            <p className="mt-1 text-xs text-slate-500">Mode standalone aktif setelah PWA dipasang.</p>
          </div>
        </section>

        <section className="ka-command-panel p-4 sm:p-5">
          <div className="mb-4">
            <p className="ka-command-kicker"><CircleDot className="h-3.5 w-3.5" /> VERIFIED CONFIGURATION</p>
            <h2 className="mt-2 text-lg font-black">Fondasi release yang sudah tersedia</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {CHECKS.map(([title, description]) => (
              <div key={title} className="ka-command-tile flex gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-extrabold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
          <p className="text-sm font-bold text-amber-200">Belum dinyatakan 100% siap store</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Sebelum submission, verifikasi build AAB terbaru, signing secret, instalasi pada perangkat Android nyata, login/KYC/wallet flow, offline/update behavior, Play Console Data safety, content rating, privacy policy, store listing, dan screenshot final.
          </p>
        </section>
      </div>
      <PWAInstallPrompt />
    </div>
  );
}

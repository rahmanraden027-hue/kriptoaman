import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function isStandalone() {
  try {
    const displayMode = typeof window.matchMedia === 'function'
      ? window.matchMedia('(display-mode: standalone)').matches
      : false;
    return displayMode || window.navigator?.standalone === true;
  } catch {
    return false;
  }
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [showAndroidChoices, setShowAndroidChoices] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { pathname } = useLocation();
  let isIos = false;
  let isAndroid = false;
  try {
    isIos = /iphone|ipad|ipod/i.test(window.navigator?.userAgent || '');
    isAndroid = /android/i.test(window.navigator?.userAgent || '');
  } catch {
    isIos = false;
    isAndroid = false;
  }
  const isPublicKamDocument = pathname.startsWith('/KAM') || pathname.startsWith('/news/');

  useEffect(() => {
    try {
      if ('serviceWorker' in navigator && import.meta.env.PROD) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
      }
    } catch {
      // PWA capability is optional and must never block the website.
    }

    const handlePrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    setDismissed(false);
  }, [pathname]);

  if (installed || dismissed || (!installEvent && !isIos && !isAndroid)) return null;

  const install = async () => {
    if (isIos && !installEvent) {
      setShowIosHelp(true);
      return;
    }
    if (!installEvent?.prompt) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice?.outcome === 'accepted') setInstalled(true);
    } finally {
      setInstallEvent(null);
    }
  };

  return (
    <>
      <div
        className={`fixed z-[70] max-w-[calc(100vw-1.5rem)] ${isPublicKamDocument ? 'bottom-[calc(.75rem+env(safe-area-inset-bottom,0px))] right-3' : 'bottom-[calc(.75rem+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6'}`}
      >
        <div className="flex items-center overflow-hidden rounded-full border border-sky-300/30 bg-sky-700/95 text-white shadow-xl shadow-sky-950/50 backdrop-blur-md sm:rounded-2xl">
          <button
            type="button"
            onClick={() => isAndroid ? setShowAndroidChoices(true) : install()}
            className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
            aria-label="Pasang aplikasi KriptoAman"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap sm:hidden">Pasang</span>
            <span className="hidden whitespace-nowrap sm:inline">Pasang KriptoAman</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex min-h-11 min-w-10 items-center justify-center border-l border-white/20 px-2.5 hover:bg-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80 sm:min-h-12 sm:min-w-11 sm:px-3"
            aria-label="Tutup tombol instalasi KriptoAman"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showAndroidChoices && (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-3xl border border-sky-500/25 bg-slate-950 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-400">Android · Production</p>
                <h2 className="mt-1 font-bold">Pasang KriptoAman</h2>
              </div>
              <button onClick={() => setShowAndroidChoices(false)} aria-label="Tutup"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Pilih aplikasi Android signed atau Web App. APK native menggunakan package resmi com.kriptoaman.app.
            </p>
            <a
              href="https://github.com/rahmanraden027-hue/kriptoaman/releases/download/android-v1.5.5/KriptoAman-1.5.5.apk"
              className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold hover:bg-sky-500"
            >
              <Download className="h-4 w-4" /> Download APK Signed · v1.5.5
            </a>
            {installEvent?.prompt && (
              <button
                type="button"
                onClick={() => { setShowAndroidChoices(false); install(); }}
                className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-900"
              >
                Install Web App (PWA)
              </button>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Native APK dan PWA adalah dua jalur instalasi berbeda. APK hanya dipublikasikan setelah signing, package identity, version dan SHA-256 lolos release gate.
            </p>
          </div>
        </div>
      )}

      {showIosHelp && (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/70 p-4">
          <div className="w-full rounded-3xl border border-sky-500/25 bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Pasang KriptoAman</h2>
              <button onClick={() => setShowIosHelp(false)} aria-label="Tutup"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Ketuk tombol Bagikan di Safari, lalu pilih Tambahkan ke Layar Utama.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-sky-500/10 p-3 text-sm text-sky-300">
              <Share2 className="h-4 w-4" /> Bagikan → Tambahkan ke Layar Utama
            </div>
          </div>
        </div>
      )}
    </>
  );
}

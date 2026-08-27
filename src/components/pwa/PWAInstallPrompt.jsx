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
  const [dismissed, setDismissed] = useState(false);
  const { pathname } = useLocation();
  let isIos = false;
  try {
    isIos = /iphone|ipad|ipod/i.test(window.navigator?.userAgent || '');
  } catch {
    isIos = false;
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

  if (installed || dismissed || (!installEvent && !isIos)) return null;

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
        className={`fixed left-1/2 z-[70] -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 ${isPublicKamDocument ? 'bottom-4' : 'bottom-24 lg:bottom-6'}`}
      >
        <div className="flex items-center overflow-hidden rounded-2xl border border-sky-400/30 bg-sky-500 text-white shadow-2xl shadow-sky-950/50">
          <button
            type="button"
            onClick={install}
            className="flex min-h-12 items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-sky-400"
            aria-label="Pasang aplikasi KriptoAman"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Pasang KriptoAman</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex min-h-12 min-w-11 items-center justify-center border-l border-white/15 px-3 hover:bg-sky-400"
            aria-label="Tutup tombol instalasi KriptoAman"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

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

import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [showIosHelp, setShowIosHelp] = useState(false);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
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

  if (installed || (!installEvent && !isIos)) return null;

  const install = async () => {
    if (isIos && !installEvent) {
      setShowIosHelp(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallEvent(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="fixed bottom-24 right-4 z-[70] flex min-h-12 items-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-500 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-sky-950/50 hover:bg-sky-400 lg:bottom-6"
        aria-label="Pasang aplikasi KriptoAman"
      >
        <Download className="h-4 w-4" />
        Pasang KriptoAman
      </button>

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

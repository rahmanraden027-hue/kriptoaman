import { useEffect, useRef, useState } from 'react';
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
  const [scrolled, setScrolled] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [rootCtaReady, setRootCtaReady] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const scrollIdleTimer = useRef(null);
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
  const isPublicRoot = pathname === '/';
  const isServices = pathname === '/Services';
  const isInstallSurface = isPublicRoot || isServices;

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

  useEffect(() => {
    const updatePositionState = () => {
      const y = window.scrollY;
      setScrolled(y > 96);
      const rootRevealThreshold = Math.max(420, Math.round(window.innerHeight * 0.58));
      setRootCtaReady(y > rootRevealThreshold);
    };
    const onScroll = () => {
      updatePositionState();
      setScrollActive(true);
      if (scrollIdleTimer.current) window.clearTimeout(scrollIdleTimer.current);
      scrollIdleTimer.current = window.setTimeout(() => setScrollActive(false), 650);
    };
    const onResize = () => updatePositionState();

    updatePositionState();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (scrollIdleTimer.current) window.clearTimeout(scrollIdleTimer.current);
    };
  }, []);

  if (
    !isInstallSurface
    || installed
    || dismissed
    || (!installEvent && !isIos && !isAndroid)
    || (isPublicRoot && !rootCtaReady)
    || (isServices && !scrolled)
  ) return null;

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
        data-install-cta="true"
        className={`fixed z-[70] max-w-[calc(100vw-1.5rem)] transition-[opacity,transform] duration-200 motion-reduce:transition-none ${isPublicRoot ? 'bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))] right-2 md:bottom-4 md:right-4' : 'bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6'} ${isPublicRoot && scrollActive ? 'pointer-events-none translate-x-2 opacity-0' : 'opacity-100'}`}
      >
        <div className="flex items-center overflow-hidden rounded-full border border-sky-300/30 bg-[#08233a]/95 text-white shadow-lg shadow-sky-950/40 backdrop-blur-md sm:rounded-2xl">
          <button
            type="button"
            onClick={() => { setEngaged(true); isAndroid ? setShowAndroidChoices(true) : install(); }}
            className={`flex h-11 items-center justify-center text-xs font-bold hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:h-auto sm:min-h-12 sm:w-auto sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${isPublicRoot || isServices || scrolled || engaged ? 'w-11 px-0' : 'w-auto gap-2 px-4'} lg:w-auto lg:gap-2 lg:px-4`}
            aria-label="Pasang aplikasi KriptoAman"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className={`${isPublicRoot || isServices || scrolled || engaged ? 'sr-only' : 'whitespace-nowrap'} lg:not-sr-only lg:whitespace-nowrap`}>Pasang KriptoAman</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex min-h-11 min-w-11 items-center justify-center border-l border-white/20 px-2.5 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80 lg:min-h-12 lg:min-w-11 lg:px-3"
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
              href="https://github.com/rahmanraden027-hue/kriptoaman/releases/download/android-v1.5.6/KriptoAman-1.5.6.apk"
              className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold hover:bg-sky-500"
            >
              <Download className="h-4 w-4" /> Download APK Signed · v1.5.6
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

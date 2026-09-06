import React from 'react';
import { logError } from '@/lib/errorHandler';

const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i;
const CHUNK_RECOVERY_KEY = 'ka_chunk_recovery_once';
const CACHE_RECOVERY_TIMEOUT_MS = 1500;
const CHUNK_RECOVERY_RETRY_MS = 5000;

function isPublicLandingPath() {
  try {
    return window.location.pathname === '/' || window.location.pathname === '/en';
  } catch {
    return false;
  }
}

function settleWithin(promise, timeoutMs = CACHE_RECOVERY_TIMEOUT_MS) {
  return Promise.race([
    Promise.resolve(promise).catch(() => undefined),
    new Promise(resolve => window.setTimeout(resolve, timeoutMs)),
  ]);
}

function SafePublicLanding() {
  return (
    <main data-ka-safe-public="true" className="min-h-screen bg-slate-950 text-white px-5 py-10 flex items-center justify-center">
      <section className="w-full max-w-xl text-center">
        <img src="/kriptoaman-logo-primary.png" alt="KriptoAman" className="mx-auto h-20 w-auto object-contain" />
        <h1 className="mt-6 text-3xl font-black tracking-tight">KriptoAman</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">Crypto intelligence, digital asset monitoring, education, and security information.</p>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a href="/Market" className="min-h-12 rounded-xl bg-sky-600 px-5 py-3 font-bold">Pasar</a>
          <a href="/KAM" className="min-h-12 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-bold">KAM Network</a>
          <a href="/SystemStatus" className="min-h-12 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-bold">Status Sistem</a>
          <a href="/login" className="min-h-12 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-bold">Masuk</a>
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">Mode akses aman aktif. Konten utama tetap tersedia sementara komponen aplikasi dipulihkan.</p>
      </section>
    </main>
  );
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, recovering: false, errorMessage: '', errorName: '', errorId: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || String(error || 'Unknown runtime error'),
      errorName: error?.name || 'Error',
      errorId: `KA-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error, info) {
    const message = error?.message || String(error || '');
    try {
      logError(error, {
        source: 'react_error_boundary',
        name: error?.name || 'Error',
        path: window.location?.pathname || '',
        info: info?.componentStack?.slice(0, 1200),
      });
    } catch {
      // Diagnostics must never become a second application failure.
    }

    if (CHUNK_ERROR_PATTERN.test(message)) this.recoverStaleChunkOnce();
  }

  clearRuntimeCaches = async () => {
    const tasks = [];
    try {
      if ('serviceWorker' in navigator) {
        tasks.push((async () => {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.allSettled(registrations.map(registration => registration.unregister()));
        })());
      }
      if ('caches' in window) {
        tasks.push((async () => {
          const keys = await window.caches.keys();
          await Promise.allSettled(keys.map(key => window.caches.delete(key)));
        })());
      }
    } catch {
      // Recovery still proceeds when browser storage APIs are unavailable.
    }
    await settleWithin(Promise.allSettled(tasks));
  };

  recoverStaleChunkOnce = async () => {
    const now = Date.now();
    try {
      const previous = Number(window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) || '0');
      if (Number.isFinite(previous) && previous > 0 && now - previous < CHUNK_RECOVERY_RETRY_MS) return;
      window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, String(now));
    } catch {
      // Some embedded/private browsers block sessionStorage. Recovery must still continue.
    }

    this.setState({ recovering: true });
    await this.clearRuntimeCaches();
    const url = new URL(window.location.href);
    url.searchParams.set('ka_chunk_recover', now.toString());
    window.location.replace(url.toString());
  };

  handleReload = async () => {
    this.setState({ recovering: true });
    try { window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY); } catch { /* ignore */ }
    await this.clearRuntimeCaches();
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('ka_recover', Date.now().toString());
    window.location.replace(url.toString());
  };

  render() {
    if (this.state.hasError) {
      if (isPublicLandingPath()) return <SafePublicLanding />;
      const isChunkError = CHUNK_ERROR_PATTERN.test(this.state.errorMessage);
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="w-full max-w-sm text-center space-y-3">
            <h2 className="text-xl font-bold">Terjadi kesalahan</h2>
            <p className="text-slate-400 text-sm">
              {isChunkError ? 'Versi aplikasi baru terdeteksi. KriptoAman sedang menyegarkan file aplikasi secara otomatis.' : 'Komponen ini tidak dapat dimuat. Coba pemulihan bersih.'}
            </p>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">{this.state.errorId}</p>
              <p className="mt-1 break-words text-xs leading-5 text-slate-300">{this.state.errorName}: {this.state.errorMessage}</p>
            </div>
            <button onClick={this.handleReload} disabled={this.state.recovering} className="min-h-11 w-full px-4 py-2 bg-blue-600 rounded-xl text-sm font-semibold disabled:opacity-60">
              {this.state.recovering ? 'Memulihkan…' : 'Muat Ulang Bersih'}
            </button>
            <a href="/" className="block min-h-11 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-200">Halaman Utama</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

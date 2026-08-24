import React from 'react';
import { logError } from '@/lib/errorHandler';

const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i;
const CHUNK_RECOVERY_KEY = 'ka_chunk_recovery_once';

/**
 * AppErrorBoundary — centralized React error boundary.
 * Includes one-shot stale-chunk recovery after a new deployment changes hashed assets.
 */
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, recovering: false, errorMessage: '', errorId: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || String(error || 'Unknown runtime error'),
      errorId: `KA-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error, info) {
    const message = error?.message || String(error || '');
    logError(error, {
      source: 'react_error_boundary',
      info: info?.componentStack?.slice(0, 500),
    });

    if (CHUNK_ERROR_PATTERN.test(message)) {
      this.recoverStaleChunkOnce();
    }
  }

  clearRuntimeCaches = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map(key => window.caches.delete(key)));
      }
    } catch {
      // Recovery still proceeds when browser storage APIs are unavailable.
    }
  };

  recoverStaleChunkOnce = async () => {
    try {
      if (window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1') return;
      window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1');
    } catch {
      // sessionStorage may be unavailable; manual recovery remains available.
      return;
    }

    this.setState({ recovering: true });
    await this.clearRuntimeCaches();
    const url = new URL(window.location.href);
    url.searchParams.set('ka_chunk_recover', Date.now().toString());
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

  handleSafeHome = async () => {
    this.setState({ recovering: true });
    try { window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY); } catch { /* ignore */ }
    await this.clearRuntimeCaches();
    window.location.replace(`/?ka_safe=${Date.now()}`);
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = CHUNK_ERROR_PATTERN.test(this.state.errorMessage);
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="w-full max-w-sm text-center space-y-3">
            <h2 className="text-xl font-bold">Terjadi kesalahan</h2>
            <p className="text-slate-400 text-sm">
              {isChunkError
                ? 'Versi aplikasi baru terdeteksi. KriptoAman sedang menyegarkan file aplikasi secara otomatis.'
                : 'Aplikasi menangkap kesalahan runtime. Detail di bawah membantu kami memperbaiki penyebabnya secara tepat.'}
            </p>
            <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">{this.state.errorId}</p>
              <p className="mt-1 break-words text-xs leading-5 text-slate-300">{this.state.errorMessage}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={this.handleReload}
                disabled={this.state.recovering}
                className="min-h-11 px-4 py-2 bg-blue-600 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {this.state.recovering ? 'Memulihkan…' : 'Muat Ulang Bersih'}
              </button>
              <button
                onClick={this.handleSafeHome}
                disabled={this.state.recovering}
                className="min-h-11 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-200 disabled:opacity-60"
              >
                Buka Halaman Utama Aman
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

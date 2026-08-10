import React from 'react';
import { logError } from '@/lib/errorHandler';

/**
 * AppErrorBoundary — centralized React error boundary.
 * Catches render errors in the subtree, logs them via errorHandler, and shows a
 * minimal reload prompt. Normal UI is unaffected.
 */
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, recovering: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logError(error, {
      source: 'react_error_boundary',
      info: info?.componentStack?.slice(0, 300),
    });
  }

  handleReload = async () => {
    this.setState({ recovering: true });
    try {
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.filter(key => key.startsWith('kriptoaman-')).map(key => window.caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
      }
    } catch {
      // Reload still proceeds when cache or service-worker APIs are unavailable.
    }
    const url = new URL(window.location.href);
    url.searchParams.set('ka_refresh', Date.now().toString());
    window.location.replace(url.toString());
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="text-center space-y-3 max-w-sm">
            <h2 className="text-xl font-bold">Terjadi kesalahan</h2>
            <p className="text-slate-400 text-sm">Muat ulang halaman untuk melanjutkan.</p>
            <button
              onClick={this.handleReload}
              disabled={this.state.recovering}
              className="px-4 py-2 bg-blue-600 rounded-xl text-sm font-semibold"
            >
              {this.state.recovering ? 'Memperbarui…' : 'Muat Ulang'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
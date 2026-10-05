import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import { LanguageProvider } from '@/lib/LanguageContext';
import HomeV10 from './pages/HomeV10';

const FullAppShell = lazy(() => import('./FullAppShell'));
const NetworkGatePreview = lazy(() => import('./pages/NetworkGatePreview'));

function AppRouteGate() {
  const { pathname } = useLocation();

  if (pathname === '/preview/network-gate') {
    return (
      <LanguageProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#01050d] px-5 py-12 text-slate-300">
              <div className="mx-auto max-w-md rounded-2xl border border-cyan-400/15 bg-[#050c16] p-5 text-sm">
                Memuat ZEVARYQ Live Network Gate…
              </div>
            </div>
          }
        >
          <NetworkGatePreview />
        </Suspense>
      </LanguageProvider>
    );
  }

  if (pathname === '/') {
    return (
      <LanguageProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#020711] px-5 py-12 text-slate-300">
              <div className="mx-auto max-w-md rounded-2xl border border-cyan-400/15 bg-[#050c16] p-5 text-sm">
                Memuat data KriptoAman…
              </div>
            </div>
          }
        >
          <HomeV10 />
        </Suspense>
      </LanguageProvider>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020713] px-5 py-12 text-slate-300">
          <div className="mx-auto max-w-md rounded-2xl border border-blue-500/15 bg-[#07111f] p-5 text-sm">
            Memuat workspace KriptoAman…
          </div>
        </div>
      }
    >
      <FullAppShell />
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AppErrorBoundary>
        <AppRouteGate />
        <PWAInstallPrompt />
      </AppErrorBoundary>
    </Router>
  );
}

export default App;

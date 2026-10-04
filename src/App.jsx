import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import KriptoAmanGlobalLanding from './pages/KriptoAmanGlobalLanding';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import { LanguageProvider } from '@/lib/LanguageContext';

const FullAppShell = lazy(() => import('./FullAppShell'));

function AppRouteGate() {
  const { pathname } = useLocation();

  if (pathname === '/') {
    return (
      <LanguageProvider>
        <KriptoAmanGlobalLanding />
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

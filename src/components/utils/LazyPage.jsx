import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Loading fallback ringan
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-slate-500 text-xs">Memuat...</p>
      </div>
    </div>
  );
}

// Wrapper: bungkus komponen lazy dalam Suspense
export function withLazy(LazyComp) {
  return function LazyWrapper(props) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LazyComp {...props} />
      </Suspense>
    );
  };
}

export default PageLoader;
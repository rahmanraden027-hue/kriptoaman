import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-xl pwa-install-prompt">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">Install KriptoAman</h3>
          <p className="text-blue-100 text-xs mt-1">Tambahkan ke home screen untuk akses lebih cepat</p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-blue-100 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="w-full mt-3 flex items-center justify-center gap-2 bg-white text-blue-600 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
      >
        <Download className="w-4 h-4" />
        Install
      </button>
    </div>
  );
}
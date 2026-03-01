import React from 'react';
import { Wifi, WifiOff, Zap, Home } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {isOnline ? (
          // Online - Reconnected
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                <Wifi className="w-12 h-12 text-green-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Kembali Online!</h1>
              <p className="text-slate-400">Anda terhubung kembali. Silakan tunggu sebentar...</p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </div>
        ) : (
          // Offline
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
                <WifiOff className="w-12 h-12 text-red-400" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Anda Sedang Offline</h1>
              <p className="text-slate-400 text-lg">
                Koneksi internet Anda terputus. COINVAULT sedang mencoba menyambungkan kembali...
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Yang Bisa Anda Lakukan:
              </h3>
              <ul className="text-slate-300 text-sm space-y-2 text-left">
                <li>✓ Lihat saldo dan riwayat transaksi</li>
                <li>✓ Baca notifikasi dan pesan</li>
                <li>✓ Lihat harga crypto dari cache</li>
                <li>✗ Tidak bisa mengirim atau menukar</li>
                <li>✗ Tidak bisa membuat transaksi baru</li>
              </ul>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/Wallet'}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Buka Dashboard
              </button>
              <button
                onClick={() => {
                  navigator.connection?.requestPermission?.() || 
                  window.location.reload();
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Coba Sambung Ulang
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-300 text-xs">
                💡 COINVAULT menggunakan teknologi PWA. Data Anda disimpan secara aman di perangkat Anda bahkan saat offline.
              </p>
            </div>

            <div className="text-center">
              <p className="text-slate-500 text-xs mb-2">Status Koneksi:</p>
              <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-mono">
                OFFLINE • {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── OWNER EMAIL — HANYA EMAIL INI YANG BISA AKSES ADMIN ─────────────────────
const OWNER_EMAIL = 'rahmanraden027@gmail.com';

/**
 * AdminGuard: Hanya render children jika user adalah OWNER (email hardcoded).
 * Bahkan jika seseorang di-set sebagai "admin" di database,
 * mereka tetap tidak bisa akses tanpa email yang cocok.
 */
export default function AdminGuard({ children }) {
  const [status, setStatus] = useState('loading'); // loading | allowed | denied

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (u && u.role === 'admin' && u.email === OWNER_EMAIL) {
          setStatus('allowed');
        } else {
          setStatus('denied');
        }
      })
      .catch(() => setStatus('denied'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <ShieldAlert className="w-14 h-14 text-red-400 mx-auto" />
          <h2 className="text-red-400 font-bold text-xl">Akses Ditolak</h2>
          <p className="text-slate-400 text-sm">
            Area ini hanya dapat diakses oleh pemilik platform.
          </p>
          <p className="text-slate-600 text-xs">Akses tidak sah akan dicatat.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook untuk cek apakah user adalah owner
export function useIsOwner() {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setIsOwner(!!(u && u.role === 'admin' && u.email === OWNER_EMAIL));
        setLoading(false);
      })
      .catch(() => { setIsOwner(false); setLoading(false); });
  }, []);

  return { isOwner, loading };
}

export { OWNER_EMAIL };
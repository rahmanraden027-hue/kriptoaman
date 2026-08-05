import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/apiService';
import { isOwner as isOwnerUser, OWNER_EMAIL } from '@/lib/rbac';
import { logAudit } from '@/lib/auditLog';

/**
 * AdminGuard: only render children if the current user is the platform OWNER
 * (email hardcoded in rbac.OWNER_EMAIL). Uses the centralized RBAC owner check
 * (replacing the previously duplicated base44.auth.me + email comparison).
 */
export default function AdminGuard({ children }) {
  const [status, setStatus] = useState('loading'); // loading | allowed | denied

  useEffect(() => {
    let mounted = true;
    apiService.auth.me()
      .then((u) => {
        if (!mounted) return;
        if (isOwnerUser(u)) {
          setStatus('allowed');
        } else {
          setStatus('denied');
          logAudit('owner_guard_denied', { email: u?.email, role: u?.role, path: window.location.pathname });
        }
      })
      .catch(() => {
        if (!mounted) return;
        setStatus('denied');
        logAudit('owner_guard_error', { path: window.location.pathname });
      });
    return () => { mounted = false; };
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

// Hook untuk cek apakah user adalah owner (backward-compatible API)
export function useIsOwner() {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiService.auth.me()
      .then((u) => {
        if (!mounted) return;
        setIsOwner(isOwnerUser(u));
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsOwner(false);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { isOwner, loading };
}

export { OWNER_EMAIL };
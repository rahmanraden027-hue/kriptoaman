import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { OWNER_EMAIL } from '@/lib/rbac';
import { logAudit } from '@/lib/auditLog';

async function checkServerAdmin() {
  const response = await fetch('/api/auth/admin/check', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  return {
    allowed: response.ok && data?.admin === true,
    status: response.status,
    user: data?.user || null,
  };
}

/**
 * AdminGuard protects owner/admin control surfaces using the same first-party
 * server verification as AdminRoute. The browser is not trusted to decide
 * whether an email or role is privileged.
 */
export default function AdminGuard({ children }) {
  const [status, setStatus] = useState('loading'); // loading | allowed | denied

  useEffect(() => {
    let mounted = true;

    checkServerAdmin()
      .then(({ allowed, status: httpStatus, user }) => {
        if (!mounted) return;
        if (allowed) {
          setStatus('allowed');
          return;
        }
        setStatus('denied');
        logAudit('admin_guard_denied', {
          email: user?.email,
          role: user?.role,
          status: httpStatus,
          path: window.location.pathname,
        });
      })
      .catch(() => {
        if (!mounted) return;
        setStatus('denied');
        logAudit('admin_guard_error', { path: window.location.pathname });
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
            Area ini hanya dapat diakses oleh sesi admin KriptoAman yang terverifikasi.
          </p>
          <p className="text-slate-600 text-xs">Akses tidak sah akan dicatat.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Backward-compatible hook for legacy components that still call useIsOwner.
export function useIsOwner() {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    checkServerAdmin()
      .then(({ allowed }) => {
        if (!mounted) return;
        setIsOwner(allowed);
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

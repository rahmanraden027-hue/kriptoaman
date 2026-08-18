import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2, ShieldCheck } from 'lucide-react';
import { OWNER_EMAIL } from '@/lib/rbac';
import { logAudit } from '@/lib/auditLog';
import { TOTPSetup } from './TOTP2FA';

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
    twoFactorRequired: data?.two_factor_setup_required === true,
    twoFactorEnabled: data?.two_factor_enabled === true,
    status: response.status,
    user: data?.user || null,
  };
}

/**
 * AdminGuard protects owner/admin control surfaces using first-party server
 * verification. Admins must also enroll TOTP before the protected content is
 * rendered. The browser is never trusted to decide whether a role is privileged.
 */
export default function AdminGuard({ children }) {
  const [status, setStatus] = useState('loading'); // loading | allowed | setup2fa | denied
  const [setupOpen, setSetupOpen] = useState(false);

  const verify = async () => {
    setStatus('loading');
    try {
      const { allowed, twoFactorRequired, status: httpStatus, user } = await checkServerAdmin();
      if (allowed && twoFactorRequired) {
        setStatus('setup2fa');
        setSetupOpen(true);
        logAudit('admin_2fa_enrollment_required', { email: user?.email, path: window.location.pathname });
        return;
      }
      if (allowed) {
        setStatus('allowed');
        setSetupOpen(false);
        return;
      }
      setStatus('denied');
      logAudit('admin_guard_denied', {
        email: user?.email,
        role: user?.role,
        status: httpStatus,
        path: window.location.pathname,
      });
    } catch {
      setStatus('denied');
      logAudit('admin_guard_error', { path: window.location.pathname });
    }
  };

  useEffect(() => { verify(); }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (status === 'setup2fa') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-blue-500/30 bg-blue-500/10 p-8 text-center space-y-4">
          <ShieldCheck className="w-14 h-14 text-blue-400 mx-auto" />
          <h2 className="text-white font-bold text-xl">2FA Admin Wajib Diaktifkan</h2>
          <p className="text-slate-300 text-sm">Untuk melanjutkan ke kontrol admin, tautkan Google Authenticator, Authy, atau aplikasi TOTP lain dan simpan kode pemulihan secara offline.</p>
          <button onClick={() => setSetupOpen(true)} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500">Aktifkan 2FA Sekarang</button>
        </div>
        {setupOpen && (
          <TOTPSetup
            onDone={verify}
            onCancel={() => setSetupOpen(false)}
          />
        )}
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <ShieldAlert className="w-14 h-14 text-red-400 mx-auto" />
          <h2 className="text-red-400 font-bold text-xl">Akses Ditolak</h2>
          <p className="text-slate-400 text-sm">Area ini hanya dapat diakses oleh sesi admin KriptoAman yang terverifikasi.</p>
          <p className="text-slate-600 text-xs">Akses tidak sah akan dicatat.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function useIsOwner() {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    checkServerAdmin()
      .then(({ allowed, twoFactorRequired }) => {
        if (!mounted) return;
        setIsOwner(allowed && !twoFactorRequired);
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

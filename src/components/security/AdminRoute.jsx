import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/auditLog';
import { useToast } from '@/components/ui/use-toast';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [serverAdmin, setServerAdmin] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      if (isLoadingAuth) return;
      if (!isAuthenticated) {
        if (!cancelled) {
          setServerAdmin(false);
          setTwoFactorRequired(false);
          setCheckingAdmin(false);
        }
        return;
      }

      setCheckingAdmin(true);
      try {
        const response = await fetch('/api/auth/admin/check', {
          method: 'GET',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        const data = await response.json().catch(() => null);
        const allowed = response.ok && data?.admin === true;
        const needs2FA = allowed && data?.two_factor_setup_required === true;
        if (!cancelled) {
          setServerAdmin(allowed);
          setTwoFactorRequired(needs2FA);
          setCheckingAdmin(false);
        }
        if (!allowed) {
          logAudit('admin_route_denied', { path: window.location.pathname, status: response.status });
          toast({
            title: 'Akses tidak diizinkan',
            description: 'Halaman ini hanya tersedia untuk sesi admin yang terverifikasi.',
            variant: 'destructive',
          });
        } else if (needs2FA) {
          logAudit('admin_route_2fa_required', { path: window.location.pathname });
          toast({
            title: '2FA admin wajib',
            description: 'Aktifkan autentikasi dua faktor sebelum membuka kontrol admin.',
          });
        }
      } catch {
        if (!cancelled) {
          setServerAdmin(false);
          setTwoFactorRequired(false);
          setCheckingAdmin(false);
        }
        logAudit('admin_route_verification_failed', { path: window.location.pathname });
        toast({
          title: 'Verifikasi admin gagal',
          description: 'Akses admin ditutup sementara karena sesi tidak dapat diverifikasi.',
          variant: 'destructive',
        });
      }
    }

    verifyAdmin();
    return () => { cancelled = true; };
  }, [isLoadingAuth, isAuthenticated, toast]);

  if (isLoadingAuth || checkingAdmin) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!serverAdmin) return <Navigate to="/" replace />;
  if (twoFactorRequired && window.location.pathname !== '/SecurityCenter') {
    return <Navigate to="/SecurityCenter" replace />;
  }

  return children;
}

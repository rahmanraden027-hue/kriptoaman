import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/auditLog';
import { useToast } from '@/components/ui/use-toast';

/**
 * AdminRoute — melindungi semua halaman admin dengan verifikasi server-side.
 * Browser tidak dipercaya sebagai sumber otoritas role. Sebelum halaman admin
 * dirender, server memverifikasi cookie bertanda tangan, session ID aktif,
 * dan role admin dari database first-party KriptoAman.
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [serverAdmin, setServerAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAdmin() {
      if (isLoadingAuth) return;
      if (!isAuthenticated) {
        if (!cancelled) {
          setServerAdmin(false);
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
        if (!cancelled) {
          setServerAdmin(allowed);
          setCheckingAdmin(false);
        }
        if (!allowed) {
          logAudit('admin_route_denied', { path: window.location.pathname, status: response.status });
          toast({
            title: 'Akses tidak diizinkan',
            description: 'Halaman ini hanya tersedia untuk sesi admin yang terverifikasi.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setServerAdmin(false);
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!serverAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

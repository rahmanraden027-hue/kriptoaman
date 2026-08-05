import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/rbac';
import { logAudit } from '@/lib/auditLog';
import { useToast } from '@/components/ui/use-toast';

/**
 * AdminRoute — melindungi halaman/operasi admin di level route (RBAC).
 * User biasa yang mencoba membuka URL admin langsung akan diarahkan ke "/"
 * dan ditampilkan toast "Akses tidak diizinkan"; upaya dicatat di audit log.
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { isAdmin } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && !isAdmin) {
      logAudit('admin_route_denied', { path: window.location.pathname });
      toast({
        title: 'Akses tidak diizinkan',
        description: 'Halaman ini hanya tersedia untuk admin.',
        variant: 'destructive',
      });
    }
  }, [isLoadingAuth, isAuthenticated, isAdmin, toast]);

  if (isLoadingAuth || !isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
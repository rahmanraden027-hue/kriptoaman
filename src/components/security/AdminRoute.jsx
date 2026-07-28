import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

/**
 * AdminRoute — melindungi halaman/operasi admin di level route (bukan sekadar menu).
 * User biasa yang mencoba membuka URL admin langsung akan diarahkan ke "/" (Home)
 * dan ditampilkan toast "Akses tidak diizinkan".
 */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const { toast } = useToast();

  const isAdmin = !isLoadingAuth && isAuthenticated && user?.role === 'admin';

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && !isAdmin) {
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
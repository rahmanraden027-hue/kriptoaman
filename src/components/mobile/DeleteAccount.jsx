import React, { useState } from 'react';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    if (confirmText !== 'HAPUS') {
      setError('Ketik "HAPUS" untuk mengkonfirmasi penghapusan akun.');
      return;
    }
    setLoading(true);
    try {
      await kriptoAuth.deleteAccount(confirmText);
      window.location.assign('/login?account_deleted=1');
    } catch (err) {
      setError(
        err.message ||
          'Terjadi kesalahan. Akun Anda belum dihapus. Hubungi dukungan KriptoAman.'
      );
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <div className="mt-6">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold text-left">Hapus Akun</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-red-400 font-bold">Hapus Akun Permanen</h3>
        </div>
        <button
          onClick={() => { setOpen(false); setError(''); setConfirmText(''); }}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800"
          aria-label="Batal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 text-sm text-slate-300 mb-4">
        <p>Tindakan ini <strong className="text-red-400">tidak dapat dibatalkan</strong>. Konsekuensi penghapusan akun:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
          <li>Profil, preferensi, dan data akun akan dijadwalkan untuk dihapus.</li>
          <li>Sesi aktif akan dihentikan dan akses akun dicabut.</li>
          <li>Data yang wajib disimpan menurut hukum dapat dipertahankan selama masa retensi.</li>
          <li>Alamat serta transaksi blockchain publik tidak dapat dihapus dari jaringan.</li>
        </ul>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-400 mb-2">
        Ketik <strong className="text-white">HAPUS</strong> untuk mengkonfirmasi:
      </p>
      <Input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="HAPUS"
        className="mb-4 h-12 bg-slate-900 border-red-500/30"
      />

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12"
          onClick={() => { setOpen(false); setError(''); setConfirmText(''); }}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          variant="destructive"
          className="flex-1 h-12"
          onClick={handleDelete}
          disabled={loading || confirmText !== 'HAPUS'}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menghapus...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Akun
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { startKyc } from '@/lib/kriptoKyc';
import { createPageUrl } from '@/utils';

export default function KYC() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  async function refreshUser() {
    try {
      setUser(await base44.auth.me());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshUser(); }, []);

  async function beginVerification() {
    setStarting(true);
    setError('');
    try {
      const result = await startKyc();
      if (result.status === 'approved') return refreshUser();
      if (!result.url?.startsWith('https://verify.didit.me/')) throw new Error('URL verifikasi tidak valid');
      window.location.assign(result.url);
    } catch (err) {
      setError(err.message || 'Tidak dapat memulai KYC');
      setStarting(false);
    }
  }

  const status = user?.kycStatus || 'none';
  const approved = status === 'approved';
  const pending = status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 pt-6 pb-24">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Profile')} className="p-2 bg-slate-800 border border-slate-700 rounded-xl">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg">Verifikasi Identitas</h1>
            <p className="text-slate-500 text-xs">KYC aman melalui Didit</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 text-center space-y-4">
          {loading ? (
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
          ) : approved ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">KYC Terverifikasi</h2>
              <p className="text-slate-400 text-sm">Identitas Anda telah disetujui oleh penyedia verifikasi.</p>
            </>
          ) : pending ? (
            <>
              <Clock className="w-14 h-14 text-amber-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Verifikasi Sedang Berjalan</h2>
              <p className="text-slate-400 text-sm">Selesaikan proses Didit atau tunggu hasil pemeriksaan.</p>
              <button onClick={beginVerification} disabled={starting} className="w-full py-3.5 bg-blue-600 disabled:opacity-60 text-white font-bold rounded-2xl">
                {starting ? 'Membuka Didit…' : 'Lanjutkan Verifikasi'}
              </button>
            </>
          ) : (
            <>
              <ShieldCheck className="w-14 h-14 text-blue-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Verifikasi dengan Didit</h2>
              <p className="text-slate-400 text-sm">Dokumen identitas dan liveness diproses langsung melalui alur verifikasi Didit. KriptoAman hanya menyimpan referensi sesi dan status yang diperlukan.</p>
              <button onClick={beginVerification} disabled={starting} className="w-full py-3.5 bg-blue-600 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {starting ? 'Menyiapkan sesi…' : 'Mulai Verifikasi KYC'}
              </button>
            </>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-slate-400">
          Status KYC hanya dapat diperbarui oleh layanan verifikasi server-side. Browser tidak dapat menyetujui KYC sendiri.
        </div>
      </div>
    </div>
  );
}

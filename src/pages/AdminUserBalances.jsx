import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldCheck, Users, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { kriptoAuth } from '@/lib/kriptoAuth';
import GitHubSecurityReview from '../components/admin/GitHubSecurityReview';

export default function AdminUserBalances() {
  const { user, isLoadingAuth } = useAuth();
  const [kycUpdating, setKycUpdating] = useState(null);
  const [actionError, setActionError] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['adminFirstPartyUsers'],
    queryFn: () => kriptoAuth.getAdminUsers(500),
    enabled: user?.role === 'admin',
    staleTime: 30_000,
  });

  const handleKYCUpdate = async (targetUser, newStatus) => {
    setActionError('');
    setKycUpdating(targetUser.id);
    try {
      await kriptoAuth.updateAdminUserKyc(targetUser.id, newStatus);
      await queryClient.invalidateQueries({ queryKey: ['adminFirstPartyUsers'] });
    } catch (err) {
      setActionError(err?.message || 'Perubahan status KYC gagal disimpan.');
    } finally {
      setKycUpdating(null);
    }
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-lg font-bold text-red-400">Akses Ditolak</h2>
          </div>
          <p className="text-slate-300">Hanya sesi admin yang terverifikasi server yang dapat mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  const pending = users.filter((item) => item.kycStatus === 'pending').length;
  const approved = users.filter((item) => item.kycStatus === 'approved').length;
  const rejected = users.filter((item) => item.kycStatus === 'rejected').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Admin — Pengguna & KYC</h1>
            </div>
            <p className="text-slate-400">Data nyata dari database first-party KriptoAman. Tidak menggunakan data contoh atau angka sintetis.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            Server verified
          </div>
        </div>

        {(error || actionError) && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {actionError || error?.message || 'Data admin tidak dapat dimuat.'}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Pengguna" value={users.length} />
          <StatCard label="KYC Pending" value={pending} tone="yellow" />
          <StatCard label="KYC Approved" value={approved} tone="green" />
          <StatCard label="KYC Rejected" value={rejected} tone="red" />
        </div>

        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/40 bg-slate-900/80">
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Pengguna</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Role</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">Email</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-semibold">KYC</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-semibold">Terdaftar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold">{item.full_name || 'Belum diisi'}</p>
                      <p className="text-xs text-slate-500">{item.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.role}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={item.email_verified ? 'text-emerald-400' : 'text-slate-500'}>
                        {item.email_verified ? 'Terverifikasi' : 'Belum'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <KycControl user={item} updating={kycUpdating === item.id} onChange={handleKYCUpdate} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.created_date ? new Date(item.created_date).toLocaleString('id-ID') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {users.length === 0 && !error && (
          <div className="text-center py-12 text-slate-400">Belum ada pengguna pada database first-party.</div>
        )}

        <GitHubSecurityReview />
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = 'default' }) {
  const toneClass = {
    default: 'text-white border-slate-700/40',
    yellow: 'text-yellow-400 border-yellow-500/25',
    green: 'text-emerald-400 border-emerald-500/25',
    red: 'text-red-400 border-red-500/25',
  }[tone];

  return (
    <div className={`bg-slate-800/60 border rounded-xl p-4 ${toneClass.split(' ').slice(1).join(' ')}`}>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${toneClass.split(' ')[0]}`}>{value.toLocaleString('id-ID')}</p>
    </div>
  );
}

function KycControl({ user, updating, onChange }) {
  if (updating) return <Loader2 className="w-4 h-4 animate-spin text-slate-400 mx-auto" />;

  const status = user.kycStatus || 'none';
  const badge = status === 'approved'
    ? <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>
    : status === 'pending'
      ? <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
      : status === 'rejected'
        ? <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
        : <span className="px-2 py-1 rounded bg-slate-700 text-slate-400 text-xs font-semibold">None</span>;

  return (
    <div className="flex items-center justify-center gap-1">
      {badge}
      {status !== 'approved' && (
        <button onClick={() => onChange(user, 'approved')} title="Setujui KYC" className="p-1 rounded hover:bg-green-500/20 text-green-400 transition-colors">
          <CheckCircle2 className="w-4 h-4" />
        </button>
      )}
      {status !== 'rejected' && (
        <button onClick={() => onChange(user, 'rejected')} title="Tolak KYC" className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors">
          <XCircle className="w-4 h-4" />
        </button>
      )}
      {status !== 'pending' && (
        <button onClick={() => onChange(user, 'pending')} title="Kembalikan ke pending" className="p-1 rounded hover:bg-yellow-500/20 text-yellow-400 transition-colors">
          <Clock className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

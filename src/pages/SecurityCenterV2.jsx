import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Gauge, Loader2, RefreshCw, Shield, ShieldAlert, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminGuard from '../components/security/AdminGuard';

function derivePosture(sec, degraded) {
  if (degraded) return { score: null, label: 'Tidak terverifikasi', tone: 'text-amber-300', factors: [] };

  const rogueAdmins = Number(sec?.rogueAdminsFound || 0);
  const adminCount = Number(sec?.adminCount || 0);
  const pendingWithdrawals = Number(sec?.pendingWithdrawals || 0);

  const factors = [
    { label: 'Admin tidak sah', weight: 50, pass: rogueAdmins === 0, detail: `${rogueAdmins}` },
    { label: 'Jumlah admin terverifikasi', weight: 20, pass: adminCount === 1, detail: `${adminCount}` },
    { label: 'Withdrawal tertunda', weight: 20, pass: pendingWithdrawals === 0, detail: `${pendingWithdrawals}` },
    { label: 'Backend security check', weight: 10, pass: true, detail: 'verified' },
  ];

  const score = factors.reduce((sum, factor) => sum + (factor.pass ? factor.weight : 0), 0);
  const label = score >= 90 ? 'Kuat' : score >= 70 ? 'Baik' : score >= 50 ? 'Perlu perhatian' : 'Risiko tinggi';
  const tone = score >= 90 ? 'text-emerald-300' : score >= 70 ? 'text-cyan-300' : score >= 50 ? 'text-amber-300' : 'text-rose-300';
  return { score, label, tone, factors };
}

export default function SecurityCenterV2() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);

  const runCheck = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('adminSecurityCheck', {});
      setReport({ ...(response?.data || {}), degraded: false });
    } catch (error) {
      console.error('Security check error:', error);
      setReport({ security: {}, degraded: true });
    } finally {
      setCheckedAt(new Date());
      setLoading(false);
    }
  };

  useEffect(() => { runCheck(); }, []);

  const sec = report?.security || {};
  const posture = useMemo(() => derivePosture(sec, report?.degraded), [sec, report?.degraded]);

  return (
    <AdminGuard>
      <div className="ka-bg min-h-screen pb-28 text-white">
        <div className="mx-auto max-w-6xl space-y-4 px-4 pt-5 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[#07111d]/95 p-5 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-cyan-300"><Shield className="h-4 w-4" /> OWNER SECURITY COMMAND</p>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl">Security Center</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Posture keamanan berbasis hasil pemeriksaan backend yang tersedia. Tidak ada poin baseline dekoratif.</p>
              </div>
              <button type="button" onClick={runCheck} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-200 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Cek Sekarang
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="ka-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500"><Gauge className="h-4 w-4" /> Security Posture Score</p>
                  <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-black">{posture.score == null ? '—' : posture.score}</span>{posture.score != null && <span className="pb-1 text-sm text-slate-500">/100</span>}</div>
                  <p className={`mt-1 text-sm font-black ${posture.tone}`}>{posture.label}</p>
                </div>
                {report?.degraded ? <ShieldAlert className="h-8 w-8 text-amber-300" /> : <Shield className="h-8 w-8 text-emerald-300" />}
              </div>
              <p className="mt-4 text-[10px] leading-5 text-slate-500">Skor hanya dihitung dari kontrol yang dapat diamati pada pemeriksaan ini. Jika backend tidak tersedia, skor sengaja tidak dihitung. Ini bukan sertifikasi audit atau pengganti penetration test.</p>
              {checkedAt && <p className="mt-3 text-[10px] text-slate-600">Terakhir diperiksa: {checkedAt.toLocaleString('id-ID')}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(posture.factors.length ? posture.factors : [
                { label: 'Admin tidak sah', detail: '—', pass: false, weight: 50 },
                { label: 'Jumlah admin terverifikasi', detail: '—', pass: false, weight: 20 },
                { label: 'Withdrawal tertunda', detail: '—', pass: false, weight: 20 },
                { label: 'Backend security check', detail: 'unavailable', pass: false, weight: 10 },
              ]).map((factor) => (
                <div key={factor.label} className="ka-surface p-4">
                  <div className="flex items-center justify-between gap-2">{factor.pass ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />}<span className="text-[10px] font-black text-slate-500">{factor.weight}%</span></div>
                  <p className="mt-2 text-xs font-bold text-white">{factor.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{factor.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-4">
            {[
              [Activity, 'Admin tidak sah', sec.rogueAdminsFound],
              [Users, 'Total admin', sec.adminCount],
              [ShieldAlert, 'Withdrawal pending', sec.pendingWithdrawals],
              [Activity, 'Deposit pending', sec.pendingDeposits],
            ].map(([Icon, label, value]) => <div key={label} className="ka-surface p-4"><Icon className="h-4 w-4 text-cyan-300" /><p className="mt-2 text-[9px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{Number.isFinite(Number(value)) ? Number(value) : '—'}</p></div>)}
          </section>

          {report?.degraded && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-200">Backend security check sedang tidak tersedia. Dashboard tidak menampilkan skor seolah-olah hasil real-time.</div>}
        </div>
      </div>
    </AdminGuard>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Award, BarChart3, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { useLanguage } from '@/lib/LanguageContext';

const n = (value, en) => Number(value || 0).toLocaleString(en ? 'en-US' : 'id-ID');

export default function AdminKAMAnalytics() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setData(await kriptoAuth.getKamAnalytics()); }
    catch (err) { setError(err?.message || (en ? 'Analytics unavailable.' : 'Analitik belum dapat dimuat.')); }
    finally { setLoading(false); }
  }, [en]);

  useEffect(() => { load(); }, [load]);

  const cards = useMemo(() => ([
    [en ? 'Invites' : 'Undangan', data?.totals?.invites, Users],
    [en ? 'Pending' : 'Menunggu', data?.totals?.pending, Activity],
    [en ? 'Rewarded' : 'Diberi reward', data?.totals?.rewarded, Award],
    [en ? 'Conversion' : 'Konversi', `${data?.totals?.rewardConversionRate || 0}%`, BarChart3],
  ]), [data, en]);

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-cyan-400/15 bg-[#071423]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,.3)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.22em] text-cyan-300">KAM NETWORK INTELLIGENCE</p>
              <h1 className="mt-1 text-2xl font-extrabold">{en ? 'Campaign & Referral Analytics' : 'Analitik Campaign & Referral'}</h1>
              <p className="mt-2 text-sm text-slate-400">{en ? 'Live referral funnel, campaign budget usage and referral network visibility.' : 'Funnel referral, penggunaan budget campaign, dan jaringan referral dari data D1.'}</p>
            </div>
            <button onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-200 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {en ? 'Refresh' : 'Perbarui'}
            </button>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon]) => (
            <div key={label} className="ka-surface p-5">
              <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-400">{label}</p><Icon className="h-4 w-4 text-cyan-300" /></div>
              <p className="mt-3 text-2xl font-extrabold">{loading ? '—' : typeof value === 'string' ? value : n(value, en)}</p>
            </div>
          ))}
        </section>

        <section className="ka-surface overflow-hidden">
          <div className="border-b border-slate-800 p-5"><h2 className="font-bold">{en ? 'Campaign performance' : 'Kinerja campaign'}</h2></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-950/50 text-slate-500"><tr><th className="p-3">Campaign</th><th className="p-3">Status</th><th className="p-3">Invites</th><th className="p-3">Rewarded</th><th className="p-3">Conversion</th><th className="p-3">Budget</th></tr></thead>
              <tbody>
                {(data?.campaigns || []).map((c) => (
                  <tr key={c.id} className="border-t border-slate-800/70">
                    <td className="p-3"><p className="font-bold text-white">{c.name}</p><p className="text-[10px] text-slate-500">{c.code} · {c.type}</p></td>
                    <td className="p-3">{c.status}</td><td className="p-3">{n(c.invites, en)}</td><td className="p-3">{n(c.rewarded, en)}</td><td className="p-3">{c.conversionRate}%</td>
                    <td className="p-3"><p>{n(c.distributedPoints, en)} / {n(c.budgetPoints, en)}</p><div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, c.budgetUsagePercent)}%` }} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="ka-surface overflow-hidden lg:col-span-7">
            <div className="border-b border-slate-800 p-5"><h2 className="font-bold">{en ? 'Referral network' : 'Jaringan referral'}</h2></div>
            <div className="max-h-[560px] overflow-auto">
              {(data?.network || []).map((r) => (
                <div key={r.id} className="border-b border-slate-800/70 p-4 last:border-0">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{r.referrer.name || r.referrer.email}</p><p className="text-[10px] text-slate-500">→ {r.invitee.name || r.invitee.email}</p></div><span className="rounded-full bg-slate-800 px-2 py-1 text-[9px] font-bold">{r.status}</span></div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500"><span>{r.campaignCode}</span><span>Email: {r.invitee.emailVerified ? '✓' : '—'}</span><span>KYC: {r.invitee.kycStatus}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="ka-surface overflow-hidden lg:col-span-5">
            <div className="border-b border-slate-800 p-5"><h2 className="font-bold">{en ? 'Top referrers' : 'Referrer teratas'}</h2></div>
            <div>
              {(data?.topReferrers || []).map((r, index) => (
                <div key={r.id} className="flex items-center justify-between border-b border-slate-800/70 p-4 last:border-0">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-xs font-black text-cyan-300">#{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{r.name || r.email}</p><p className="text-[10px] text-slate-500">{r.invites} invites · {r.conversionRate}%</p></div></div>
                  <div className="text-right"><p className="text-sm font-extrabold text-emerald-300">+{n(r.referralPoints, en)}</p><p className="text-[9px] text-slate-600">KAM Points</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-xs text-slate-400"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" /><p>{en ? 'Analytics are derived from KriptoAman D1 reward and referral records. KAM Points remain off-chain and are not a market-price or token-listing metric.' : 'Analitik berasal dari catatan reward dan referral D1 KriptoAman. KAM Points tetap off-chain dan bukan ukuran harga pasar atau status listing token.'}</p></div></section>
      </div>
    </div>
  );
}

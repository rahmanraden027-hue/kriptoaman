import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, RefreshCw, ShieldCheck, Users, Database, Gift, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { useLanguage } from '@/lib/LanguageContext';

function formatNumber(value, en) {
  return Number(value || 0).toLocaleString(en ? 'en-US' : 'id-ID');
}

export default function AdminKAMRewards() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ email: '', campaignId: '', amount: '', reason: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await kriptoAuth.getAdminKamRewards());
    } catch (err) {
      setError(err?.message || (en ? 'Unable to load KAM reward data.' : 'Data reward KAM belum dapat dimuat.'));
    } finally {
      setLoading(false);
    }
  }, [en]);

  useEffect(() => { load(); }, [load]);

  const cards = useMemo(() => ([
    { label: en ? 'Total KAM Points' : 'Total KAM Points', value: data?.totals?.totalPoints, icon: Award },
    { label: en ? 'Rewarded users' : 'Pengguna penerima', value: data?.totals?.rewardedUsers, icon: Users },
    { label: en ? 'Ledger entries' : 'Entri ledger', value: data?.totals?.totalEntries, icon: Database },
    { label: en ? 'Campaign grants' : 'Reward campaign', value: data?.totals?.campaignGrants, icon: Gift },
  ]), [data, en]);

  async function submitReward(event) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError('');
    try {
      const response = await kriptoAuth.grantKamCampaignReward({
        email: form.email.trim(),
        campaignId: form.campaignId.trim(),
        amount: Number(form.amount),
        reason: form.reason.trim(),
      });
      setResult(response);
      await load();
      if (response?.awarded) setForm((current) => ({ ...current, email: '', amount: '', reason: '' }));
    } catch (err) {
      setError(err?.message || (en ? 'Reward could not be granted.' : 'Reward belum dapat diberikan.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[#071423]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,.3)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(34,211,238,.14),transparent_28%),radial-gradient(circle_at_5%_100%,rgba(245,158,11,.10),transparent_28%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.22em] text-cyan-300">KAM REWARD CONTROL</p>
              <h1 className="mt-1 text-2xl font-extrabold">{en ? 'Admin KAM Rewards Dashboard' : 'Dashboard Reward KAM Admin'}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                {en
                  ? 'Controlled off-chain KAM Points distribution with campaign-level duplicate protection and admin audit records.'
                  : 'Distribusi KAM Points off-chain yang terkontrol dengan perlindungan duplikasi per campaign dan catatan audit admin.'}
              </p>
            </div>
            <button onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-200 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {en ? 'Refresh' : 'Perbarui'}
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="ka-surface p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400">{label}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10"><Icon className="h-4 w-4 text-cyan-300" /></div>
              </div>
              <p className="mt-3 text-2xl font-extrabold">{loading ? '—' : formatNumber(value, en)}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="ka-surface p-5 lg:col-span-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10"><Gift className="h-5 w-5 text-amber-300" /></div>
              <div>
                <h2 className="font-bold">{en ? 'Grant campaign reward' : 'Berikan reward campaign'}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{en ? 'One grant per campaign ID per user. Repeated submissions are blocked.' : 'Satu reward per campaign ID untuk setiap pengguna. Pengiriman berulang akan diblokir.'}</p>
              </div>
            </div>

            <form onSubmit={submitReward} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Email pengguna</span>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-cyan-400" placeholder="user@example.com" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">Campaign ID</span>
                  <input required value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-cyan-400" placeholder="KAM2026" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-400">KAM Points</span>
                  <input required min="1" max="100000" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-cyan-400" placeholder="100" />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">{en ? 'Reward reason' : 'Alasan reward'}</span>
                <textarea required maxLength={160} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-cyan-400" placeholder={en ? 'Verified community contribution' : 'Kontribusi komunitas terverifikasi'} />
              </label>

              <button disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50">
                <ShieldCheck className="h-4 w-4" />
                {submitting ? (en ? 'Processing…' : 'Memproses…') : (en ? 'Grant KAM Points' : 'Berikan KAM Points')}
              </button>
            </form>

            {result && (
              <div className={`mt-4 rounded-xl border p-3 ${result.awarded ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-amber-400/20 bg-amber-400/5'}`}>
                <div className="flex gap-2">
                  {result.awarded ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />}
                  <p className="text-xs leading-relaxed text-slate-300">
                    {result.awarded
                      ? `${formatNumber(result?.points?.balance, en)} KAM Points — ${en ? 'reward recorded successfully.' : 'reward berhasil dicatat.'}`
                      : (en ? 'Duplicate prevented: this user already received this campaign reward.' : 'Duplikasi dicegah: pengguna ini sudah menerima reward campaign tersebut.')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="ka-surface overflow-hidden lg:col-span-7">
            <div className="border-b border-slate-800 p-5">
              <h2 className="font-bold">{en ? 'Recent KAM Points activity' : 'Aktivitas KAM Points terbaru'}</h2>
              <p className="mt-1 text-xs text-slate-500">{en ? 'Latest 50 ledger records.' : '50 catatan ledger terbaru.'}</p>
            </div>
            {error && <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
            <div className="max-h-[640px] overflow-auto">
              {(data?.recent || []).map((row) => (
                <div key={row.id} className="border-b border-slate-800/70 p-4 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{row.fullName || row.email}</p>
                      <p className="truncate text-xs text-slate-500">{row.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-xs font-extrabold text-emerald-300">+{formatNumber(row.amount, en)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{row.reason}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600">
                    <span>{row.source}</span>
                    {row.metadata?.campaignId && <span>Campaign: {row.metadata.campaignId}</span>}
                    <span>{new Date(row.createdAt).toLocaleString(en ? 'en-US' : 'id-ID')}</span>
                  </div>
                </div>
              ))}
              {!loading && !(data?.recent || []).length && <div className="p-8 text-center text-sm text-slate-500">{en ? 'No reward activity yet.' : 'Belum ada aktivitas reward.'}</div>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-xs leading-relaxed text-slate-400">
              {en
                ? 'KAM Points remain off-chain, non-transferable and non-redeemable. This dashboard does not create, mint, sell or transfer on-chain KAM tokens.'
                : 'KAM Points tetap off-chain, tidak dapat ditransfer dan belum dapat ditukar. Dashboard ini tidak membuat, mint, menjual, atau mentransfer token KAM on-chain.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

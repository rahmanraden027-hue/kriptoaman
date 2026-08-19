import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, RefreshCw, ShieldCheck, Users, Database, Gift, AlertTriangle, CheckCircle2, CalendarDays, Play, Pause, CircleStop } from 'lucide-react';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { useLanguage } from '@/lib/LanguageContext';

function formatNumber(value, en) {
  return Number(value || 0).toLocaleString(en ? 'en-US' : 'id-ID');
}

export default function AdminKAMRewards() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [data, setData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ email: '', campaignId: '', amount: '', reason: '' });
  const [campaignForm, setCampaignForm] = useState({
    code: '', name: '', type: 'REFERRAL', status: 'PAUSED', budgetPoints: '', rewardPoints: '', inviteeRewardPoints: '0', startsAt: '', endsAt: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rewardData, campaignData] = await Promise.all([
        kriptoAuth.getAdminKamRewards(),
        kriptoAuth.getKamCampaigns(),
      ]);
      setData(rewardData);
      setCampaigns(campaignData?.campaigns || []);
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

  async function submitCampaign(event) {
    event.preventDefault();
    setCampaignSubmitting(true);
    setError('');
    try {
      const response = await kriptoAuth.createKamCampaign({
        ...campaignForm,
        budgetPoints: Number(campaignForm.budgetPoints),
        rewardPoints: Number(campaignForm.rewardPoints),
        inviteeRewardPoints: campaignForm.type === 'REFERRAL' ? Number(campaignForm.inviteeRewardPoints || 0) : 0,
        startsAt: campaignForm.startsAt || null,
        endsAt: campaignForm.endsAt || null,
      });
      setCampaigns(response?.campaigns || []);
      setCampaignForm({ code: '', name: '', type: 'REFERRAL', status: 'PAUSED', budgetPoints: '', rewardPoints: '', inviteeRewardPoints: '0', startsAt: '', endsAt: '' });
    } catch (err) {
      setError(err?.message || (en ? 'Campaign could not be created.' : 'Campaign belum dapat dibuat.'));
    } finally {
      setCampaignSubmitting(false);
    }
  }

  async function setCampaignStatus(code, status) {
    setError('');
    try {
      const response = await kriptoAuth.updateKamCampaignStatus(code, status);
      setCampaigns(response?.campaigns || []);
    } catch (err) {
      setError(err?.message || (en ? 'Campaign status could not be updated.' : 'Status campaign belum dapat diperbarui.'));
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
                  ? 'Controlled off-chain KAM Points distribution, campaign budgets, referral qualification and admin audit records.'
                  : 'Distribusi KAM Points off-chain terkontrol, budget campaign, kualifikasi referral, dan catatan audit admin.'}
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

        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="ka-surface p-5 lg:col-span-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10"><CalendarDays className="h-5 w-5 text-violet-300" /></div>
              <div>
                <h2 className="font-bold">{en ? 'Create reward campaign' : 'Buat campaign reward'}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{en ? 'Define budget, schedule, type and reward amounts before activating.' : 'Tetapkan budget, jadwal, tipe, dan jumlah reward sebelum diaktifkan.'}</p>
              </div>
            </div>

            <form onSubmit={submitCampaign} className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required value={campaignForm.code} onChange={(e) => setCampaignForm({ ...campaignForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-violet-400" placeholder="REF2026" />
                <select value={campaignForm.type} onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value, inviteeRewardPoints: e.target.value === 'REFERRAL' ? campaignForm.inviteeRewardPoints : '0' })} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-violet-400">
                  <option value="REFERRAL">REFERRAL</option>
                  <option value="COMMUNITY">COMMUNITY</option>
                </select>
              </div>
              <input required maxLength={120} value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-violet-400" placeholder={en ? 'Campaign name' : 'Nama campaign'} />
              <div className="grid grid-cols-3 gap-3">
                <input required min="1" type="number" value={campaignForm.budgetPoints} onChange={(e) => setCampaignForm({ ...campaignForm, budgetPoints: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none" placeholder="Budget" />
                <input required min="1" max="100000" type="number" value={campaignForm.rewardPoints} onChange={(e) => setCampaignForm({ ...campaignForm, rewardPoints: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none" placeholder={campaignForm.type === 'REFERRAL' ? 'Referrer' : 'Reward'} />
                <input disabled={campaignForm.type !== 'REFERRAL'} min="0" max="100000" type="number" value={campaignForm.inviteeRewardPoints} onChange={(e) => setCampaignForm({ ...campaignForm, inviteeRewardPoints: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none disabled:opacity-40" placeholder="Invitee" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[10px] text-slate-500">{en ? 'Starts' : 'Mulai'}<input type="datetime-local" value={campaignForm.startsAt} onChange={(e) => setCampaignForm({ ...campaignForm, startsAt: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-xs text-white" /></label>
                <label className="text-[10px] text-slate-500">{en ? 'Ends' : 'Selesai'}<input type="datetime-local" value={campaignForm.endsAt} onChange={(e) => setCampaignForm({ ...campaignForm, endsAt: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-xs text-white" /></label>
              </div>
              <select value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm">
                <option value="PAUSED">PAUSED</option>
                <option value="ACTIVE">ACTIVE</option>
              </select>
              <button disabled={campaignSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-extrabold text-white hover:bg-violet-400 disabled:opacity-50">
                <Gift className="h-4 w-4" /> {campaignSubmitting ? (en ? 'Creating…' : 'Membuat…') : (en ? 'Create Campaign' : 'Buat Campaign')}
              </button>
            </form>
          </div>

          <div className="ka-surface overflow-hidden lg:col-span-7">
            <div className="border-b border-slate-800 p-5">
              <h2 className="font-bold">{en ? 'Campaign Management' : 'Pengelolaan Campaign'}</h2>
              <p className="mt-1 text-xs text-slate-500">{en ? 'Activate, pause or permanently close reward campaigns.' : 'Aktifkan, jeda, atau tutup campaign reward secara permanen.'}</p>
            </div>
            <div className="max-h-[620px] overflow-auto">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border-b border-slate-800/70 p-4 last:border-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{campaign.name}</p>
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px] font-bold text-slate-400">{campaign.type}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${campaign.status === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-300' : campaign.status === 'PAUSED' ? 'bg-amber-400/10 text-amber-300' : 'bg-slate-700/50 text-slate-400'}`}>{campaign.status}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">{campaign.code}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button disabled={campaign.status === 'CLOSED'} onClick={() => setCampaignStatus(campaign.code, 'ACTIVE')} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300 disabled:opacity-30" title="Active"><Play className="h-3.5 w-3.5" /></button>
                      <button disabled={campaign.status === 'CLOSED'} onClick={() => setCampaignStatus(campaign.code, 'PAUSED')} className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-2 text-amber-300 disabled:opacity-30" title="Pause"><Pause className="h-3.5 w-3.5" /></button>
                      <button disabled={campaign.status === 'CLOSED'} onClick={() => setCampaignStatus(campaign.code, 'CLOSED')} className="rounded-lg border border-slate-600 bg-slate-800 p-2 text-slate-300 disabled:opacity-30" title="Close"><CircleStop className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl bg-slate-950/45 p-2.5"><p className="text-[9px] text-slate-600">Budget</p><p className="text-xs font-bold">{formatNumber(campaign.budgetPoints, en)}</p></div>
                    <div className="rounded-xl bg-slate-950/45 p-2.5"><p className="text-[9px] text-slate-600">Distributed</p><p className="text-xs font-bold">{formatNumber(campaign.distributedPoints, en)}</p></div>
                    <div className="rounded-xl bg-slate-950/45 p-2.5"><p className="text-[9px] text-slate-600">Remaining</p><p className="text-xs font-bold text-cyan-300">{formatNumber(campaign.remainingPoints, en)}</p></div>
                    <div className="rounded-xl bg-slate-950/45 p-2.5"><p className="text-[9px] text-slate-600">Reward</p><p className="text-xs font-bold">{formatNumber(campaign.rewardPoints, en)}{campaign.type === 'REFERRAL' && campaign.inviteeRewardPoints ? ` + ${formatNumber(campaign.inviteeRewardPoints, en)}` : ''}</p></div>
                  </div>
                </div>
              ))}
              {!loading && !campaigns.length && <div className="p-8 text-center text-sm text-slate-500">{en ? 'No campaigns yet.' : 'Belum ada campaign.'}</div>}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="ka-surface p-5 lg:col-span-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10"><Gift className="h-5 w-5 text-amber-300" /></div>
              <div>
                <h2 className="font-bold">{en ? 'Manual campaign reward' : 'Reward campaign manual'}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{en ? 'One grant per campaign ID per user. Repeated submissions are blocked.' : 'Satu reward per campaign ID untuk setiap pengguna. Pengiriman berulang akan diblokir.'}</p>
              </div>
            </div>
            <form onSubmit={submitReward} className="mt-5 space-y-4">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-cyan-400" placeholder="user@example.com" />
              <div className="grid grid-cols-2 gap-3">
                <input required value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-cyan-400" placeholder="KAM2026" />
                <input required min="1" max="100000" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-cyan-400" placeholder="100" />
              </div>
              <textarea required maxLength={160} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-cyan-400" placeholder={en ? 'Verified community contribution' : 'Kontribusi komunitas terverifikasi'} />
              <button disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-extrabold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                <ShieldCheck className="h-4 w-4" /> {submitting ? (en ? 'Processing…' : 'Memproses…') : (en ? 'Grant KAM Points' : 'Berikan KAM Points')}
              </button>
            </form>
            {result && <div className={`mt-4 rounded-xl border p-3 ${result.awarded ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-amber-400/20 bg-amber-400/5'}`}><div className="flex gap-2">{result.awarded ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />}<p className="text-xs leading-relaxed text-slate-300">{result.awarded ? `${formatNumber(result?.points?.balance, en)} KAM Points — ${en ? 'reward recorded successfully.' : 'reward berhasil dicatat.'}` : (en ? 'Duplicate prevented: this user already received this campaign reward.' : 'Duplikasi dicegah: pengguna ini sudah menerima reward campaign tersebut.')}</p></div></div>}
          </div>

          <div className="ka-surface overflow-hidden lg:col-span-7">
            <div className="border-b border-slate-800 p-5"><h2 className="font-bold">{en ? 'Recent KAM Points activity' : 'Aktivitas KAM Points terbaru'}</h2><p className="mt-1 text-xs text-slate-500">{en ? 'Latest 50 ledger records.' : '50 catatan ledger terbaru.'}</p></div>
            <div className="max-h-[640px] overflow-auto">
              {(data?.recent || []).map((row) => <div key={row.id} className="border-b border-slate-800/70 p-4 last:border-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{row.fullName || row.email}</p><p className="truncate text-xs text-slate-500">{row.email}</p></div><span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-xs font-extrabold text-emerald-300">+{formatNumber(row.amount, en)}</span></div><p className="mt-2 text-xs leading-relaxed text-slate-300">{row.reason}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600"><span>{row.source}</span>{row.metadata?.campaignId && <span>Campaign: {row.metadata.campaignId}</span>}<span>{new Date(row.createdAt).toLocaleString(en ? 'en-US' : 'id-ID')}</span></div></div>)}
              {!loading && !(data?.recent || []).length && <div className="p-8 text-center text-sm text-slate-500">{en ? 'No reward activity yet.' : 'Belum ada aktivitas reward.'}</div>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" /><p className="text-xs leading-relaxed text-slate-400">{en ? 'KAM Points remain off-chain, non-transferable and non-redeemable. Referral rewards require a valid referral registration plus verified email and approved KYC; creating or sharing a referral code alone does not earn points.' : 'KAM Points tetap off-chain, tidak dapat ditransfer dan belum dapat ditukar. Reward referral memerlukan registrasi referral yang sah ditambah email terverifikasi dan KYC approved; sekadar membuat atau membagikan kode referral tidak menghasilkan poin.'}</p></div></section>
      </div>
    </div>
  );
}

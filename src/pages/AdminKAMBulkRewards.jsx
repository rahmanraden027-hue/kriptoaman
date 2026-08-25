import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, Gift, ShieldCheck, Users } from 'lucide-react';
import { kriptoAuth } from '@/lib/kriptoAuth';

function fmt(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

export default function AdminKAMBulkRewards() {
  const [form, setForm] = useState({ campaignId: 'MAULID1448', segment: 'EXISTING_BEFORE', cutoff: '2026-08-25T17:00' });
  const [preview, setPreview] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const canExecute = useMemo(() => Boolean(
    preview?.budgetSufficient && preview?.pendingUsers > 0 && confirmation.trim().toUpperCase() === form.campaignId.trim().toUpperCase()
  ), [preview, confirmation, form.campaignId]);

  async function runPreview(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const data = await kriptoAuth.previewBulkKamCampaignReward({
        campaignId: form.campaignId.trim(),
        segment: form.segment,
        cutoff: new Date(form.cutoff).toISOString(),
      });
      setPreview(data);
      setConfirmation('');
    } catch (err) {
      setPreview(null);
      setError(err?.message || 'Preview bulk reward gagal.');
    } finally {
      setBusy(false);
    }
  }

  async function executeBulk() {
    if (!canExecute) return;
    setBusy(true);
    setError('');
    try {
      const data = await kriptoAuth.executeBulkKamCampaignReward({
        campaignId: form.campaignId.trim(),
        segment: form.segment,
        cutoff: new Date(form.cutoff).toISOString(),
        confirmation: confirmation.trim(),
      });
      setResult(data);
      setPreview(null);
      setConfirmation('');
    } catch (err) {
      setError(err?.message || 'Distribusi bulk reward gagal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <section className="ka-surface p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><ShieldCheck className="h-5 w-5 text-cyan-300" /></div>
            <div>
              <p className="text-[10px] font-black tracking-[.2em] text-cyan-300">KAM BULK REWARD CONTROL</p>
              <h1 className="mt-1 text-2xl font-extrabold">Distribusi Massal KAM Points</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">Selalu lakukan preview terlebih dahulu. Sistem memakai reward dari campaign, mencegah duplikasi per pengguna, membatasi budget, dan mencatat audit admin. KAM Points bersifat off-chain.</p>
            </div>
          </div>
        </section>

        <form onSubmit={runPreview} className="ka-surface space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-400">Campaign ID
              <input required value={form.campaignId} onChange={(e) => { setForm({ ...form, campaignId: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }); setPreview(null); }} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-white" />
            </label>
            <label className="text-xs text-slate-400">Segmen pengguna
              <select value={form.segment} onChange={(e) => { setForm({ ...form, segment: e.target.value }); setPreview(null); }} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-white">
                <option value="EXISTING_BEFORE">Pengguna terdahulu — dibuat sebelum cutoff</option>
                <option value="NEW_FROM">Pengguna baru — dibuat mulai cutoff</option>
              </select>
            </label>
          </div>
          <label className="block text-xs text-slate-400">Cutoff waktu
            <input required type="datetime-local" value={form.cutoff} onChange={(e) => { setForm({ ...form, cutoff: e.target.value }); setPreview(null); }} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-white" />
          </label>
          <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-extrabold text-slate-950 disabled:opacity-50"><Eye className="h-4 w-4" />{busy ? 'Memeriksa…' : 'Preview / Dry Run'}</button>
        </form>

        {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}

        {preview && (
          <section className="ka-surface space-y-4 p-5">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><h2 className="font-extrabold">Hasil Preview</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-950/45 p-3"><p className="text-[10px] text-slate-500">Eligible</p><p className="text-xl font-black">{fmt(preview.eligibleUsers)}</p></div>
              <div className="rounded-xl bg-slate-950/45 p-3"><p className="text-[10px] text-slate-500">Belum menerima</p><p className="text-xl font-black">{fmt(preview.pendingUsers)}</p></div>
              <div className="rounded-xl bg-slate-950/45 p-3"><p className="text-[10px] text-slate-500">Reward / user</p><p className="text-xl font-black">{fmt(preview.rewardPoints)}</p></div>
              <div className="rounded-xl bg-slate-950/45 p-3"><p className="text-[10px] text-slate-500">Dibutuhkan</p><p className="text-xl font-black">{fmt(preview.requiredPoints)}</p></div>
            </div>
            <div className={`rounded-xl border p-4 text-sm ${preview.budgetSufficient ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-red-400/20 bg-red-400/10 text-red-200'}`}>
              Budget tersisa: <strong>{fmt(preview.remainingPoints)}</strong> KAM Points · {preview.budgetSufficient ? 'cukup untuk distribusi ini.' : 'tidak cukup — eksekusi diblokir.'}
            </div>
            {preview.sample?.length > 0 && <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Sampel penerima preview</p>{preview.sample.map((user) => <div key={user.id} className="border-t border-slate-800/60 py-2 text-xs text-slate-400 first:border-0">{user.email} · {user.createdAt}</div>)}</div>}
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="text-xs leading-relaxed text-amber-200">Eksekusi akan menulis ledger secara nyata. Ketik Campaign ID persis untuk konfirmasi. Jalankan hanya setelah angka preview sesuai dengan daftar penerima yang Anda maksud.</p>
              <input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder={`Ketik ${form.campaignId}`} className="mt-3 w-full rounded-xl border border-amber-400/20 bg-slate-950/70 px-3 py-3 text-sm text-white" />
              <button type="button" onClick={executeBulk} disabled={!canExecute || busy} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><Gift className="h-4 w-4" />Distribusikan KAM Points</button>
            </div>
          </section>
        )}

        {result && <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-300" /><h2 className="font-extrabold text-emerald-200">Distribusi selesai</h2></div><p className="mt-2 text-sm text-emerald-100">{fmt(result.awardedUsers)} pengguna menerima total {fmt(result.distributedPoints)} KAM Points. Duplikasi dicegah untuk {fmt(result.duplicatePrevented)} pengguna.</p></section>}
      </div>
    </div>
  );
}

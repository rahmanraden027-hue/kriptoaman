import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileCheck2, Fingerprint, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { useLanguage } from '@/lib/LanguageContext';

function n(value, en) { return Number(value || 0).toLocaleString(en ? 'en-US' : 'id-ID'); }

export default function AdminKAMSnapshotApproval() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [snapshots, setSnapshots] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await kriptoAuth.getKamSnapshotReadiness();
      const list = data?.snapshots || [];
      setSnapshots(list);
      if (!selectedId && list[0]) setSelectedId(list[0].id);
    } catch (err) { setError(err?.message || (en ? 'Approval data unavailable.' : 'Data approval belum tersedia.')); }
    finally { setLoading(false); }
  }, [en, selectedId]);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(() => snapshots.find((s) => s.id === selectedId) || null, [snapshots, selectedId]);

  async function verify() {
    if (!selectedId) return;
    setWorking(true); setError('');
    try { const r = await kriptoAuth.verifyKamAuditSnapshot(selectedId); setVerification(r?.verification || null); }
    catch (err) { setError(err?.message || 'Integrity verification failed'); }
    finally { setWorking(false); }
  }

  async function act(action) {
    if (!selectedId || !notes.trim()) { setError(en ? 'Notes are required.' : 'Catatan wajib diisi.'); return; }
    setWorking(true); setError('');
    try {
      if (action === 'review') await kriptoAuth.reviewKamAuditSnapshot(selectedId, notes.trim());
      else await kriptoAuth.approveKamAuditSnapshot(selectedId, notes.trim());
      setNotes(''); setVerification(null); await load();
    } catch (err) { setError(err?.message || (en ? 'Approval action failed.' : 'Tindakan approval gagal.')); }
    finally { setWorking(false); }
  }

  const status = selected?.approval?.status || 'DRAFT';

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-cyan-400/15 bg-[#071423]/90 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-extrabold tracking-[0.22em] text-cyan-300">KAM SNAPSHOT GOVERNANCE</p><h1 className="mt-1 text-2xl font-extrabold">{en ? 'Snapshot Approval Gate' : 'Gerbang Persetujuan Snapshot'}</h1><p className="mt-2 max-w-3xl text-sm text-slate-400">{en ? 'Audit-only dual-control workflow: DRAFT → REVIEWED → APPROVED. Approval never mints, transfers or distributes tokens.' : 'Alur dual-control khusus audit: DRAFT → REVIEWED → APPROVED. Persetujuan tidak melakukan mint, transfer, atau distribusi token.'}</p></div>
            <button onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-200"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{en ? 'Refresh' : 'Perbarui'}</button>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="ka-surface p-5 lg:col-span-5">
            <label className="text-xs font-semibold text-slate-400">{en ? 'Snapshot' : 'Snapshot'}
              <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setVerification(null); }} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-white">
                <option value="">—</option>{snapshots.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.approval?.status || 'DRAFT'}</option>)}
              </select>
            </label>

            {selected && <div className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-xs">
              <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><span className={`rounded-full px-2.5 py-1 font-extrabold ${status === 'APPROVED' ? 'bg-emerald-400/10 text-emerald-300' : status === 'REVIEWED' ? 'bg-amber-400/10 text-amber-300' : 'bg-slate-700/60 text-slate-300'}`}>{status}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Accounts</span><strong>{n(selected.totalUsers, en)}</strong></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">KAM Points</span><strong>{n(selected.totalPoints, en)}</strong></div>
              <p className="break-all font-mono text-[10px] text-slate-600">{selected.manifestHash}</p>
              {selected.approval?.reviewerEmail && <p className="text-slate-400">Reviewer: {selected.approval.reviewerEmail}</p>}
              {selected.approval?.approverEmail && <p className="text-slate-400">Approver: {selected.approval.approverEmail}</p>}
              {selected.approval?.lockedAt && <p className="flex items-center gap-1.5 text-emerald-300"><LockKeyhole className="h-3.5 w-3.5" />{en ? 'Locked after approval' : 'Dikunci setelah approval'}</p>}
            </div>}

            <button onClick={verify} disabled={!selectedId || working} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-200 disabled:opacity-40"><Fingerprint className="h-4 w-4" />{en ? 'Verify Integrity' : 'Verifikasi Integritas'}</button>
            {verification && <div className={`mt-3 rounded-xl border p-3 text-xs ${verification.integrityOk ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300' : 'border-red-400/20 bg-red-400/5 text-red-300'}`}>{verification.integrityOk ? 'INTEGRITY OK' : 'INTEGRITY FAILED'} · {n(verification.calculatedUsers, en)} accounts · {n(verification.calculatedPoints, en)} points</div>}
          </div>

          <div className="ka-surface p-5 lg:col-span-7">
            <div className="flex items-start gap-3"><div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-3"><FileCheck2 className="h-5 w-5 text-violet-300" /></div><div><h2 className="font-bold">{en ? 'Governance action' : 'Tindakan governance'}</h2><p className="mt-1 text-xs text-slate-400">{en ? 'Review requires integrity OK. Final approval requires a different admin than the reviewer.' : 'Review memerlukan integrity OK. Approval final harus dilakukan admin yang berbeda dari reviewer.'}</p></div></div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder={en ? 'Reviewer / approver notes…' : 'Catatan reviewer / approver…'} className="mt-5 min-h-32 w-full rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm outline-none focus:border-violet-400" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button onClick={() => act('review')} disabled={!selectedId || status === 'APPROVED' || working} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-extrabold text-slate-950 disabled:opacity-40"><ShieldCheck className="h-4 w-4" />{en ? 'Mark REVIEWED' : 'Tandai REVIEWED'}</button>
              <button onClick={() => act('approve')} disabled={!selectedId || status !== 'REVIEWED' || working} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-extrabold text-slate-950 disabled:opacity-40"><CheckCircle2 className="h-4 w-4" />{en ? 'Final APPROVE' : 'APPROVE Final'}</button>
            </div>
            <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/5 p-3 text-xs leading-relaxed text-slate-400">{en ? 'Dual-control is enforced server-side. The same account cannot review and approve the same snapshot. An approved snapshot is locked as an audit record.' : 'Dual-control dipaksakan di server. Akun yang sama tidak dapat mereview dan meng-approve snapshot yang sama. Snapshot APPROVED dikunci sebagai catatan audit.'}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

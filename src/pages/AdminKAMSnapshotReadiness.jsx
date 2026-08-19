import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Fingerprint, RefreshCw, ShieldCheck, Snowflake, GitCompareArrows } from 'lucide-react';
import { kriptoAuth } from '@/lib/kriptoAuth';
import { useLanguage } from '@/lib/LanguageContext';

function formatNumber(value, en) {
  return Number(value || 0).toLocaleString(en ? 'en-US' : 'id-ID');
}

export default function AdminKAMSnapshotReadiness() {
  const { language } = useLanguage();
  const en = language === 'en';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [verification, setVerification] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [code, setCode] = useState('');
  const [baseSnapshotId, setBaseSnapshotId] = useState('');
  const [targetSnapshotId, setTargetSnapshotId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await kriptoAuth.getKamSnapshotReadiness();
      setData(response);
      const snapshots = response?.snapshots || [];
      if (!targetSnapshotId && snapshots[0]) setTargetSnapshotId(snapshots[0].id);
      if (!baseSnapshotId && snapshots[1]) setBaseSnapshotId(snapshots[1].id);
    } catch (err) {
      setError(err?.message || (en ? 'Snapshot readiness data could not be loaded.' : 'Data kesiapan snapshot belum dapat dimuat.'));
    } finally { setLoading(false); }
  }, [en, baseSnapshotId, targetSnapshotId]);

  useEffect(() => { load(); }, [load]);

  const preview = data?.preview;
  const snapshots = data?.snapshots || [];
  const cards = useMemo(() => ([
    { label: en ? 'Eligible accounts' : 'Akun eligible', value: preview?.totals?.eligibleAccounts, icon: CheckCircle2 },
    { label: en ? 'Eligible KAM Points' : 'KAM Points eligible', value: preview?.totals?.eligiblePoints, icon: Database },
    { label: en ? 'Excluded accounts' : 'Akun dikecualikan', value: preview?.totals?.excludedAccounts, icon: AlertTriangle },
    { label: en ? 'Frozen snapshots' : 'Snapshot dibekukan', value: snapshots.length, icon: Snowflake },
  ]), [snapshots.length, preview, en]);

  async function freeze(event) {
    event.preventDefault();
    setFreezing(true);
    setError('');
    setResult(null);
    try {
      const response = await kriptoAuth.freezeKamPointsAuditSnapshot(code.trim());
      setResult(response?.snapshot || null);
      setCode('');
      await load();
    } catch (err) {
      setError(err?.message || (en ? 'Snapshot could not be frozen.' : 'Snapshot belum dapat dibekukan.'));
    } finally { setFreezing(false); }
  }

  async function verifySnapshot(snapshotId) {
    setChecking(true);
    setError('');
    setVerification(null);
    try {
      const response = await kriptoAuth.verifyKamAuditSnapshot(snapshotId);
      setVerification(response?.verification || null);
    } catch (err) {
      setError(err?.message || (en ? 'Integrity verification failed.' : 'Verifikasi integritas gagal.'));
    } finally { setChecking(false); }
  }

  async function compareSnapshots(event) {
    event.preventDefault();
    if (!baseSnapshotId || !targetSnapshotId || baseSnapshotId === targetSnapshotId) {
      setError(en ? 'Choose two different snapshots.' : 'Pilih dua snapshot yang berbeda.');
      return;
    }
    setChecking(true);
    setError('');
    setComparison(null);
    try {
      const response = await kriptoAuth.compareKamAuditSnapshots(baseSnapshotId, targetSnapshotId);
      setComparison(response?.comparison || null);
    } catch (err) {
      setError(err?.message || (en ? 'Snapshot comparison failed.' : 'Perbandingan snapshot gagal.'));
    } finally { setChecking(false); }
  }

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[#071423]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,.3)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(34,211,238,.14),transparent_28%),radial-gradient(circle_at_5%_100%,rgba(99,102,241,.12),transparent_28%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.22em] text-cyan-300">KAM POINTS AUDIT READINESS</p>
              <h1 className="mt-1 text-2xl font-extrabold">{en ? 'Snapshot Readiness Dashboard' : 'Dashboard Kesiapan Snapshot'}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                {en
                  ? 'Audit-only readiness for off-chain KAM Points, including immutable snapshots, integrity verification and snapshot-to-snapshot comparison.'
                  : 'Kesiapan audit khusus KAM Points off-chain, termasuk snapshot immutable, verifikasi integritas, dan perbandingan antar-snapshot.'}
              </p>
            </div>
            <button onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-200 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {en ? 'Refresh' : 'Perbarui'}
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="ka-surface p-5">
              <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-400">{label}</p><Icon className="h-4 w-4 text-cyan-300" /></div>
              <p className="mt-3 text-2xl font-extrabold">{loading ? '—' : formatNumber(value, en)}</p>
            </div>
          ))}
        </section>

        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="ka-surface p-5 lg:col-span-4">
            <div className="flex items-start gap-3"><div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-3"><Snowflake className="h-5 w-5 text-violet-300" /></div><div><h2 className="font-bold">{en ? 'Freeze audit snapshot' : 'Bekukan snapshot audit'}</h2><p className="mt-1 text-xs text-slate-400">{en ? 'Creates an immutable copy of currently eligible KAM Points balances.' : 'Membuat salinan immutable dari saldo KAM Points yang saat ini eligible.'}</p></div></div>
            <form onSubmit={freeze} className="mt-5 space-y-3">
              <input required minLength={3} maxLength={64} value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="SNAP_2026_01" className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm outline-none focus:border-violet-400" />
              <button disabled={freezing || !preview?.totals?.eligibleAccounts} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-extrabold text-white disabled:opacity-40"><ShieldCheck className="h-4 w-4" />{freezing ? (en ? 'Freezing…' : 'Membekukan…') : (en ? 'Freeze Audit Snapshot' : 'Bekukan Snapshot Audit')}</button>
            </form>
            {result && <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-slate-300"><p className="font-bold text-emerald-300">{result.code} · FROZEN</p><p className="mt-1">{formatNumber(result.totalUsers, en)} {en ? 'accounts' : 'akun'} · {formatNumber(result.totalPoints, en)} KAM Points</p><p className="mt-2 break-all font-mono text-[10px] text-slate-500">SHA-256: {result.manifestHash}</p></div>}
          </div>

          <div className="ka-surface overflow-hidden lg:col-span-8">
            <div className="border-b border-slate-800 p-5"><h2 className="font-bold">{en ? 'Eligibility review' : 'Pemeriksaan eligibility'}</h2><p className="mt-1 text-xs text-slate-500">{en ? 'Accounts requiring review remain outside the frozen snapshot.' : 'Akun yang memerlukan pemeriksaan tetap berada di luar snapshot yang dibekukan.'}</p></div>
            <div className="grid gap-3 border-b border-slate-800 p-4 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(preview?.flagCounts || {}).map(([flag, count]) => <div key={flag} className="rounded-xl bg-slate-950/45 p-3"><p className="text-[9px] text-slate-500">{flag.replaceAll('_', ' ')}</p><p className="mt-1 font-extrabold">{formatNumber(count, en)}</p></div>)}
            </div>
            <div className="max-h-[520px] overflow-auto">
              {(preview?.excluded || []).slice(0, 100).map((row) => (
                <div key={row.userId} className="border-b border-slate-800/70 p-4 last:border-0">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{row.fullName || row.email}</p><p className="truncate text-xs text-slate-500">{row.email}</p></div><span className="shrink-0 text-xs font-bold text-slate-300">{formatNumber(row.points, en)} pts</span></div>
                  <div className="mt-2 flex flex-wrap gap-1.5">{row.flags.map((flag) => <span key={flag} className="rounded-full border border-amber-400/15 bg-amber-400/8 px-2 py-1 text-[9px] font-bold text-amber-300">{flag}</span>)}</div>
                </div>
              ))}
              {!loading && !(preview?.excluded || []).length && <div className="p-8 text-center text-sm text-emerald-300">{en ? 'No accounts require review.' : 'Tidak ada akun yang memerlukan review.'}</div>}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-12">
          <div className="ka-surface p-5 lg:col-span-5">
            <div className="flex items-center gap-2"><GitCompareArrows className="h-4 w-4 text-cyan-300" /><h2 className="font-bold">{en ? 'Snapshot comparison' : 'Perbandingan snapshot'}</h2></div>
            <form onSubmit={compareSnapshots} className="mt-4 space-y-3">
              <label className="block text-[10px] text-slate-500">{en ? 'Base snapshot' : 'Snapshot dasar'}
                <select value={baseSnapshotId} onChange={(e) => setBaseSnapshotId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-white">
                  <option value="">—</option>{snapshots.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </label>
              <label className="block text-[10px] text-slate-500">{en ? 'Target snapshot' : 'Snapshot target'}
                <select value={targetSnapshotId} onChange={(e) => setTargetSnapshotId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-white">
                  <option value="">—</option>{snapshots.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </label>
              <button disabled={checking || snapshots.length < 2} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-200 disabled:opacity-40"><GitCompareArrows className="h-4 w-4" />{en ? 'Compare Snapshots' : 'Bandingkan Snapshot'}</button>
            </form>
            {comparison && <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-950/45 p-3"><p className="text-slate-500">Δ Accounts</p><p className="mt-1 font-extrabold">{comparison.delta.users >= 0 ? '+' : ''}{formatNumber(comparison.delta.users, en)}</p></div>
              <div className="rounded-xl bg-slate-950/45 p-3"><p className="text-slate-500">Δ KAM Points</p><p className="mt-1 font-extrabold">{comparison.delta.points >= 0 ? '+' : ''}{formatNumber(comparison.delta.points, en)}</p></div>
              <div className="rounded-xl bg-slate-950/45 p-3"><p className="text-slate-500">{en ? 'Added' : 'Bertambah'}</p><p className="mt-1 font-extrabold text-emerald-300">{formatNumber(comparison.delta.addedAccounts, en)}</p></div>
              <div className="rounded-xl bg-slate-950/45 p-3"><p className="text-slate-500">{en ? 'Removed' : 'Berkurang'}</p><p className="mt-1 font-extrabold text-amber-300">{formatNumber(comparison.delta.removedAccounts, en)}</p></div>
              <div className="col-span-2 rounded-xl bg-slate-950/45 p-3"><p className="text-slate-500">{en ? 'Changed balances' : 'Saldo berubah'}</p><p className="mt-1 font-extrabold">{formatNumber(comparison.delta.changedAccounts, en)}</p></div>
            </div>}
          </div>

          <div className="ka-surface overflow-hidden lg:col-span-7">
            <div className="border-b border-slate-800 p-5"><h2 className="font-bold">{en ? 'Comparison detail' : 'Detail perbandingan'}</h2><p className="mt-1 text-xs text-slate-500">{comparison ? `${comparison.base.code} → ${comparison.target.code}` : (en ? 'Choose two frozen snapshots.' : 'Pilih dua snapshot yang dibekukan.')}</p></div>
            <div className="max-h-[420px] overflow-auto">
              {(comparison?.changed || []).map((row) => <div key={`c-${row.userId}`} className="border-b border-slate-800/70 p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="truncate font-mono text-slate-400">{row.userId}</span><span className={row.deltaPoints >= 0 ? 'font-bold text-emerald-300' : 'font-bold text-amber-300'}>{row.deltaPoints >= 0 ? '+' : ''}{formatNumber(row.deltaPoints, en)}</span></div><p className="mt-1 text-[10px] text-slate-600">{formatNumber(row.fromPoints, en)} → {formatNumber(row.toPoints, en)} KAM Points</p></div>)}
              {(comparison?.added || []).map((row) => <div key={`a-${row.userId}`} className="border-b border-slate-800/70 p-3 text-xs"><div className="flex items-center justify-between"><span className="truncate font-mono text-slate-400">{row.userId}</span><span className="font-bold text-emerald-300">+ACCOUNT</span></div><p className="mt-1 text-[10px] text-slate-600">{formatNumber(row.points, en)} KAM Points</p></div>)}
              {(comparison?.removed || []).map((row) => <div key={`r-${row.userId}`} className="border-b border-slate-800/70 p-3 text-xs"><div className="flex items-center justify-between"><span className="truncate font-mono text-slate-400">{row.userId}</span><span className="font-bold text-amber-300">REMOVED</span></div><p className="mt-1 text-[10px] text-slate-600">{formatNumber(row.points, en)} KAM Points</p></div>)}
              {comparison && !comparison.delta.addedAccounts && !comparison.delta.removedAccounts && !comparison.delta.changedAccounts && <div className="p-8 text-center text-sm text-emerald-300">{en ? 'No account-level differences.' : 'Tidak ada perbedaan pada tingkat akun.'}</div>}
            </div>
          </div>
        </section>

        <section className="ka-surface overflow-hidden">
          <div className="border-b border-slate-800 p-5"><div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan-300" /><h2 className="font-bold">{en ? 'Frozen snapshot history & integrity' : 'Riwayat snapshot & integritas'}</h2></div></div>
          {verification && <div className={`m-4 rounded-xl border p-4 text-xs ${verification.integrityOk ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-red-400/20 bg-red-400/5'}`}><p className={`font-bold ${verification.integrityOk ? 'text-emerald-300' : 'text-red-300'}`}>{verification.code}: {verification.integrityOk ? 'INTEGRITY OK' : 'INTEGRITY MISMATCH'}</p><div className="mt-2 grid gap-2 sm:grid-cols-3"><span>Hash: {verification.checks.hashMatch ? 'MATCH' : 'MISMATCH'}</span><span>Users: {verification.checks.userCountMatch ? 'MATCH' : 'MISMATCH'}</span><span>Points: {verification.checks.pointsMatch ? 'MATCH' : 'MISMATCH'}</span></div><p className="mt-2 break-all font-mono text-[10px] text-slate-500">Calculated SHA-256: {verification.calculatedHash}</p></div>}
          <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-slate-950/40 text-slate-500"><tr><th className="p-3">Code</th><th className="p-3">Users</th><th className="p-3">KAM Points</th><th className="p-3">Rule</th><th className="p-3">Manifest SHA-256</th><th className="p-3">Created</th><th className="p-3">Integrity</th></tr></thead><tbody>{snapshots.map((snapshot) => <tr key={snapshot.id} className="border-t border-slate-800"><td className="p-3 font-bold text-white">{snapshot.code}</td><td className="p-3">{formatNumber(snapshot.totalUsers, en)}</td><td className="p-3">{formatNumber(snapshot.totalPoints, en)}</td><td className="p-3">v{snapshot.ruleVersion}</td><td className="max-w-[260px] truncate p-3 font-mono text-[10px] text-slate-500" title={snapshot.manifestHash}>{snapshot.manifestHash}</td><td className="p-3 text-slate-500">{new Date(snapshot.createdAt).toLocaleString(en ? 'en-US' : 'id-ID')}</td><td className="p-3"><button disabled={checking} onClick={() => verifySnapshot(snapshot.id)} className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-bold text-cyan-200 disabled:opacity-40">{en ? 'Verify' : 'Verifikasi'}</button></td></tr>)}</tbody></table></div>
        </section>

        <section className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" /><p className="text-xs leading-relaxed text-slate-400">{en ? 'This module is an internal audit record only. Integrity verification and snapshot comparison do not create a token entitlement, conversion, market value, redemption, or distribution.' : 'Modul ini hanya catatan audit internal. Verifikasi integritas dan perbandingan snapshot tidak menciptakan hak token, konversi, nilai pasar, redemption, atau distribusi.'}</p></div></section>
      </div>
    </div>
  );
}

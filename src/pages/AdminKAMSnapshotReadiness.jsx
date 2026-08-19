import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Fingerprint, RefreshCw, ShieldCheck, Snowflake } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [code, setCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setData(await kriptoAuth.getKamSnapshotReadiness()); }
    catch (err) { setError(err?.message || (en ? 'Snapshot readiness data could not be loaded.' : 'Data kesiapan snapshot belum dapat dimuat.')); }
    finally { setLoading(false); }
  }, [en]);

  useEffect(() => { load(); }, [load]);

  const preview = data?.preview;
  const cards = useMemo(() => ([
    { label: en ? 'Eligible accounts' : 'Akun eligible', value: preview?.totals?.eligibleAccounts, icon: CheckCircle2 },
    { label: en ? 'Eligible KAM Points' : 'KAM Points eligible', value: preview?.totals?.eligiblePoints, icon: Database },
    { label: en ? 'Excluded accounts' : 'Akun dikecualikan', value: preview?.totals?.excludedAccounts, icon: AlertTriangle },
    { label: en ? 'Frozen snapshots' : 'Snapshot dibekukan', value: data?.snapshots?.length, icon: Snowflake },
  ]), [data, preview, en]);

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
                  ? 'Audit-only readiness for off-chain KAM Points. Frozen snapshots are immutable records with a SHA-256 manifest hash and do not mint, transfer, redeem or distribute tokens.'
                  : 'Kesiapan audit khusus KAM Points off-chain. Snapshot yang dibekukan menjadi catatan immutable dengan SHA-256 manifest hash dan tidak melakukan mint, transfer, redemption, atau distribusi token.'}
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

        <section className="ka-surface overflow-hidden">
          <div className="border-b border-slate-800 p-5"><div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan-300" /><h2 className="font-bold">{en ? 'Frozen snapshot history' : 'Riwayat snapshot dibekukan'}</h2></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-950/40 text-slate-500"><tr><th className="p-3">Code</th><th className="p-3">Users</th><th className="p-3">KAM Points</th><th className="p-3">Rule</th><th className="p-3">Manifest SHA-256</th><th className="p-3">Created</th></tr></thead><tbody>{(data?.snapshots || []).map((snapshot) => <tr key={snapshot.id} className="border-t border-slate-800"><td className="p-3 font-bold text-white">{snapshot.code}</td><td className="p-3">{formatNumber(snapshot.totalUsers, en)}</td><td className="p-3">{formatNumber(snapshot.totalPoints, en)}</td><td className="p-3">v{snapshot.ruleVersion}</td><td className="max-w-[260px] truncate p-3 font-mono text-[10px] text-slate-500" title={snapshot.manifestHash}>{snapshot.manifestHash}</td><td className="p-3 text-slate-500">{new Date(snapshot.createdAt).toLocaleString(en ? 'en-US' : 'id-ID')}</td></tr>)}</tbody></table></div>
        </section>

        <section className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" /><p className="text-xs leading-relaxed text-slate-400">{en ? 'This module is an internal audit record only. Eligibility in a snapshot is not a promise of token conversion, market value, listing, redemption, or distribution.' : 'Modul ini hanya catatan audit internal. Status eligible dalam snapshot bukan janji konversi token, nilai pasar, listing, redemption, atau distribusi.'}</p></div></section>
      </div>
    </div>
  );
}

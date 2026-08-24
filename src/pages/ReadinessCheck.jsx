import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock3, Database, Network, ShieldCheck, Server, Radio, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CHECKS = [
  { id: 'market', label: 'Database Pasar', icon: Database },
  { id: 'networks', label: 'Jaringan Publik', icon: Network },
  { id: 'auth', label: 'Autentikasi', icon: ShieldCheck },
  { id: 'kyc', label: 'KYC Readiness', icon: Server },
  { id: 'kam', label: 'KAM RPC', icon: Radio },
];

const STATUS_COPY = {
  verified: { label: 'Terverifikasi', className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  limited: { label: 'Terbatas', className: 'text-amber-300 bg-amber-300/10 border-amber-300/20' },
  pending: { label: 'Belum Diverifikasi', className: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
};

async function readJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { ...options, cache: 'no-store', signal: controller.signal });
    const payload = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, payload };
  } finally {
    clearTimeout(timer);
  }
}

function buildEvidence(results) {
  const market = results.market?.payload;
  const networks = results.networks?.payload;
  const kyc = results.kyc?.payload;
  const kam = results.kam?.payload;
  const auth = results.auth;

  return {
    market: {
      state: results.market?.ok && market?.healthy && Number(market?.assetCount) >= 4500 ? 'verified' : 'limited',
      value: Number.isFinite(Number(market?.assetCount)) ? Number(market.assetCount).toLocaleString('id-ID') : '—',
      detail: market?.source ? `Snapshot ${market.source} · target sehat ≥4.500 aset nyata` : 'Health snapshot belum tersedia',
      checkedAt: market?.capturedAt || null,
    },
    networks: {
      state: results.networks?.ok && Number(networks?.summary?.online) >= 12 ? 'verified' : 'limited',
      value: Number.isFinite(Number(networks?.summary?.online)) ? `${networks.summary.online}/${networks.summary.total}` : '—',
      detail: 'Status berasal dari probe endpoint/RPC yang merespons pada pemeriksaan terakhir',
      checkedAt: networks?.checked_at || null,
    },
    auth: {
      state: auth && [200, 401].includes(auth.status) ? 'verified' : 'limited',
      value: auth && [200, 401].includes(auth.status) ? 'Reachable' : '—',
      detail: auth?.status === 200 ? 'Endpoint autentikasi merespons dengan sesi aktif' : auth?.status === 401 ? 'Endpoint autentikasi merespons dan menolak sesi anonim sesuai desain' : 'Endpoint autentikasi belum terverifikasi',
      checkedAt: Date.now(),
    },
    kyc: {
      state: results.kyc?.ok && kyc?.ready === true ? 'verified' : 'pending',
      value: kyc?.ready === true ? 'Ready' : 'Belum Diverifikasi',
      detail: kyc?.ready === true ? 'Database, session, API, workflow, dan webhook Didit terkonfigurasi' : 'Konfigurasi KYC belum seluruhnya lolos readiness check',
      checkedAt: Date.now(),
    },
    kam: {
      state: results.kam?.ok && kam?.verified === true && kam?.chainId === 22028 ? 'verified' : 'limited',
      value: kam?.verified === true ? `Block ${Number(kam.blockNumber || 0).toLocaleString('id-ID')}` : '—',
      detail: kam?.verified === true ? `Chain ID ${kam.chainId} · status ${kam.status}` : 'RPC KAM belum terverifikasi pada pemeriksaan ini',
      checkedAt: kam?.checkedAt || null,
    },
  };
}

export default function ReadinessCheck() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [evidence, setEvidence] = useState(null);
  const [error, setError] = useState('');

  const runAudit = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        setAuthorized(false);
        return;
      }
      setAuthorized(true);

      const [market, networks, kyc, kam, auth] = await Promise.all([
        readJson('/api/market-snapshot?health=1'),
        readJson('/api/network-health'),
        readJson('/api/kyc/readiness'),
        readJson('/api/kam/network-status'),
        readJson('/api/auth/me', { credentials: 'include' }),
      ]);

      setEvidence(buildEvidence({ market, networks, kyc, kam, auth }));
    } catch (err) {
      setError(err?.message || 'Audit live belum dapat diselesaikan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAudit(); }, []);

  const summary = useMemo(() => {
    if (!evidence) return { verified: 0, total: CHECKS.length, score: 0 };
    const verified = CHECKS.filter((item) => evidence[item.id]?.state === 'verified').length;
    return { verified, total: CHECKS.length, score: Math.round((verified / CHECKS.length) * 100) };
  }, [evidence]);

  if (!loading && !authorized) {
    return <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center p-6">Admin access required</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20 pb-28">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="rounded-3xl border border-sky-400/15 bg-slate-900/70 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[.2em] text-sky-400">KRIPTOAMAN OPERATIONS</p>
              <h1 className="mt-2 text-3xl font-black">Verified System Readiness</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Status dihitung dari evidence live yang dapat diperiksa saat halaman dibuka. Klaim regulasi, sertifikasi, performa, custody, atau kapasitas yang belum memiliki evidence terhubung tidak dihitung sebagai selesai.</p>
            </div>
            <button onClick={runAudit} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 text-sm font-bold text-sky-300 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Audit Ulang
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4"><div className="text-3xl font-black">{loading ? '…' : `${summary.score}%`}</div><div className="mt-1 text-xs text-slate-400">Evidence verified</div></div>
            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4"><div className="text-3xl font-black text-emerald-400">{summary.verified}</div><div className="mt-1 text-xs text-slate-400">Terverifikasi</div></div>
            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4"><div className="text-3xl font-black">{summary.total}</div><div className="mt-1 text-xs text-slate-400">Pemeriksaan inti</div></div>
            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4"><div className="text-lg font-black text-amber-300">mainnet-candidate</div><div className="mt-1 text-xs text-slate-400">KAM publication state</div></div>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CHECKS.map(({ id, label, icon: Icon }) => {
            const item = evidence?.[id];
            const status = STATUS_COPY[item?.state || 'pending'];
            return (
              <div key={id} className="rounded-3xl border border-slate-700/70 bg-slate-900/65 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10"><Icon className="h-5 w-5 text-sky-400" /></div><h2 className="font-bold">{label}</h2></div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}>{loading ? 'Memeriksa…' : status.label}</span>
                </div>
                <div className="mt-5 text-2xl font-black">{loading ? '…' : item?.value || '—'}</div>
                <p className="mt-2 min-h-12 text-xs leading-5 text-slate-400">{item?.detail || 'Belum Diverifikasi'}</p>
                {item?.checkedAt && <p className="mt-3 text-[10px] text-slate-500">Diperiksa: {new Date(item.checkedAt).toLocaleString('id-ID')}</p>}
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-700/70 bg-slate-900/55 p-5">
          <div className="flex items-start gap-3">
            {summary.verified === summary.total ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />}
            <div><h2 className="font-bold">Klasifikasi Evidence</h2><p className="mt-1 text-sm leading-6 text-slate-400">Hijau berarti endpoint atau konfigurasi yang relevan merespons sesuai kriteria audit. “Belum Diverifikasi” berarti bukti belum tersedia pada pemeriksaan ini; itu tidak otomatis berarti fitur gagal. KAM tetap berstatus kandidat mainnet dan bukan peluncuran komersial sampai gate produksi diselesaikan.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

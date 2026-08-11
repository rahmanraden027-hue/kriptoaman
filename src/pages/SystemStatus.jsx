import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Server, XCircle } from 'lucide-react';

const SERVICES = [
  { name: 'Aplikasi KriptoAman', url: '/', critical: true },
  { name: 'Data Pasar CoinLore', url: 'https://api.coinlore.net/api/tickers/?start=0&limit=1', critical: true },
  { name: 'Data Pasar CoinGecko', url: 'https://api.coingecko.com/api/v3/ping', critical: false },
  { name: 'Fear & Greed Index', url: 'https://api.alternative.me/fng/?limit=1', critical: false },
];

async function check(url) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  const started = performance.now();
  try {
    const response = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    return { state: response.ok ? 'ok' : 'error', latency: Math.round(performance.now() - started) };
  } catch {
    return { state: 'error', latency: null };
  } finally {
    clearTimeout(timeout);
  }
}

export default function SystemStatus() {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);

  const run = async () => {
    setLoading(true);
    const results = await Promise.all(SERVICES.map(async service => [service.name, await check(service.url)]));
    setStatuses(Object.fromEntries(results));
    setUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  const criticalDown = SERVICES.some(service => service.critical && statuses[service.name]?.state === 'error');
  const anyDown = SERVICES.some(service => statuses[service.name]?.state === 'error');
  const overall = criticalDown ? 'outage' : anyDown ? 'degraded' : 'ok';

  return (
    <main className="ka-bg min-h-screen px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Server className="h-5 w-5 text-ka-emerald" /><div><h1 className="text-xl font-extrabold">Status Sistem</h1><p className="ka-muted text-[11px]">Pemeriksaan langsung dari perangkat Anda</p></div></div>
          <button type="button" onClick={run} className="ka-chip flex items-center gap-1.5 px-3 py-2 text-xs font-bold" aria-label="Periksa ulang status layanan"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Periksa ulang</button>
        </div>

        {!loading && (
          <div className={`ka-surface flex items-center gap-3 p-4 ${overall === 'ok' ? 'border-ka-emerald/30' : overall === 'degraded' ? 'border-yellow-400/30' : 'border-red-400/30'}`}>
            {overall === 'ok' ? <CheckCircle2 className="h-6 w-6 text-ka-emerald" /> : overall === 'degraded' ? <AlertTriangle className="h-6 w-6 text-yellow-400" /> : <XCircle className="h-6 w-6 text-red-400" />}
            <div><p className={`font-bold ${overall === 'ok' ? 'text-ka-emerald' : overall === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`}>{overall === 'ok' ? 'Semua layanan yang diperiksa operasional' : overall === 'degraded' ? 'Sebagian penyedia data sedang terbatas' : 'Layanan utama mengalami gangguan'}</p><p className="ka-muted mt-1 text-[11px]">Status pihak ketiga tidak selalu berarti aplikasi KriptoAman mengalami gangguan.</p></div>
          </div>
        )}

        {updated && <p className="ka-muted text-[11px]">Pemeriksaan terakhir: {updated.toLocaleString('id-ID')}</p>}

        <div className="space-y-2">
          {SERVICES.map(service => {
            const result = statuses[service.name];
            return <div key={service.name} className="ka-surface flex items-center justify-between gap-3 p-4">
              <div><p className="text-sm font-semibold">{service.name}</p><p className="ka-muted mt-1 text-[10px]">{service.critical ? 'Layanan utama' : 'Penyedia pendukung'}</p></div>
              {!result ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : result.state === 'ok' ? <span className="flex items-center gap-1.5 text-xs font-bold text-ka-emerald"><CheckCircle2 className="h-4 w-4" />Operasional{result.latency != null ? ` · ${result.latency} ms` : ''}</span> : <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-400"><AlertTriangle className="h-4 w-4" />Tidak terjangkau</span>}
            </div>;
          })}
        </div>

        <div className="ka-surface p-4"><p className="ka-muted text-[11px] leading-relaxed">Halaman ini adalah pemeriksaan ketersediaan saat ini, bukan rekaman uptime historis atau SLA. Autentikasi dan database tidak diuji dari browser publik untuk menjaga batas keamanan.</p></div>
      </div>
    </main>
  );
}

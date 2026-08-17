import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Server, XCircle } from 'lucide-react';

const FALLBACK_SERVICES = [
  { id: 'app', name: 'Aplikasi KriptoAman', critical: true, state: 'unknown' },
  { id: 'database', name: 'Database & Sesi Akun', critical: true, state: 'unknown' },
  { id: 'coinlore', name: 'Data Pasar CoinLore', critical: true, state: 'unknown' },
  { id: 'coingecko', name: 'Data Pasar CoinGecko', critical: false, state: 'unknown' },
  { id: 'fear-greed', name: 'Fear & Greed Index', critical: false, state: 'unknown' },
];

function statusCopy(state) {
  if (state === 'ok') return 'Operasional';
  if (state === 'error') return 'Tidak terjangkau';
  if (state === 'unconfigured') return 'Belum dikonfigurasi';
  return 'Menunggu pemeriksaan';
}

function statusClass(state) {
  if (state === 'ok') return 'text-ka-emerald';
  if (state === 'error') return 'text-yellow-400';
  if (state === 'unconfigured') return 'text-red-400';
  return 'text-slate-400';
}

export default function SystemStatus() {
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [overall, setOverall] = useState('unknown');
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/health', { cache: 'no-store', headers: { accept: 'application/json' } });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.services) throw new Error('Health endpoint unavailable');
      setServices(payload.services);
      setOverall(payload.overall || 'unknown');
      setUpdated(payload.checked_at ? new Date(payload.checked_at) : new Date());
    } catch {
      setOverall('unknown');
      setError('Pemeriksaan server belum dapat dimuat. Status tidak akan ditebak dari browser.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(); }, []);

  return (
    <main className="ka-bg min-h-screen px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-ka-emerald" />
            <div>
              <h1 className="text-xl font-extrabold">Status Sistem</h1>
              <p className="ka-muted text-[11px]">Pemeriksaan first-party dari server KriptoAman</p>
            </div>
          </div>
          <button type="button" onClick={run} disabled={loading} className="ka-chip flex items-center gap-1.5 px-3 py-2 text-xs font-bold disabled:opacity-60" aria-label="Periksa ulang status layanan">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Periksa ulang
          </button>
        </div>

        {!loading && overall !== 'unknown' && (
          <div className={`ka-surface flex items-center gap-3 p-4 ${overall === 'ok' ? 'border-ka-emerald/30' : overall === 'degraded' ? 'border-yellow-400/30' : 'border-red-400/30'}`}>
            {overall === 'ok' ? <CheckCircle2 className="h-6 w-6 text-ka-emerald" /> : overall === 'degraded' ? <AlertTriangle className="h-6 w-6 text-yellow-400" /> : <XCircle className="h-6 w-6 text-red-400" />}
            <div>
              <p className={`font-bold ${overall === 'ok' ? 'text-ka-emerald' : overall === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`}>
                {overall === 'ok' ? 'Semua layanan utama operasional' : overall === 'degraded' ? 'Layanan utama normal, sebagian penyedia pendukung terbatas' : 'Salah satu layanan utama membutuhkan perhatian'}
              </p>
              <p className="ka-muted mt-1 text-[11px]">Penyedia pihak ketiga dipisahkan dari kesehatan aplikasi dan database KriptoAman.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="ka-surface border-yellow-400/30 p-4 text-xs text-yellow-300">{error}</div>
        )}

        {updated && <p className="ka-muted text-[11px]">Pemeriksaan terakhir: {updated.toLocaleString('id-ID')}</p>}

        <div className="space-y-2">
          {services.map(service => (
            <div key={service.id || service.name} className="ka-surface flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">{service.name}</p>
                <p className="ka-muted mt-1 text-[10px]">{service.critical ? 'Layanan utama' : 'Penyedia pendukung'}</p>
              </div>
              {loading && service.state === 'unknown' ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : (
                <span className={`flex items-center gap-1.5 text-xs font-bold ${statusClass(service.state)}`}>
                  {service.state === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : service.state === 'error' || service.state === 'unconfigured' ? <AlertTriangle className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
                  {statusCopy(service.state)}
                  {service.latency_ms != null && service.state === 'ok' ? ` · ${service.latency_ms} ms` : ''}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="ka-surface p-4">
          <p className="ka-muted text-[11px] leading-relaxed">Status ini berasal dari endpoint server KriptoAman, sehingga kegagalan CORS pada browser tidak lagi salah ditafsirkan sebagai gangguan layanan. Tidak ada secret, token, isi database, atau data pengguna yang dikirim ke halaman status.</p>
        </div>
      </div>
    </main>
  );
}

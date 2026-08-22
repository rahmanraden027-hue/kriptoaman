import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Server, XCircle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const FALLBACK_SERVICES = [
  { id: 'app', name: 'KriptoAman App', critical: true, state: 'unknown' },
  { id: 'database', name: 'Database & Account Sessions', critical: true, state: 'unknown' },
  { id: 'coinlore', name: 'CoinLore Market Data', critical: true, state: 'unknown' },
  { id: 'coingecko', name: 'CoinGecko Market Data', critical: false, state: 'unknown' },
  { id: 'fear-greed', name: 'Fear & Greed Index', critical: false, state: 'unknown' },
];

const COPY = {
  id: {
    title: 'Status Sistem',
    subtitle: 'Pemeriksaan first-party dari server KriptoAman',
    refresh: 'Periksa ulang',
    operational: 'Operasional',
    unreachable: 'Tidak terjangkau',
    unconfigured: 'Belum dikonfigurasi',
    pending: 'Menunggu pemeriksaan',
    allOk: 'Semua layanan utama operasional',
    degraded: 'Layanan utama normal, sebagian penyedia pendukung terbatas',
    attention: 'Salah satu layanan utama membutuhkan perhatian',
    providerNote: 'Penyedia pihak ketiga dipisahkan dari kesehatan aplikasi dan database KriptoAman.',
    loadError: 'Pemeriksaan server belum dapat dimuat. Status tidak akan ditebak dari browser.',
    lastChecked: 'Pemeriksaan terakhir',
    core: 'Layanan utama',
    support: 'Penyedia pendukung',
    privacy: 'Status berasal dari endpoint server KriptoAman. Tidak ada secret, token, isi database, atau data pengguna yang dikirim ke halaman status.',
  },
  en: {
    title: 'System Status',
    subtitle: 'First-party health checks from KriptoAman servers',
    refresh: 'Refresh status',
    operational: 'Operational',
    unreachable: 'Unreachable',
    unconfigured: 'Not configured',
    pending: 'Awaiting check',
    allOk: 'All core services are operational',
    degraded: 'Core services are healthy; some supporting providers are limited',
    attention: 'A core service requires attention',
    providerNote: 'Third-party providers are reported separately from KriptoAman application and database health.',
    loadError: 'Server checks could not be loaded. Browser-side failures are not guessed as service outages.',
    lastChecked: 'Last checked',
    core: 'Core service',
    support: 'Supporting provider',
    privacy: 'Status is sourced from the KriptoAman server health endpoint. No secrets, tokens, database contents, or user data are exposed on this page.',
  },
};

function statusCopy(state, text) {
  if (state === 'ok') return text.operational;
  if (state === 'error') return text.unreachable;
  if (state === 'unconfigured') return text.unconfigured;
  return text.pending;
}

function statusClass(state) {
  if (state === 'ok') return 'text-emerald-300';
  if (state === 'error') return 'text-yellow-300';
  if (state === 'unconfigured') return 'text-red-300';
  return 'text-slate-400';
}

export default function SystemStatus() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const locale = language === 'en' ? 'en-US' : 'id-ID';
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
      setError(text.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(); }, [language]);

  return (
    <main className="ka-bg min-h-screen px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="ka-command-hero p-5 sm:p-6">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10"><Server className="h-5 w-5 text-emerald-300" /></div>
              <div>
                <p className="ka-command-kicker">KRIPTOAMAN SERVICE HEALTH</p>
                <h1 className="mt-1 text-2xl font-black">{text.title}</h1>
                <p className="mt-1 text-xs text-slate-500">{text.subtitle}</p>
              </div>
            </div>
            <button type="button" onClick={run} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 text-xs font-bold text-sky-300 transition hover:bg-sky-500/15 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60" aria-label={text.refresh}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />{text.refresh}
            </button>
          </div>
        </section>

        {!loading && overall !== 'unknown' && (
          <div className={`ka-command-panel flex items-start gap-3 p-4 ${overall === 'ok' ? 'border-emerald-500/25' : overall === 'degraded' ? 'border-yellow-400/25' : 'border-red-400/25'}`}>
            {overall === 'ok' ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-300" /> : overall === 'degraded' ? <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-yellow-300" /> : <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-300" />}
            <div>
              <p className={`font-black ${overall === 'ok' ? 'text-emerald-300' : overall === 'degraded' ? 'text-yellow-300' : 'text-red-300'}`}>
                {overall === 'ok' ? text.allOk : overall === 'degraded' ? text.degraded : text.attention}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{text.providerNote}</p>
            </div>
          </div>
        )}

        {error && <div className="ka-command-panel border-yellow-400/25 p-4 text-xs leading-relaxed text-yellow-200">{error}</div>}
        {updated && <p className="px-1 text-[10px] text-slate-600">{text.lastChecked}: {updated.toLocaleString(locale)}</p>}

        <section className="ka-command-panel overflow-hidden p-0">
          <div className="divide-y divide-slate-800/80">
            {services.map(service => (
              <div key={service.id || service.name} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-200">{service.name}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-600">{service.critical ? text.core : text.support}</p>
                </div>
                {loading && service.state === 'unknown' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" />
                ) : (
                  <span className={`flex shrink-0 items-center gap-1.5 text-xs font-bold ${statusClass(service.state)}`}>
                    {service.state === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : service.state === 'error' || service.state === 'unconfigured' ? <AlertTriangle className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
                    {statusCopy(service.state, text)}
                    {service.latency_ms != null && service.state === 'ok' ? ` · ${service.latency_ms} ms` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-[10px] leading-relaxed text-slate-600">{text.privacy}</div>
      </div>
    </main>
  );
}

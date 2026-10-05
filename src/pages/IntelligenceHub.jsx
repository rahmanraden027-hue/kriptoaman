import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  BrainCircuit,
  Database,
  Gauge,
  Network,
  Radar,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { DATA_STATE, isPositiveDataState, normalizeDataState } from '@/lib/dataState';

const COPY = {
  id: {
    eyebrow: 'KRIPTOAMAN · PRODUCTION INTELLIGENCE',
    title: 'Intelijen Produksi',
    body: 'Market, jaringan, risiko, dan evidence live. Nilai yang tidak terverifikasi tetap UNAVAILABLE.',
    market: 'Intelijen Pasar',
    marketBody: 'Harga, volume, kapitalisasi, pergerakan dan database aset.',
    alerts: 'Pemantauan',
    alertsBody: 'Perubahan penting tanpa eksekusi transaksi.',
    security: 'Risk & Security',
    securityBody: 'Status keamanan akun, sesi dan kontrol perlindungan.',
    network: 'Network Intelligence',
    networkBody: 'RPC, block height, sinkronisasi dan evidence jaringan.',
    research: 'Riset',
    researchBody: 'Konteks pasar dan analisis terstruktur berbasis sumber.',
    principle: 'Evidence rule',
    principleBody: 'Setiap insight harus memiliki sumber, freshness, atau status sistem yang dapat diperiksa.',
    open: 'Buka',
    unavailable: 'UNAVAILABLE',
  },
  en: {
    eyebrow: 'KRIPTOAMAN · PRODUCTION INTELLIGENCE',
    title: 'Production Intelligence',
    body: 'Live markets, networks, risk and evidence. Unverified values remain UNAVAILABLE.',
    market: 'Market Intelligence',
    marketBody: 'Price, volume, market cap, movement and asset database.',
    alerts: 'Monitoring',
    alertsBody: 'Meaningful changes without transaction execution.',
    security: 'Risk & Security',
    securityBody: 'Account, session and protection-control status.',
    network: 'Network Intelligence',
    networkBody: 'RPC, block height, synchronization and network evidence.',
    research: 'Research',
    researchBody: 'Source-aware market context and structured analysis.',
    principle: 'Evidence rule',
    principleBody: 'Every insight must expose a source, freshness timestamp, or inspectable system state.',
    open: 'Open',
    unavailable: 'UNAVAILABLE',
  },
};

export default function IntelligenceHub() {
  const { language } = useLanguage();
  const t = COPY[language] || COPY.id;
  const locale = language === 'en' ? 'en-US' : 'id-ID';
  const [snapshot, setSnapshot] = useState({
    assets: null,
    networks: null,
    block: null,
    marketState: 'checking',
    networkState: 'checking',
    checkedAt: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/platform-status', {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Platform status unavailable');
        return response.json();
      })
      .then((payload) => {
        const market = payload?.components?.market || {};
        const networks = payload?.components?.networks || {};
        const kam = payload?.components?.kam || {};
        const assets = Number(market.assetCount);
        const online = Number(networks.online);
        const block = Number(kam.blockNumber);
        setSnapshot({
          assets: Number.isFinite(assets) && assets > 0 ? assets : null,
          networks: Number.isFinite(online) && online >= 0 ? online : null,
          block: Number.isSafeInteger(block) && block >= 0 ? block : null,
          marketState: market.status || 'unavailable',
          networkState: kam.status || 'unavailable',
          checkedAt: payload.generatedAt || kam.checkedAt || market.capturedAt || null,
        });
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') {
          setSnapshot((current) => ({ ...current, marketState: 'unavailable', networkState: 'unavailable' }));
        }
      });
    return () => controller.abort();
  }, []);

  const modules = [
    { icon: TrendingUp, title: t.market, body: t.marketBody, to: '/Market', tone: 'sky' },
    { icon: Network, title: t.network, body: t.networkBody, to: '/KAMNetwork', tone: 'violet' },
    { icon: ShieldCheck, title: t.security, body: t.securityBody, to: '/SecurityHub', tone: 'emerald' },
    { icon: BellRing, title: t.alerts, body: t.alertsBody, to: '/Alerts', tone: 'cyan' },
    { icon: Radar, title: t.research, body: t.researchBody, to: '/MarketResearch', tone: 'blue' },
  ];

  const tones = {
    sky: 'border-sky-400/20 bg-sky-500/[0.06] text-sky-300',
    cyan: 'border-cyan-400/20 bg-cyan-500/[0.06] text-cyan-300',
    emerald: 'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-300',
    violet: 'border-violet-400/20 bg-violet-500/[0.06] text-violet-300',
    blue: 'border-blue-400/20 bg-blue-500/[0.06] text-blue-300',
  };

  const metrics = [
    ['MARKET ASSETS', snapshot.assets != null ? snapshot.assets.toLocaleString(locale) : '—', snapshot.marketState],
    ['ZVQ BLOCK', snapshot.block != null ? '#' + snapshot.block.toLocaleString(locale) : '—', snapshot.networkState],
    ['VERIFIED NETWORKS', snapshot.networks != null ? snapshot.networks.toLocaleString(locale) : '—', snapshot.networks != null ? 'operational' : 'unavailable'],
    ['CHECKED AT', snapshot.checkedAt ? new Date(snapshot.checkedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '—', snapshot.checkedAt ? 'verified' : 'unavailable'],
  ];

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-7xl space-y-4 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-6">
          <div className="relative z-10">
            <p className="ka-command-kicker"><BrainCircuit className="h-3.5 w-3.5" /> {t.eyebrow}</p>
            <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">{t.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t.body}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[560px]">
                {metrics.map(([label, value, state]) => {
                  const displayState = normalizeDataState(state, DATA_STATE.UNAVAILABLE);
                  const positive = isPositiveDataState(displayState);
                  return (
                    <div key={label} className="rounded-2xl border border-white/[0.07] bg-black/20 px-3 py-3">
                      <p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p>
                      <p className="mt-1.5 truncate text-base font-black">{value}</p>
                      <p className={'mt-1 text-[8px] font-black uppercase ' + (positive ? 'text-emerald-300' : displayState === DATA_STATE.UNAVAILABLE ? 'text-amber-300' : 'text-cyan-300')}>
                        {displayState}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 xl:grid-cols-5">
          {modules.map(({ icon: Icon, title, body, to, tone }) => (
            <Link key={title} to={to} className="ka-surface ka-surface-hover group flex min-h-[104px] flex-col p-3.5 sm:min-h-[118px] sm:p-4">
              <div className={'flex h-9 w-9 items-center justify-center rounded-xl border ' + tones[tone]}>
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="mt-3 text-sm font-extrabold tracking-[-0.02em] sm:text-base">{title}</h2>
              <p className="mt-1 hidden flex-1 text-[10px] leading-4 text-slate-400 sm:block">{body}</p>
              <span className="mt-2 inline-flex items-center gap-2 text-[9px] font-bold text-sky-300">
                {t.open} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </section>

        <section className="ka-surface p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold">{t.principle}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t.principleBody}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[9px] font-bold text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-cyan-300" /> SOURCE · FRESHNESS · STATE
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

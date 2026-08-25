import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BellRing,
  BrainCircuit,
  Database,
  Gauge,
  Globe2,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const COPY = {
  id: {
    eyebrow: 'KRIPTOAMAN 2.0 · INTELLIGENCE',
    title: 'Pusat Intelijen Aset Digital',
    body: 'Satu ruang kerja untuk membaca pasar, risiko, jaringan, dan keamanan dengan sumber data yang dapat ditelusuri. Tidak ada harga atau sinyal sintetis.',
    source: 'Source-aware',
    freshness: 'Freshness-aware',
    watch: 'Watch-only',
    market: 'Intelijen Pasar',
    marketBody: 'Harga, volume, kapitalisasi, pergerakan pasar, dan riset aset dari pipeline data KriptoAman.',
    alerts: 'Peringatan & Pemantauan',
    alertsBody: 'Pantau perubahan penting tanpa mengubah aset atau menjalankan transaksi.',
    security: 'Risk & Security',
    securityBody: 'Baca status keamanan akun, sesi, dan kontrol perlindungan dari Security Center.',
    network: 'Network Intelligence',
    networkBody: 'Pantau status jaringan dan kesiapan infrastruktur menggunakan data yang benar-benar tersedia.',
    research: 'Riset',
    researchBody: 'Konteks pasar dan analisis terstruktur untuk membantu memahami perubahan, bukan menjanjikan hasil.',
    principle: 'Prinsip KriptoAman Intelligence',
    principleBody: 'Setiap insight harus dapat ditelusuri ke sumber, waktu pembaruan, atau status sistem. Jika data belum tersedia, antarmuka harus menyatakannya dengan jelas.',
    open: 'Buka',
  },
  en: {
    eyebrow: 'KRIPTOAMAN 2.0 · INTELLIGENCE',
    title: 'Digital Asset Intelligence Center',
    body: 'One workspace for markets, risk, networks, and security with traceable data sources. No synthetic prices or fabricated signals.',
    source: 'Source-aware',
    freshness: 'Freshness-aware',
    watch: 'Watch-only',
    market: 'Market Intelligence',
    marketBody: 'Price, volume, market cap, market movement, and asset research from the KriptoAman data pipeline.',
    alerts: 'Alerts & Monitoring',
    alertsBody: 'Monitor meaningful changes without modifying assets or executing transactions.',
    security: 'Risk & Security',
    securityBody: 'Review account, session, and protection controls from the Security Center.',
    network: 'Network Intelligence',
    networkBody: 'Monitor network status and infrastructure readiness using data that is actually available.',
    research: 'Research',
    researchBody: 'Structured market context and analysis to improve understanding, not promise outcomes.',
    principle: 'KriptoAman Intelligence Principle',
    principleBody: 'Every insight should be traceable to a source, freshness timestamp, or system status. When data is unavailable, the interface should say so clearly.',
    open: 'Open',
  },
};

export default function IntelligenceHub() {
  const { language } = useLanguage();
  const t = COPY[language] || COPY.id;

  const modules = [
    { icon: TrendingUp, title: t.market, body: t.marketBody, to: '/Market', tone: 'sky' },
    { icon: BellRing, title: t.alerts, body: t.alertsBody, to: '/Alerts', tone: 'cyan' },
    { icon: ShieldCheck, title: t.security, body: t.securityBody, to: '/SecurityHub', tone: 'emerald' },
    { icon: Network, title: t.network, body: t.networkBody, to: '/KAMNetwork', tone: 'violet' },
    { icon: Radar, title: t.research, body: t.researchBody, to: '/MarketResearch', tone: 'blue' },
  ];

  const tones = {
    sky: 'border-sky-400/20 bg-sky-500/[0.06] text-sky-300',
    cyan: 'border-cyan-400/20 bg-cyan-500/[0.06] text-cyan-300',
    emerald: 'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-300',
    violet: 'border-violet-400/20 bg-violet-500/[0.06] text-violet-300',
    blue: 'border-blue-400/20 bg-blue-500/[0.06] text-blue-300',
  };

  return (
    <div className="ka-bg min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-7xl space-y-5 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-sky-400/20 bg-[#06101c]/92 p-5 shadow-[0_30px_90px_-44px_rgba(14,165,233,.72)] sm:p-7 lg:p-9">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-28 -top-32 h-80 w-80 rounded-full bg-sky-500/14 blur-3xl" />
            <div className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-cyan-500/8 blur-3xl" />
          </div>
          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-sky-300">
              <Sparkles className="h-3.5 w-3.5" /> {t.eyebrow}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">{t.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{t.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[t.source, t.freshness, t.watch].map((label) => (
                <span key={label} className="ka-chip inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-200">
                  <Activity className="h-3 w-3 text-sky-300" /> {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ icon: Icon, title, body, to, tone }) => (
            <Link key={title} to={to} className="ka-surface ka-surface-hover group flex min-h-[190px] flex-col p-5 sm:p-6">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-extrabold tracking-[-0.02em]">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{body}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-sky-300">
                {t.open} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </section>

        <section className="ka-surface p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">{t.principle}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">{t.principleBody}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3"><Database className="mx-auto h-4 w-4 text-sky-300" /><span className="mt-1 block text-[9px] text-slate-400">Data</span></div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3"><Gauge className="mx-auto h-4 w-4 text-cyan-300" /><span className="mt-1 block text-[9px] text-slate-400">Freshness</span></div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3"><Globe2 className="mx-auto h-4 w-4 text-violet-300" /><span className="mt-1 block text-[9px] text-slate-400">Network</span></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

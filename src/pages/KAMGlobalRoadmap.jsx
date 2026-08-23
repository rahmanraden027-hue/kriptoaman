import React from 'react';
import { ArrowLeft, CheckCircle2, FileDown, FileText, Globe2, Network, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const PDF_URL = '/docs/KriptoAman_KAM_USD29_37_Positive_Confident_Roadmap.pdf';

const COPY = {
  id: {
    badge: 'KAM GLOBAL ROADMAP',
    title: 'KAM Global Growth Scenario & Strategic Roadmap',
    subtitle: 'Membangun Jaringan. Memperluas Utilitas. Menghubungkan Pasar Global.',
    referenceLabel: 'Referensi Skenario Indikatif',
    referenceMeta: 'Kerangka arah pertumbuhan berbasis fundamental',
    marketStatus: 'Status Pasar',
    marketValue: 'Belum Diperdagangkan',
    framework: 'Kerangka Nilai',
    frameworkValue: 'Utility · Adoption · Liquidity · Global Access',
    direction: 'Executive Direction',
    directionBody: 'KAM dikembangkan sebagai aset native KriptoAman Network dengan fokus pada kekuatan infrastruktur, kegunaan jaringan, akses global, likuiditas, adopsi, dan pertumbuhan ekosistem. US$29.37 digunakan sebagai referensi skenario indikatif untuk membaca arah pengembangan berdasarkan pencapaian fundamental.',
    principles: 'Strategic Principles',
    principleItems: [
      ['Infrastructure Excellence', 'Jaringan kuat, validator terdistribusi, RPC aman, explorer, backup, dan observability.'],
      ['Utility Expansion', 'KAM berkembang melalui penggunaan jaringan, layanan, aplikasi, dan integrasi developer.'],
      ['Global Access', 'Integrasi wallet, metadata jaringan, marketplace, dan kanal distribusi internasional.'],
      ['Healthy Liquidity', 'Likuiditas, volume organik, dan sumber harga independen mendukung price discovery.'],
      ['Transparent Growth', 'Governance, vesting, audit trail, dan change control memperkuat disiplin ekosistem.'],
    ],
    scenarioPositioning: 'Scenario Positioning',
    scenarioPositioningBody: 'Referensi US$29.37 ditempatkan sebagai skenario strategis yang terhubung dengan kemajuan fundamental. Harga pasar aktual akan menggunakan data perdagangan dan likuiditas nyata saat pasar KAM aktif.',
    roadmapTitle: 'KAM Scenario Drivers Roadmap',
    roadmapIntro: 'Delapan pilar pertumbuhan yang memperkuat posisi KAM sebagai aset native dalam ekosistem KriptoAman.',
    columns: ['Fase', 'Milestone Utama', 'Indikator Utama', 'Dampak Strategis'],
    rows: [
      ['Foundation', 'Public mainnet terdistribusi', '4 host produksi, RPC/explorer terlindungi, stabilitas 24 jam+', 'Memperkuat ketahanan jaringan dan standar infrastruktur.'],
      ['Utility', 'KAM aktif untuk biaya dan layanan jaringan', 'Transaksi nyata, aplikasi, integrasi, dokumentasi developer', 'Meningkatkan penggunaan dan kebutuhan utilitas.'],
      ['Access', 'Integrasi wallet dan metadata global', 'Wallet support, registry metadata, kanal verifikasi', 'Memperluas akses pengguna dan developer internasional.'],
      ['Liquidity', 'Likuiditas sehat dan transparan', 'Depth, volume organik, sumber harga independen', 'Mendukung price discovery dan kualitas pasar.'],
      ['Adoption', 'Pertumbuhan pengguna dan developer', 'Aktivitas on-chain, aplikasi aktif, community metrics', 'Memperbesar penggunaan dan jaringan efek.'],
      ['Global', 'Distribusi dan kemitraan internasional', 'Integrasi, store releases, technology partnerships', 'Memperluas jangkauan dan visibilitas global.'],
      ['Governance', 'Treasury dan governance terukur', 'Kebijakan, vesting, audit trail, change control', 'Memperkuat disiplin ekonomi dan kepercayaan.'],
      ['Market', 'Price discovery berbasis pasar nyata', 'Trading aktif dan likuiditas dari venue terverifikasi', 'Mengaktifkan harga pasar aktual berbasis demand dan supply.'],
    ],
    growthFocus: 'Growth Focus',
    growthFocusBody: 'Infrastruktur, utilitas, akses, likuiditas, adopsi, distribusi global, governance, dan market readiness bergerak sebagai satu kerangka penguatan fundamental KAM.',
    globalFramework: 'KAM Global Growth Framework',
    globalFrameworkBody: 'KriptoAman menempatkan KAM dalam kerangka pertumbuhan jangka panjang yang menggabungkan teknologi, utilitas, adopsi, likuiditas, tata kelola, dan ekspansi global.',
    pillars: [
      ['Technology', 'Mainnet stabil, validator terdistribusi, RPC aman, explorer, observability.'],
      ['Utility', 'Fee jaringan, layanan aplikasi, developer ecosystem, dan infrastructure services.'],
      ['Adoption', 'Pertumbuhan pengguna, developer, aplikasi aktif, dan aktivitas on-chain.'],
      ['Liquidity', 'Likuiditas sehat, volume organik, dan data harga independen.'],
      ['Governance', 'Treasury discipline, vesting, audit trail, dan change control.'],
      ['Global', 'Wallet integration, store distribution, partnerships, dan international reach.'],
    ],
    closing: 'KAM dibangun untuk tumbuh bersama kekuatan jaringan, utilitas nyata, akses global, adopsi, dan ekosistem yang berkelanjutan.',
    classification: 'Reference Classification: US$29.37 — Indicative Scenario Reference. Market price akan aktif saat data trading dan likuiditas nyata tersedia.',
    back: 'Kembali ke KAM',
    pdf: 'Baca PDF Resmi',
    milestone: 'Milestone',
    indicator: 'Indikator Utama',
    impact: 'Dampak Strategis',
  },
  en: {
    badge: 'KAM GLOBAL ROADMAP',
    title: 'KAM Global Growth Scenario & Strategic Roadmap',
    subtitle: 'Build the Network. Expand Utility. Connect Global Markets.',
    referenceLabel: 'Indicative Scenario Reference',
    referenceMeta: 'Fundamental growth direction framework',
    marketStatus: 'Market Status',
    marketValue: 'Not Yet Trading',
    framework: 'Value Framework',
    frameworkValue: 'Utility · Adoption · Liquidity · Global Access',
    direction: 'Executive Direction',
    directionBody: 'KAM is being developed as the native asset of KriptoAman Network with focus on infrastructure strength, network utility, global access, liquidity, adoption, and ecosystem growth. US$29.37 is used as an indicative scenario reference for understanding development direction based on fundamental milestones.',
    principles: 'Strategic Principles',
    principleItems: [
      ['Infrastructure Excellence', 'Strong network, distributed validators, secure RPC, explorer, backup, and observability.'],
      ['Utility Expansion', 'KAM grows through network usage, services, applications, and developer integrations.'],
      ['Global Access', 'Wallet integrations, network metadata, marketplaces, and international distribution channels.'],
      ['Healthy Liquidity', 'Liquidity, organic volume, and independent price sources support price discovery.'],
      ['Transparent Growth', 'Governance, vesting, audit trails, and change control strengthen ecosystem discipline.'],
    ],
    scenarioPositioning: 'Scenario Positioning',
    scenarioPositioningBody: 'US$29.37 is positioned as a strategic scenario connected to fundamental progress. Actual market price will use real trading and liquidity data when the KAM market becomes active.',
    roadmapTitle: 'KAM Scenario Drivers Roadmap',
    roadmapIntro: 'Eight growth pillars strengthening KAM as the native asset of the KriptoAman ecosystem.',
    columns: ['Phase', 'Primary Milestone', 'Core Indicator', 'Strategic Impact'],
    rows: [
      ['Foundation', 'Distributed public mainnet', '4 production hosts, protected RPC/explorer, 24h+ stability', 'Strengthens network resilience and infrastructure standards.'],
      ['Utility', 'KAM active for network fees and services', 'Real transactions, applications, integrations, developer documentation', 'Expands usage and utility demand.'],
      ['Access', 'Global wallet and network metadata integrations', 'Wallet support, registry metadata, verification channels', 'Expands international user and developer access.'],
      ['Liquidity', 'Healthy and transparent liquidity', 'Depth, organic volume, independent price sources', 'Supports price discovery and market quality.'],
      ['Adoption', 'User and developer growth', 'On-chain activity, active applications, community metrics', 'Expands usage and network effects.'],
      ['Global', 'International distribution and partnerships', 'Integrations, store releases, technology partnerships', 'Expands global reach and visibility.'],
      ['Governance', 'Measured treasury and governance', 'Policy, vesting, audit trail, change control', 'Strengthens economic discipline and trust.'],
      ['Market', 'Market-based price discovery', 'Active trading and liquidity from verified venues', 'Enables actual market price based on demand and supply.'],
    ],
    growthFocus: 'Growth Focus',
    growthFocusBody: 'Infrastructure, utility, access, liquidity, adoption, global distribution, governance, and market readiness operate as one framework for strengthening KAM fundamentals.',
    globalFramework: 'KAM Global Growth Framework',
    globalFrameworkBody: 'KriptoAman positions KAM within a long-term growth framework combining technology, utility, adoption, liquidity, governance, and global expansion.',
    pillars: [
      ['Technology', 'Stable mainnet, distributed validators, secure RPC, explorer, observability.'],
      ['Utility', 'Network fees, application services, developer ecosystem, and infrastructure services.'],
      ['Adoption', 'Growth in users, developers, active applications, and on-chain activity.'],
      ['Liquidity', 'Healthy liquidity, organic volume, and independent price data.'],
      ['Governance', 'Treasury discipline, vesting, audit trail, and change control.'],
      ['Global', 'Wallet integration, store distribution, partnerships, and international reach.'],
    ],
    closing: 'KAM is built to grow with network strength, real utility, global access, adoption, and a sustainable ecosystem.',
    classification: 'Reference Classification: US$29.37 — Indicative Scenario Reference. Market price becomes active when real trading and liquidity data are available.',
    back: 'Back to KAM',
    pdf: 'Read Official PDF',
    milestone: 'Milestone',
    indicator: 'Core Indicator',
    impact: 'Strategic Impact',
  },
};

export default function KAMGlobalRoadmap() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;

  return (
    <div className="ka-bg min-h-screen pb-24 text-white">
      <main className="mx-auto max-w-6xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="/KAM" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 text-sm font-bold text-slate-200 transition hover:border-sky-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70">
            <ArrowLeft className="h-4 w-4" /> {text.back}
          </a>
          <a href={PDF_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70">
            <FileDown className="h-4 w-4" /> {text.pdf}
          </a>
        </div>

        <section className="ka-command-hero overflow-hidden p-6 sm:p-9">
          <div className="grid gap-7 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-sky-300">
                <Sparkles className="h-4 w-4" /> {text.badge}
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">{text.title}</h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">{text.subtitle}</p>
            </div>
            <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/5 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">{text.referenceLabel}</p>
              <p className="mt-2 text-4xl font-black tracking-[-0.04em]">US$29.37</p>
              <p className="mt-2 text-xs font-semibold text-slate-400">{text.referenceMeta}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            [TrendingUp, text.referenceLabel, 'US$29.37'],
            [Network, text.marketStatus, text.marketValue],
            [Globe2, text.framework, text.frameworkValue],
          ].map(([Icon, label, value]) => (
            <div key={label} className="ka-command-panel p-5">
              <Icon className="h-6 w-6 text-sky-300" />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-black text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="ka-command-panel p-6 sm:p-8">
          <div className="flex items-center gap-3"><FileText className="h-7 w-7 text-sky-300" /><h2 className="text-2xl font-black">{text.direction}</h2></div>
          <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-300">{text.directionBody}</p>
        </section>

        <section>
          <h2 className="text-2xl font-black">{text.principles}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {text.principleItems.map(([title, desc]) => (
              <div key={title} className="ka-command-panel p-5">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <h3 className="mt-3 font-black">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] border border-sky-500/20 bg-sky-500/5 p-6">
          <h2 className="text-xl font-black">{text.scenarioPositioning}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{text.scenarioPositioningBody}</p>
        </section>

        <section>
          <p className="ka-command-kicker">KAM SCENARIO DRIVERS</p>
          <h2 className="mt-1 text-2xl font-black">{text.roadmapTitle}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{text.roadmapIntro}</p>

          <div className="mt-5 grid gap-3 md:hidden">
            {text.rows.map(([phase, milestone, indicator, impact], index) => (
              <article key={phase} className="ka-command-panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">{phase}</span>
                  <span className="text-[10px] font-black text-slate-600">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{text.milestone}</p>
                <h3 className="mt-1 text-base font-black text-white">{milestone}</h3>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-sky-300">{text.indicator}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{indicator}</p>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">{text.impact}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{impact}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 hidden overflow-x-auto rounded-[24px] border border-slate-800 bg-slate-950/35 md:block">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-sky-500/10 text-sky-200">
                <tr>{text.columns.map(col => <th key={col} className="px-4 py-4 font-black">{col}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {text.rows.map(row => (
                  <tr key={row[0]} className="align-top transition hover:bg-white/[0.02]">
                    {row.map((cell, index) => <td key={`${row[0]}-${index}`} className={`px-4 py-4 leading-5 ${index === 0 ? 'font-black text-emerald-300' : 'text-slate-300'}`}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[26px] border border-emerald-400/20 bg-emerald-500/5 p-6">
          <h2 className="text-lg font-black text-emerald-200">{text.growthFocus}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">{text.growthFocusBody}</p>
        </section>

        <section>
          <h2 className="text-2xl font-black">{text.globalFramework}</h2>
          <p className="mt-2 max-w-5xl text-sm leading-7 text-slate-400">{text.globalFrameworkBody}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {text.pillars.map(([title, desc]) => (
              <div key={title} className="ka-command-panel p-5">
                <ShieldCheck className="h-5 w-5 text-sky-300" />
                <h3 className="mt-3 font-black">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ka-command-hero p-6 text-center sm:p-8">
          <p className="mx-auto max-w-4xl text-lg font-black leading-8 text-white">{text.closing}</p>
          <p className="mx-auto mt-4 max-w-4xl text-xs font-semibold leading-6 text-slate-400">{text.classification}</p>
          <a href={PDF_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70">
            <FileDown className="h-4 w-4" /> {text.pdf}
          </a>
        </section>
      </main>
    </div>
  );
}

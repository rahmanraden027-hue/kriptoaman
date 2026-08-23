import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Globe2, Network, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const ALLOCATION = [
  ['Ecosystem & Development', '35%', '350,000,000 KAM'],
  ['Treasury & Strategic Reserve', '20%', '200,000,000 KAM'],
  ['Liquidity & Market Infrastructure', '15%', '150,000,000 KAM'],
  ['Team & Contributors', '15%', '150,000,000 KAM'],
  ['Community & Adoption', '10%', '100,000,000 KAM'],
  ['Strategic Partnerships', '5%', '50,000,000 KAM'],
];

const FALLBACK_REFERENCE = {
  value: 29.37,
  currency: 'USD',
  type: 'internal-scenario-estimate',
  isLiveMarketPrice: false,
};

const COPY = {
  id: {
    badge: 'KAM Economic Framework v1',
    title: 'KAM — Aset Native KriptoAman Network',
    intro: 'KAM dirancang sebagai aset native untuk mendukung infrastruktur dan ekosistem KriptoAman. Halaman ini menyajikan parameter ekonomi v1, arah utility, vesting, dan roadmap dengan pendekatan transparansi.',
    status: 'Status jaringan: Mainnet Candidate',
    candidate: 'Candidate Network',
    chain: 'Chain ID 22028',
    chainMeta: 'Hex 0x560c · EVM-compatible · Target QBFT · Target 4 validator',
    caution: 'Status public/commercial mainnet tidak dinyatakan sebelum seluruh launch-readiness gate memiliki bukti produksi yang lengkap dan ditinjau.',
    referenceLabel: 'Referensi Skenario Indikatif',
    referenceMeta: 'Skenario perencanaan internal · Bukan harga pasar live',
    referenceDisclosure: 'US$29.37 adalah referensi skenario internal untuk perencanaan dan bukan harga listing resmi, target harga, jaminan nilai, penawaran, atau harga pasar live. Nilai ini tidak digunakan untuk market cap, P/L, nilai portofolio, atau ticker live. Harga pasar hanya akan berasal dari perdagangan dan likuiditas nyata.',
    marketStatus: 'Harga pasar: Belum diperdagangkan',
    scenarioKicker: 'KAM SCENARIO DRIVERS',
    scenarioTitle: 'Roadmap fundamental yang dapat memperkuat utilitas dan adopsi KAM',
    scenarioIntro: 'Skenario US$29.37 dibaca sebagai referensi internal yang bergantung pada keberhasilan banyak milestone secara bersamaan. Fokus utama KriptoAman adalah membangun jaringan, utilitas, akses global, likuiditas sehat, dan kepercayaan berbasis bukti.',
    scenarioColumns: ['Fase', 'Milestone', 'Bukti yang Dibutuhkan', 'Relevansi Ekonomi'],
    scenarioNote: 'Milestone berikut dapat memperkuat fundamental KAM, tetapi tidak secara otomatis menghasilkan harga tertentu. Harga pasar hanya terbentuk melalui perdagangan nyata, permintaan, penawaran, dan likuiditas.',
    scenarioDrivers: [
      ['Foundation', 'Public mainnet dengan validator terdistribusi', '4 host produksi terpisah, RPC/explorer terlindungi, stabilitas 24 jam+', 'Meningkatkan ketahanan jaringan dan kredibilitas infrastruktur.'],
      ['Utility', 'KAM digunakan untuk biaya dan layanan jaringan', 'Transaksi nyata, integrasi aplikasi, dokumentasi developer', 'Mendorong kebutuhan utilitas yang berasal dari penggunaan jaringan.'],
      ['Access', 'Integrasi wallet dan metadata jaringan global', 'Wallet support, ChainList/registry metadata, kanal verifikasi resmi', 'Mempermudah akses pengguna dan developer lintas negara.'],
      ['Liquidity', 'Infrastruktur likuiditas yang transparan', 'Pasar nyata, kedalaman order/liquidity, volume organik, sumber harga independen', 'Memungkinkan price discovery yang sehat; tidak menetapkan harga tertentu.'],
      ['Adoption', 'Pertumbuhan pengguna dan developer', 'Aktivitas on-chain, aplikasi aktif, komunitas dan developer metrics', 'Memperluas penggunaan dan relevansi ekosistem.'],
      ['Global', 'Kemitraan dan distribusi internasional', 'Integrasi terverifikasi, store releases, kemitraan teknologi', 'Memperluas jangkauan KAM sebagai aset native ekosistem.'],
      ['Governance', 'Kontrol treasury dan governance bertahap', 'Kebijakan transparan, vesting, audit trail, change control', 'Memperkuat disiplin ekonomi dan kepercayaan jangka panjang.'],
      ['Market', 'Price discovery berbasis pasar nyata', 'Trading dan likuiditas aktual dari venue yang terverifikasi', 'Hanya pada tahap ini harga pasar aktual dapat ditampilkan sebagai market price.'],
    ],
    allocation: 'Allocation v1',
    total: 'Total 100%',
    safeguards: 'Vesting & Economic Safeguards',
    utility: 'Arah Utility',
    roadmapLabel: 'Roadmap 2026–2027',
    roadmapTitle: 'Dari Candidate Network menuju Global Ecosystem',
    transparency: 'Transparency First',
    transparencyBody: 'Tokenomics v1 adalah baseline ekonomi proyek. Perubahan material terhadap supply, allocation, vesting, treasury, burn policy, utility, atau referensi indikatif harus memiliki versioned change record dan persetujuan eksplisit sebelum dinyatakan final.',
    statusCta: 'Lihat System Status',
    roadmap: [
      ['Q3 2026', 'Foundation & Mainnet Candidate', 'Stabilitas jaringan, validator QBFT, RPC gateway, explorer, backup/restore, dan observability.'],
      ['Q3–Q4 2026', 'Tokenomics & Governance', 'Tokenomics v1, kontrol treasury, change-control, risk disclosure, dan metadata integrasi.'],
      ['Q4 2026', 'Developer & Wallet Ecosystem', 'Dokumentasi developer, konfigurasi wallet, contoh integrasi dApp, dan monitoring jaringan.'],
      ['Q4 2026', 'Community & Global Campaign', 'Edukasi teknologi, utility, transparansi, AMA, developer content, dan pertumbuhan komunitas.'],
      ['Gate-based', 'Public Launch Readiness', 'Peluncuran publik hanya setelah stabilitas, keamanan RPC, explorer, validator, governance, dan review yang diperlukan terpenuhi.'],
      ['2027', 'Ecosystem Expansion', 'SDK, aplikasi ekosistem, penguatan infrastruktur, governance bertahap, dan kemitraan internasional.'],
    ],
    vesting: [
      'Team & Contributors: 12-month cliff, lalu linear vesting 36 bulan.',
      'Strategic Partnerships: 6-month cliff, lalu linear vesting 24 bulan.',
      'Treasury, ecosystem, community, dan liquidity mengikuti kontrol milestone/governance.',
      'Tidak ada guaranteed return atau guaranteed price.',
      'Burn mechanism belum aktif dan membutuhkan persetujuan terpisah.',
    ],
    utilities: ['Network transaction fees.','Application & developer ecosystem participation.','Infrastructure services.','Ecosystem incentives.','Future governance functions where technically and legally appropriate.'],
  },
  en: {
    badge: 'KAM Economic Framework v1',
    title: 'KAM — Native Asset of the KriptoAman Network',
    intro: 'KAM is designed as the native asset supporting KriptoAman infrastructure and ecosystem development. This page presents the v1 economic framework, utility direction, vesting, and roadmap with a transparency-first approach.',
    status: 'Network status: Mainnet Candidate',
    candidate: 'Candidate Network',
    chain: 'Chain ID 22028',
    chainMeta: 'Hex 0x560c · EVM-compatible · QBFT target · 4-validator target',
    caution: 'Public or commercial mainnet status will not be claimed until all launch-readiness gates are backed by complete production evidence and review.',
    referenceLabel: 'Indicative Scenario Reference',
    referenceMeta: 'Internal planning scenario · Not a live market price',
    referenceDisclosure: 'US$29.37 is an internal scenario reference for planning only. It is not an official listing price, price target, guaranteed value, offer, or live market price, and it is excluded from market cap, P/L, portfolio valuation, and live tickers. Any market price must come from actual trading and liquidity.',
    marketStatus: 'Market price: Not yet trading',
    scenarioKicker: 'KAM SCENARIO DRIVERS',
    scenarioTitle: 'Fundamental roadmap that can strengthen KAM utility and adoption',
    scenarioIntro: 'The US$29.37 scenario is an internal reference that depends on multiple milestones succeeding together. KriptoAman remains focused on network quality, real utility, global access, healthy liquidity, and evidence-based trust.',
    scenarioColumns: ['Phase', 'Milestone', 'Evidence Required', 'Economic Relevance'],
    scenarioNote: 'These milestones may strengthen KAM fundamentals, but they do not automatically produce any specific price. Market price is formed only by real trading, demand, supply, and liquidity.',
    scenarioDrivers: [
      ['Foundation', 'Public mainnet with distributed validators', '4 separate production hosts, protected RPC/explorer, 24h+ stability', 'Improves network resilience and infrastructure credibility.'],
      ['Utility', 'KAM used for network fees and services', 'Real transactions, app integrations, developer documentation', 'Creates utility demand tied to actual network usage.'],
      ['Access', 'Global wallet and network metadata integrations', 'Wallet support, ChainList/registry metadata, official verification channels', 'Reduces friction for users and developers internationally.'],
      ['Liquidity', 'Transparent liquidity infrastructure', 'Real markets, liquidity depth, organic volume, independent price sources', 'Enables healthy price discovery; it does not set a specific price.'],
      ['Adoption', 'User and developer growth', 'On-chain activity, active applications, community and developer metrics', 'Expands real ecosystem usage and relevance.'],
      ['Global', 'International partnerships and distribution', 'Verified integrations, store releases, technology partnerships', 'Broadens KAM reach as the ecosystem native asset.'],
      ['Governance', 'Progressive treasury and governance controls', 'Transparent policy, vesting, audit trail, change control', 'Strengthens long-term economic discipline and trust.'],
      ['Market', 'Market-based price discovery', 'Actual trading and liquidity from verified venues', 'Only at this stage can an actual market price be displayed as market price.'],
    ],
    allocation: 'Allocation v1',
    total: 'Total 100%',
    safeguards: 'Vesting & Economic Safeguards',
    utility: 'Utility Direction',
    roadmapLabel: 'Roadmap 2026–2027',
    roadmapTitle: 'From Candidate Network to Global Ecosystem',
    transparency: 'Transparency First',
    transparencyBody: 'Tokenomics v1 is the project economic baseline. Material changes to supply, allocation, vesting, treasury, burn policy, utility, or indicative references require a versioned change record and explicit approval before being presented as final.',
    statusCta: 'View System Status',
    roadmap: [
      ['Q3 2026', 'Foundation & Mainnet Candidate', 'Network stability, QBFT validators, RPC gateway, explorer, backup/restore, and observability.'],
      ['Q3–Q4 2026', 'Tokenomics & Governance', 'Tokenomics v1, treasury controls, change control, risk disclosure, and integration metadata.'],
      ['Q4 2026', 'Developer & Wallet Ecosystem', 'Developer documentation, wallet configuration, dApp integration examples, and network monitoring.'],
      ['Q4 2026', 'Community & Global Campaign', 'Technology education, utility, transparency, AMA, developer content, and community growth.'],
      ['Gate-based', 'Public Launch Readiness', 'Public launch only after stability, RPC security, explorer, validator, governance, and required review gates are satisfied.'],
      ['2027', 'Ecosystem Expansion', 'SDKs, ecosystem applications, infrastructure strengthening, progressive governance, and international partnerships.'],
    ],
    vesting: [
      'Team & Contributors: 12-month cliff followed by 36 months of linear vesting.',
      'Strategic Partnerships: 6-month cliff followed by 24 months of linear vesting.',
      'Treasury, ecosystem, community, and liquidity allocations follow milestone/governance controls.',
      'No guaranteed return or guaranteed price.',
      'No burn mechanism is active; any future mechanism requires separate approval.',
    ],
    utilities: ['Network transaction fees.','Application & developer ecosystem participation.','Infrastructure services.','Ecosystem incentives.','Future governance functions where technically and legally appropriate.'],
  },
};

export default function KAM() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [reference, setReference] = useState(FALLBACK_REFERENCE);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/kam/network-status', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : null)
      .then(payload => {
        if (!cancelled && payload?.indicativeListingReference?.isLiveMarketPrice === false) {
          setReference(payload.indicativeListingReference);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const formattedReference = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'id-ID', {
    style: 'currency',
    currency: reference.currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(reference.value ?? 29.37));

  return (
    <div className="ka-bg min-h-screen pb-24 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <section className="ka-command-hero overflow-hidden p-6 sm:p-9">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-sky-300">
                <Sparkles className="h-4 w-4" /> {text.badge}
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">{text.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{text.intro}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-bold sm:text-xs">
                <span className="rounded-xl border border-slate-700 bg-slate-950/45 px-3 py-2">Supply: 1,000,000,000 KAM</span>
                <span className="rounded-xl border border-slate-700 bg-slate-950/45 px-3 py-2">Decimals: 18</span>
                <span className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-amber-300">{text.status}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-[26px] border border-sky-500/20 bg-gradient-to-br from-sky-500/12 via-slate-950/20 to-indigo-500/8 p-6 shadow-[0_24px_70px_-44px_rgba(14,165,233,.8)]">
                <Network className="h-9 w-9 text-sky-300" />
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{text.candidate}</p>
                <p className="mt-1 text-2xl font-black">{text.chain}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{text.chainMeta}</p>
                <p className="mt-5 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3 text-[10px] leading-5 text-amber-200/80">{text.caution}</p>
              </div>

              <div className="rounded-[26px] border border-emerald-400/20 bg-emerald-500/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">{text.referenceLabel}</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">{formattedReference}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-400">{text.referenceMeta}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-300">Scenario</span>
                </div>
                <p className="mt-4 text-[10px] leading-5 text-slate-400">{text.referenceDisclosure}</p>
                <p className="mt-3 text-[10px] font-bold text-amber-300">{text.marketStatus}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ka-command-panel overflow-hidden p-6">
          <p className="ka-command-kicker">{text.scenarioKicker}</p>
          <h2 className="mt-1 text-2xl font-black">{text.scenarioTitle}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">{text.scenarioIntro}</p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-[900px] w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-300">
                <tr>{text.scenarioColumns.map(column => <th key={column} className="px-4 py-3 font-black">{column}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {text.scenarioDrivers.map(([phase, milestone, evidence, relevance]) => (
                  <tr key={`${phase}-${milestone}`} className="align-top">
                    <td className="px-4 py-4 font-black text-sky-300">{phase}</td>
                    <td className="px-4 py-4 font-bold text-white">{milestone}</td>
                    <td className="px-4 py-4 leading-5 text-slate-400">{evidence}</td>
                    <td className="px-4 py-4 leading-5 text-slate-300">{relevance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[10px] leading-5 text-amber-100/80">{text.scenarioNote}</p>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="ka-command-kicker">TOKENOMICS</p><h2 className="mt-1 text-2xl font-black">{text.allocation}</h2></div>
            <div className="text-right text-xs font-semibold text-slate-500">{text.total}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ALLOCATION.map(([name, percent, amount]) => (
              <div key={name} className="ka-command-panel p-5">
                <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-slate-100">{name}</h3><span className="text-xl font-black text-sky-300">{percent}</span></div>
                <p className="mt-4 text-sm font-semibold text-slate-400">{amount}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="ka-command-panel p-6">
            <ShieldCheck className="h-7 w-7 text-emerald-300" />
            <h2 className="mt-4 text-xl font-black">{text.safeguards}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">{text.vesting.map(item => <li key={item}>• {item}</li>)}</ul>
          </div>
          <div className="ka-command-panel p-6">
            <Globe2 className="h-7 w-7 text-sky-300" />
            <h2 className="mt-4 text-xl font-black">{text.utility}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">{text.utilities.map(item => <li key={item}>• {item}</li>)}</ul>
          </div>
        </section>

        <section>
          <p className="ka-command-kicker">{text.roadmapLabel}</p>
          <h2 className="mt-1 text-2xl font-black">{text.roadmapTitle}</h2>
          <div className="mt-5 space-y-3">
            {text.roadmap.map(([time, title, desc], index) => (
              <div key={`${time}-${title}`} className="ka-command-panel grid gap-3 p-5 sm:grid-cols-[130px_1fr]">
                <div className="flex items-center gap-2 text-sm font-black text-sky-300"><CheckCircle2 className="h-4 w-4" />{time}</div>
                <div><h3 className="font-bold text-white">{index + 1}. {title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] border border-sky-500/20 bg-sky-500/5 p-6">
          <h2 className="text-lg font-black">{text.transparency}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{text.transparencyBody}</p>
          <a href="/SystemStatus" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70">{text.statusCta} <ArrowRight className="h-4 w-4" /></a>
        </section>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  FileSearch,
  Globe2,
  LockKeyhole,
  Mail,
  Network,
  Server,
  ShieldCheck,
  Waypoints,
} from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

const SOLUTIONS = [
  {
    icon: Database,
    title: 'Data & Intelligence API',
    description: 'Akses data pasar, monitoring, dan intelligence layer untuk dashboard internal, riset, pemantauan aset digital, dan integrasi aplikasi bisnis.',
    points: ['Integrasi API terukur', 'Kebutuhan data disusun per use case', 'Cocok untuk dashboard dan workflow internal'],
  },
  {
    icon: Server,
    title: 'Dedicated KAM RPC',
    description: 'Endpoint RPC khusus untuk kebutuhan pengembangan, observability, dan aplikasi yang memerlukan kapasitas terpisah dari public RPC.',
    points: ['Kapasitas disesuaikan', 'Monitoring endpoint', 'Dukungan integrasi teknis'],
  },
  {
    icon: Network,
    title: 'Managed Node Infrastructure',
    description: 'Deployment, hardening, monitoring, backup, dan dukungan operasional node untuk institusi serta mitra teknis.',
    points: ['Deployment terstruktur', 'Kontrol akses yang jelas', 'Operational visibility'],
  },
  {
    icon: Waypoints,
    title: 'Web3 Integration',
    description: 'Integrasi wallet, RPC, explorer, smart-contract interface, interoperability, dan konektivitas Web3 untuk produk maupun sistem enterprise.',
    points: ['Scope berbasis kebutuhan', 'Milestone yang dapat diukur', 'Dokumentasi integrasi'],
  },
  {
    icon: ShieldCheck,
    title: 'Security & Network Monitoring',
    description: 'Health check, alerting, RPC consistency, uptime monitoring, dan evidence-oriented reporting untuk meningkatkan visibilitas operasional.',
    points: ['Monitoring terukur', 'Alerting & observability', 'Bukti operasional yang dapat ditinjau'],
  },
  {
    icon: FileSearch,
    title: 'Technical Research & Architecture',
    description: 'Kajian arsitektur blockchain, dokumentasi teknis, readiness assessment, dan dukungan desain sistem untuk tim produk maupun teknologi.',
    points: ['Architecture review', 'Readiness assessment', 'Technical documentation'],
  },
];

const PRINCIPLES = [
  {
    icon: CheckCircle2,
    title: 'Measured by deliverables',
    body: 'Setiap engagement dimulai dari tujuan, ruang lingkup, deliverable, dan indikator keberhasilan yang disepakati.',
  },
  {
    icon: LockKeyhole,
    title: 'Security-first execution',
    body: 'Desain integrasi menempatkan kontrol akses, observability, dokumentasi, dan pengelolaan risiko teknis sebagai fondasi.',
  },
  {
    icon: Activity,
    title: 'Evidence-oriented operations',
    body: 'Status, performa, dan aktivitas teknis dipresentasikan melalui data dan bukti operasional yang dapat ditinjau.',
  },
  {
    icon: Globe2,
    title: 'Built for scalable collaboration',
    body: 'Arsitektur layanan dirancang agar dapat berkembang dari pilot yang terukur menuju penggunaan organisasi yang lebih luas.',
  },
];

const STEPS = [
  ['01', 'Discovery', 'Memahami kebutuhan bisnis, arsitektur saat ini, target penggunaan, dan batasan teknis.'],
  ['02', 'Solution Design', 'Menyusun scope, arsitektur, milestone, deliverable, SLA yang relevan, dan model engagement.'],
  ['03', 'Pilot & Validation', 'Memulai dari pilot yang terukur untuk memvalidasi integrasi, performa, keamanan, dan operasional.'],
  ['04', 'Scale', 'Meningkatkan kapasitas dan cakupan berdasarkan hasil pilot, kebutuhan organisasi, serta evaluasi teknis.'],
];

export default function Enterprise() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-sky-400/30">
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,.19),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,.15),transparent_30%),linear-gradient(to_bottom,rgba(15,23,42,.15),rgba(2,6,23,1))]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <nav className="flex min-h-20 items-center justify-between gap-4 border-b border-white/5">
            <Link to="/" className="flex items-center gap-3" aria-label="KriptoAman home">
              <KriptoAmanLogo size={34} showText={false} animate={false} />
              <span className="text-sm font-black tracking-[0.18em]"><span>KRIPTO</span><span className="text-sky-400">AMAN</span></span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/company" className="hidden min-h-10 items-center rounded-xl px-4 text-xs font-bold text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline-flex">Company Facts</Link>
              <a href="mailto:hello@kriptoaman.com?subject=KriptoAman%20Enterprise%20Inquiry" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 text-xs font-black text-sky-200 transition hover:bg-sky-500/20">
                <Mail className="h-4 w-4" /> Contact Enterprise
              </a>
            </div>
          </nav>

          <div className="grid gap-12 py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                <Building2 className="h-3.5 w-3.5" /> PT Kripto Aman Indonesia · Enterprise
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
                Infrastructure, intelligence, and Web3 capabilities for organizations building with digital assets.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                KriptoAman Enterprise membantu organisasi membangun, mengintegrasikan, dan memantau sistem digital melalui data intelligence, blockchain infrastructure, Web3 integration, security monitoring, serta technical research yang terukur.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="mailto:hello@kriptoaman.com?subject=Enterprise%20Consultation%20-%20KriptoAman" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 text-sm font-black shadow-[0_18px_50px_-24px_rgba(14,165,233,.9)] transition hover:bg-sky-500">
                  Konsultasi Enterprise <ArrowRight className="h-4 w-4" />
                </a>
                <Link to="/KAMNetworkDocs" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/70 px-6 text-sm font-bold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900">
                  Dokumentasi Jaringan
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[32px] border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Enterprise capability layer</p>
                <div className="mt-5 space-y-3">
                  {[
                    ['Data & Intelligence', 'API, market context, monitoring'],
                    ['Blockchain Infrastructure', 'RPC, nodes, network operations'],
                    ['Security & Observability', 'Health, consistency, alerting'],
                    ['Web3 Integration', 'Wallet, explorer, contracts, interoperability'],
                  ].map(([title, detail]) => (
                    <div key={title} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
                      <div>
                        <p className="text-sm font-black text-white">{title}</p>
                        <p className="mt-1 text-xs text-slate-500">{detail}</p>
                      </div>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-sky-400/15 bg-sky-400/5 px-4 py-4 text-xs leading-6 text-slate-400">
                  Engagement dapat dimulai dari pilot terbatas, lalu ditingkatkan berdasarkan kebutuhan, hasil validasi, kapasitas, dan kesepakatan layanan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Enterprise Solutions</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Satu jalur layanan untuk data, jaringan, integrasi, dan operasional.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">Solusi disusun berdasarkan kebutuhan nyata organisasi—bukan paket generik—dengan scope, kapasitas, deliverable, dan tanggung jawab yang didefinisikan sejak awal.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {SOLUTIONS.map(({ icon: Icon, title, description, points }) => (
            <article key={title} className="group rounded-[28px] border border-slate-800 bg-slate-900/55 p-6 transition hover:-translate-y-1 hover:border-sky-400/25 hover:bg-slate-900/80">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              <ul className="mt-5 space-y-2.5">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-xs leading-5 text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/35">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Operating Principles</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Enterprise delivery yang profesional, terukur, dan dapat ditinjau.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">KriptoAman menempatkan kejelasan scope, keamanan, dokumentasi, dan evidence sebagai bagian dari proses delivery—mulai dari pilot hingga skala yang lebih besar.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {PRINCIPLES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
                  <Icon className="h-5 w-5 text-emerald-300" />
                  <h3 className="mt-4 text-base font-black">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Engagement Model</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Mulai kecil. Validasi. Lalu scale dengan bukti.</h2>
          </div>
          <Link to="/research" className="inline-flex items-center gap-2 text-sm font-bold text-sky-300 hover:text-sky-200">Lihat Research & Publications <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-4">
          {STEPS.map(([number, title, body]) => (
            <div key={number} className="rounded-[24px] border border-slate-800 bg-slate-900/50 p-5">
              <p className="text-xs font-black tracking-[0.18em] text-sky-400">{number}</p>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-3 text-xs leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-sky-400/20 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,.18),transparent_38%),linear-gradient(135deg,rgba(15,23,42,.95),rgba(2,6,23,1))] p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">Build with KriptoAman</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Bicarakan kebutuhan enterprise Anda dengan scope yang jelas sejak awal.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Tim Enterprise dapat membahas use case, kebutuhan integrasi, target kapasitas, pilot, technical architecture, serta bentuk dukungan yang relevan untuk organisasi Anda.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a href="mailto:hello@kriptoaman.com?subject=KriptoAman%20Enterprise%20Consultation" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-black transition hover:bg-sky-500">
                <Mail className="h-4 w-4" /> hello@kriptoaman.com
              </a>
              <Link to="/LegalCorporateInformation" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/70 px-5 text-sm font-bold text-slate-200 transition hover:border-slate-500">Legal & Corporate</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-5 text-[11px] leading-6 text-slate-500">
            KriptoAman Enterprise menyediakan layanan teknologi, data, infrastruktur, monitoring, integrasi, dan riset teknis. Informasi pada halaman ini bukan penawaran investasi, bukan layanan perdagangan atau kustodian aset kripto, dan bukan jaminan atas harga, likuiditas, listing, maupun keuntungan aset digital. Aktivitas yang memerlukan izin atau persetujuan khusus mengikuti ketentuan yang berlaku.
          </div>
        </div>
      </section>
    </main>
  );
}

import React from 'react';
import { ArrowRight, CheckCircle2, Globe2, Network, ShieldCheck, Sparkles } from 'lucide-react';

const ALLOCATION = [
  ['Ecosystem & Development', '35%', '350,000,000 KAM'],
  ['Treasury & Strategic Reserve', '20%', '200,000,000 KAM'],
  ['Liquidity & Market Infrastructure', '15%', '150,000,000 KAM'],
  ['Team & Contributors', '15%', '150,000,000 KAM'],
  ['Community & Adoption', '10%', '100,000,000 KAM'],
  ['Strategic Partnerships', '5%', '50,000,000 KAM'],
];

const ROADMAP = [
  ['Q3 2026', 'Foundation & Mainnet Candidate', 'Stabilitas jaringan, validator QBFT, RPC gateway, explorer, backup/restore, dan observability.'],
  ['Q3–Q4 2026', 'Tokenomics & Governance', 'Tokenomics v1, kontrol treasury, change-control, risk disclosure, dan metadata integrasi.'],
  ['Q4 2026', 'Developer & Wallet Ecosystem', 'Dokumentasi developer, konfigurasi wallet, contoh integrasi dApp, dan monitoring jaringan.'],
  ['Q4 2026', 'Community & Global Campaign', 'Edukasi teknologi, utility, transparansi, AMA, developer content, dan pertumbuhan komunitas.'],
  ['Gate-based', 'Public Launch Readiness', 'Peluncuran publik hanya setelah stabilitas, keamanan RPC, explorer, validator, governance, dan review yang diperlukan terpenuhi.'],
  ['2027', 'Ecosystem Expansion', 'SDK, aplikasi ekosistem, penguatan infrastruktur, governance bertahap, dan kemitraan internasional.'],
];

export default function KAM() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-blue-950 text-white pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-900/70 p-6 sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                <Sparkles className="h-4 w-4" /> KAM Economic Framework v1
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">KAM — Native Asset of the KriptoAman Network</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                KAM dirancang sebagai aset native untuk mendukung infrastruktur dan ekosistem KriptoAman. Halaman ini menampilkan parameter ekonomi v1, vesting, utility direction, dan roadmap secara transparan.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs sm:text-sm">
                <span className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2">Supply: 1,000,000,000 KAM</span>
                <span className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2">Decimals: 18</span>
                <span className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-amber-300">Network status: Mainnet candidate</span>
              </div>
            </div>
            <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 to-indigo-500/5 p-6">
              <Network className="h-9 w-9 text-blue-300" />
              <p className="mt-5 text-xs uppercase tracking-[0.18em] text-slate-400">Candidate Network</p>
              <p className="mt-1 text-2xl font-black">Chain ID 22028</p>
              <p className="mt-1 text-sm text-slate-400">Hex 0x560c · QBFT · 4 validators</p>
              <p className="mt-5 text-xs leading-5 text-slate-500">Status publik/commercial mainnet tidak akan dinyatakan sebelum seluruh launch-readiness gate terverifikasi.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">Tokenomics</p><h2 className="mt-1 text-2xl font-black">Allocation v1</h2></div>
            <div className="text-right text-sm text-slate-400">Total 100%</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ALLOCATION.map(([name, percent, amount]) => (
              <div key={name} className="rounded-2xl border border-slate-800 bg-slate-900/65 p-5">
                <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-slate-100">{name}</h3><span className="text-xl font-black text-blue-300">{percent}</span></div>
                <p className="mt-4 text-sm font-semibold text-slate-300">{amount}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6">
            <ShieldCheck className="h-7 w-7 text-emerald-300" />
            <h2 className="mt-4 text-xl font-black">Vesting & Economic Safeguards</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>• Team & Contributors: 12-month cliff, lalu linear vesting 36 bulan.</li>
              <li>• Strategic Partnerships: 6-month cliff, lalu linear vesting 24 bulan.</li>
              <li>• Treasury, ecosystem, community, dan liquidity mengikuti kontrol milestone/governance.</li>
              <li>• Tidak ada guaranteed return atau guaranteed price.</li>
              <li>• Burn mechanism belum aktif dan membutuhkan persetujuan terpisah.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6">
            <Globe2 className="h-7 w-7 text-blue-300" />
            <h2 className="mt-4 text-xl font-black">Utility Direction</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>• Network transaction fees.</li>
              <li>• Application & developer ecosystem participation.</li>
              <li>• Infrastructure services.</li>
              <li>• Ecosystem incentives.</li>
              <li>• Future governance functions where technically and legally appropriate.</li>
            </ul>
          </div>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">Roadmap 2026–2027</p>
          <h2 className="mt-1 text-2xl font-black">From Candidate Network to Global Ecosystem</h2>
          <div className="mt-5 space-y-3">
            {ROADMAP.map(([time, title, desc], index) => (
              <div key={`${time}-${title}`} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:grid-cols-[120px_1fr]">
                <div className="flex items-center gap-2 text-sm font-black text-blue-300"><CheckCircle2 className="h-4 w-4" />{time}</div>
                <div><h3 className="font-bold text-white">{index + 1}. {title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h2 className="text-lg font-black">Transparency First</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Tokenomics v1 berfungsi sebagai baseline ekonomi proyek. Perubahan material terhadap supply, allocation, vesting, treasury, burn policy, atau utility harus melalui versioned change record dan persetujuan eksplisit sebelum dipublikasikan sebagai final.</p>
          <a href="/SystemStatus" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold hover:bg-blue-500">Lihat System Status <ArrowRight className="h-4 w-4" /></a>
        </section>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Radar, Search, ShieldCheck, WalletCards } from 'lucide-react';

const MODULES = [
  {
    icon: BarChart3,
    eyebrow: 'MARKET INTELLIGENCE',
    title: 'Market context',
    desc: 'Harga, momentum, breadth, watchlist, dan provenance data kripto dalam satu jalur analisis.',
    to: '/Market',
    action: 'Open Market',
  },
  {
    icon: Search,
    eyebrow: 'ON-CHAIN INTELLIGENCE',
    title: 'Verify on-chain activity',
    desc: 'Telusuri transaksi, alamat, block, contract, dan evidence yang dapat diverifikasi ke sumber.',
    to: '/IntelligenceHub',
    action: 'Open Intelligence',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'RISK INTELLIGENCE',
    title: 'Risk before action',
    desc: 'Pisahkan fakta, konteks, dan indikator risiko tanpa mengubah data yang tidak tersedia menjadi sinyal palsu.',
    to: '/SecurityHub',
    action: 'Open Security',
  },
  {
    icon: Radar,
    eyebrow: 'DISCOVERY',
    title: 'New asset discovery',
    desc: 'Pantau emerging on-chain activity dan token discovery hanya ketika evidence sumber tersedia.',
    to: '/QoryVExDiscovery',
    action: 'Open Discovery',
  },
];

export default function GLandingBody() {
  return (
    <>
      <section id="fitur" className="px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[.18em] ka-cyan">KRIPTOAMAN INTELLIGENCE MODULES</p>
              <h2 className="ka-sec-title mt-2 text-2xl sm:text-3xl">Empat fungsi utama. Satu alur verifikasi.</h2>
              <p className="ka-text2 mt-3 max-w-2xl text-sm leading-6">Homepage hanya menampilkan fungsi inti. Detail teknis dan diagnostik tetap tersedia di workspace khususnya.</p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black ka-blue">Open Command Center <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <Link key={module.title} to={module.to} className="ka-card group flex min-h-[190px] flex-col p-5 transition-transform hover:-translate-y-0.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl ka-card2">
                    <Icon className="h-[18px] w-[18px] ka-blue" />
                  </span>
                  <p className="mt-5 text-[9px] font-black uppercase tracking-[.14em] ka-cyan">{module.eyebrow}</p>
                  <h3 className="mt-2 text-base font-black ka-text">{module.title}</h3>
                  <p className="ka-text2 mt-2 flex-1 text-[11px] leading-5">{module.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black ka-blue">{module.action} <ArrowRight className="h-3.5 w-3.5" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-blue-400/15 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,.12),transparent_42%),linear-gradient(145deg,rgba(5,18,34,.96),rgba(2,8,17,.98))] p-7 text-center sm:p-9">
          <ShieldCheck className="mx-auto h-7 w-7 ka-blue" />
          <p className="mt-4 text-[9px] font-black uppercase tracking-[.18em] ka-cyan">KRIPTOAMAN COMMAND CENTER</p>
          <h2 className="ka-sec-title mt-2 text-2xl sm:text-3xl">Masuk ke intelligence. Eksekusi tetap terpisah.</h2>
          <p className="ka-text2 mx-auto mt-3 max-w-2xl text-sm leading-6">Analisis pasar dan evidence berada di KriptoAman. Akses wallet ZEVARYQ tetap menjadi gateway terpisah.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/login" className="ka-btn-primary inline-flex items-center justify-center gap-2 px-6 text-sm">Open Intelligence Hub <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/wallet-app" className="ka-btn-outline ka-zvq-outline inline-flex items-center justify-center gap-2 px-6 text-sm">Open ZEVARYQ Wallet <WalletCards className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

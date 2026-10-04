import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  BrainCircuit,
  ExternalLink,
  Radar,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';

const GATEWAYS = [
  {
    icon: BrainCircuit,
    eyebrow: 'EVIDENCE GATEWAY',
    title: 'Intelligence Hub',
    desc: 'Cari wallet, contract, transaction hash, dan block melalui jalur intelligence yang dapat diverifikasi.',
    to: '/IntelligenceHub',
    action: 'Open Intelligence',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'ASSET INTELLIGENCE',
    title: 'Asset Passport',
    desc: 'Mulai dari contract evidence di Intelligence Hub lalu buka passport aset ketika identitas contract tersedia.',
    to: '/IntelligenceHub',
    action: 'Verify an asset',
  },
  {
    icon: Radar,
    eyebrow: 'QORYVEX DISCOVERY',
    title: 'New Token Radar',
    desc: 'Akses discovery token baru hanya ketika first-party on-chain evidence tersedia.',
    to: '/qoryvex/discovery',
    action: 'Open Discovery',
  },
];

const ECOSYSTEM = [
  {
    icon: BrainCircuit,
    label: 'KriptoAman Platform',
    note: 'Crypto intelligence command center',
    to: '/login',
  },
  {
    icon: WalletCards,
    label: 'ZEVARYQ Wallet',
    note: 'Dedicated wallet gateway',
    to: '/wallet-app',
  },
  {
    icon: Radar,
    label: 'QoryVEx',
    note: 'Evidence-gated token discovery',
    to: '/qoryvex/discovery',
  },
];

export default function GLandingProductionGateways() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12" aria-label="KriptoAman production gateways and ecosystem">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <div className="ka-card overflow-hidden p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-2xl">
                <p className="text-[9px] font-black uppercase tracking-[.18em] ka-cyan">PRODUCTION EVIDENCE GATEWAYS</p>
                <h2 className="ka-sec-title mt-2 text-xl sm:text-2xl">Bukti dulu. Analisis setelahnya.</h2>
                <p className="ka-text2 mt-2 text-[11px] leading-5">
                  Homepage tetap ringkas. Detail evidence, asset identity, dan discovery dibuka melalui workspace produksinya.
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-emerald-300">
                NO SYNTHETIC SIGNALS
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {GATEWAYS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="group rounded-2xl border border-blue-400/10 bg-[#06111e]/72 p-4 transition hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-blue-400/[.045]"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-blue-400/15 bg-blue-400/[.06]">
                      <Icon className="h-4 w-4 ka-blue" />
                    </span>
                    <p className="mt-4 text-[8px] font-black uppercase tracking-[.14em] ka-cyan">{item.eyebrow}</p>
                    <h3 className="mt-1.5 text-sm font-black ka-text">{item.title}</h3>
                    <p className="ka-text2 mt-2 text-[10px] leading-5">{item.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[9px] font-black ka-blue">
                      {item.action} <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="ka-card overflow-hidden p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] ka-cyan">ECOSYSTEM DOCK</p>
                <h2 className="ka-sec-title mt-2 text-xl sm:text-2xl">Satu ekosistem. Fungsi tetap terpisah.</h2>
                <p className="ka-text2 mt-2 text-[11px] leading-5">
                  Hanya surface yang sudah mempunyai route produksi aktif yang ditampilkan di sini.
                </p>
              </div>
              <Blocks className="mt-1 h-5 w-5 ka-gold" />
            </div>

            <div className="mt-5 grid gap-2">
              {ECOSYSTEM.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="group flex min-h-[62px] items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] px-4 transition hover:border-blue-300/20 hover:bg-blue-400/[.04]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-400/10 bg-blue-400/[.05]">
                      <Icon className="h-4 w-4 ka-blue" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[11px] ka-text">{item.label}</b>
                      <small className="mt-0.5 block truncate text-[8px] ka-text2">{item.note}</small>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-sky-300" />
                  </Link>
                );
              })}
            </div>

            <a
              href="https://explorer.kriptoaman.com"
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-h-[54px] items-center gap-3 rounded-2xl border border-amber-400/10 bg-amber-400/[.025] px-4 transition hover:border-amber-300/20 hover:bg-amber-400/[.04]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-400/10 bg-amber-400/[.05]">
                <Blocks className="h-4 w-4 ka-gold" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[11px] ka-text">ZEVARYQ Explorer</b>
                <small className="mt-0.5 block truncate text-[8px] ka-text2">Independent block and transaction verification</small>
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

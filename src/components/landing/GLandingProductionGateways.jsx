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

const SURFACES = [
  { icon: BrainCircuit, label: 'Intelligence Hub', note: 'Market · risk · network evidence', to: '/IntelligenceHub' },
  { icon: ShieldCheck, label: 'Asset Passport', note: 'Contract identity and provenance', to: '/IntelligenceHub' },
  { icon: Radar, label: 'QoryVEx Discovery', note: 'First-party new-token evidence', to: '/qoryvex/discovery' },
];

const CORE = [
  { icon: BrainCircuit, label: 'KriptoAman Platform', note: 'Production intelligence workspace', to: '/login' },
  { icon: WalletCards, label: 'ZEVARYQ Wallet', note: 'Dedicated ZVQ wallet surface', to: '/wallet-app' },
  { icon: Radar, label: 'QoryVEx', note: 'Evidence-gated discovery', to: '/qoryvex/discovery' },
];

function RouteRow({ item }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="group flex min-h-[62px] items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] px-4 transition hover:border-blue-300/20 hover:bg-blue-400/[.04]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-400/10 bg-blue-400/[.05]">
        <Icon className="h-4 w-4 ka-blue" />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-xs ka-text">{item.label}</b>
        <small className="mt-0.5 block truncate text-[9px] ka-text2">{item.note}</small>
      </span>
      <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[.05] px-2 py-1 text-[8px] font-black uppercase tracking-[.11em] text-emerald-300 sm:inline">
        ACTIVE ROUTE
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-sky-300" />
    </Link>
  );
}

export default function GLandingProductionGateways() {
  return (
    <section className="px-4 py-8 sm:px-6 sm:py-10" aria-label="KriptoAman production surfaces">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <div className="ka-card overflow-hidden p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] ka-cyan">PRODUCTION SURFACES</p>
                <h2 className="ka-sec-title mt-2 text-xl sm:text-2xl">Langsung ke data dan evidence.</h2>
              </div>
              <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-emerald-300">
                VERIFIED-ONLY UI
              </span>
            </div>
            <div className="mt-5 grid gap-2">
              {SURFACES.map((item) => <RouteRow key={item.label} item={item} />)}
            </div>
          </div>

          <div className="ka-card overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] ka-cyan">CORE ECOSYSTEM</p>
                <h2 className="ka-sec-title mt-2 text-xl sm:text-2xl">Tiga surface inti.</h2>
              </div>
              <Blocks className="h-5 w-5 ka-gold" />
            </div>
            <div className="mt-5 grid gap-2">
              {CORE.map((item) => <RouteRow key={item.label} item={item} />)}
            </div>
            <a
              href="https://explorer.kriptoaman.com"
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-h-[58px] items-center gap-3 rounded-2xl border border-amber-400/10 bg-amber-400/[.025] px-4 transition hover:border-amber-300/20 hover:bg-amber-400/[.04]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-400/10 bg-amber-400/[.05]">
                <Blocks className="h-4 w-4 ka-gold" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[11px] ka-text">ZEVARYQ Explorer</b>
                <small className="mt-0.5 block truncate text-[8px] ka-text2">Blocks · transactions · indexed evidence</small>
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

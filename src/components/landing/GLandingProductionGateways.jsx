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

const CORE = [
  { icon: BrainCircuit, label: 'KriptoAman Platform', note: 'Production intelligence workspace', to: '/login' },
  { icon: WalletCards, label: 'ZEVARYQ Wallet', note: 'Dedicated ZVQ wallet surface', to: '/wallet-app' },
  { icon: Radar, label: 'QoryVEx', note: 'Evidence-gated discovery', to: '/qoryvex/discovery' },
  { icon: Blocks, label: 'ZEVARYQ Explorer', note: 'Blocks · transactions · indexed evidence', href: 'https://explorer.kriptoaman.com' },
];

const DIRECT = [
  { label: 'Intelligence Hub', to: '/IntelligenceHub' },
  { label: 'Asset Passport', to: '/IntelligenceHub' },
  { label: 'System Status', to: '/SystemStatus' },
];

function RouteRow({ item }) {
  const Icon = item.icon;
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-400/10 bg-blue-400/[.05]">
        <Icon className="h-4 w-4 ka-blue" />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-xs ka-text">{item.label}</b>
        <small className="mt-0.5 block truncate text-[10px] ka-text2">{item.note}</small>
      </span>
      <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[.05] px-2 py-1 text-[8px] font-black uppercase tracking-[.11em] text-emerald-300 sm:inline">
        ACTIVE ROUTE
      </span>
      {item.href
        ? <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        : <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-sky-300" />}
    </>
  );

  const className = "group flex min-h-[60px] items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] px-4 transition hover:border-blue-300/20 hover:bg-blue-400/[.04]";

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return <Link to={item.to} className={className}>{content}</Link>;
}

export default function GLandingProductionGateways() {
  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8" aria-label="KriptoAman unified ecosystem gateway">
      <div className="mx-auto max-w-[1440px]">
        <div className="ka-card overflow-hidden p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] ka-cyan">UNIFIED ECOSYSTEM GATEWAY</p>
              <h2 className="ka-sec-title mt-2 text-xl sm:text-2xl">Empat surface inti. Satu gateway produksi.</h2>
              <p className="ka-text2 mt-2 max-w-2xl text-xs leading-5">
                Akses platform, wallet, discovery, dan explorer tanpa mengulang blok navigasi yang sama.
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-emerald-300">
              VERIFIED-ONLY UI
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {CORE.map((item) => <RouteRow key={item.label} item={item} />)}
          </div>

          <div className="mt-4 border-t border-white/[.06] pt-4">
            <p className="text-[9px] font-black uppercase tracking-[.14em] ka-text2">DIRECT EVIDENCE ROUTES</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIRECT.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-400/10 bg-blue-400/[.035] px-3 text-[11px] font-bold ka-text2 transition hover:border-blue-300/20 hover:ka-blue"
                >
                  <ShieldCheck className="h-3.5 w-3.5 ka-blue" />
                  {item.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

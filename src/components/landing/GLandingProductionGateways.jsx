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
  { icon: BrainCircuit, label: 'KriptoAman Intelligence', kind: 'PLATFORM', to: '/login' },
  { icon: WalletCards, label: 'ZEVARYQ Wallet', kind: 'WALLET', to: '/wallet-app' },
  { icon: Radar, label: 'QoryVEx', kind: 'DISCOVERY', to: '/qoryvex/discovery' },
  { icon: Blocks, label: 'ZEVARYQ Explorer', kind: 'EXPLORER', href: 'https://explorer.kriptoaman.com' },
];

const DIRECT = [
  { label: 'Intelligence Hub', to: '/IntelligenceHub' },
  { label: 'Asset Passport', to: '/IntelligenceHub' },
  { label: 'System Status', to: '/SystemStatus' },
];

function RouteTile({ item }) {
  const Icon = item.icon;
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-400/10 bg-blue-400/[.05]">
        <Icon className="h-4 w-4 ka-blue" />
      </span>
      <span className="min-w-0 flex-1">
        <small className="block text-[8px] font-black uppercase tracking-[.12em] ka-text2">{item.kind}</small>
        <b className="mt-0.5 block truncate text-[12px] ka-text">{item.label}</b>
      </span>
      <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[.05] px-2 py-1 text-[8px] font-black uppercase tracking-[.1em] text-emerald-300 lg:inline">
        LIVE ROUTE
      </span>
      {item.href
        ? <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        : <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-sky-300" />}
    </>
  );

  const className = "group flex min-h-[56px] items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] px-3 transition hover:border-blue-300/20 hover:bg-blue-400/[.04]";

  if (item.href) {
    return <a href={item.href} target="_blank" rel="noreferrer" className={className}>{content}</a>;
  }

  return <Link to={item.to} className={className}>{content}</Link>;
}

export default function GLandingProductionGateways() {
  return (
    <section id="fitur" className="px-4 py-5 sm:px-6 sm:py-6" aria-label="KriptoAman production routes">
      <div className="mx-auto max-w-[1440px]">
        <div className="ka-card overflow-hidden p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[.16em] ka-cyan">PRODUCTION ROUTES</p>
            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-emerald-300">
              VERIFIED-ONLY UI
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {CORE.map((item) => <RouteTile key={item.label} item={item} />)}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[.06] pt-3">
            <span className="mr-1 text-[8px] font-black uppercase tracking-[.12em] ka-text2">EVIDENCE</span>
            {DIRECT.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-blue-400/10 bg-blue-400/[.035] px-3 text-[10px] font-bold ka-text2 transition hover:border-blue-300/20 hover:ka-blue"
              >
                <ShieldCheck className="h-3.5 w-3.5 ka-blue" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

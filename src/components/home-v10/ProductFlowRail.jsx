import React from 'react';
import { BrainCircuit, Eye, FileCheck2, ShieldCheck, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCT_ARCHITECTURE_VERSION } from '@/lib/productArchitecture';

const STEPS = [
  { id: 'OBSERVE', icon: Eye, label: 'Observe', to: '/Market', tone: 'text-cyan-300' },
  { id: 'UNDERSTAND', icon: BrainCircuit, label: 'Understand', to: '/IntelligenceHub', tone: 'text-violet-300' },
  { id: 'DECIDE', icon: FileCheck2, label: 'Decide', to: '/IntelligenceHub', tone: 'text-sky-300' },
  { id: 'EXECUTE', icon: WalletCards, label: 'Execute', to: '/wallet-app', tone: 'text-amber-300' },
  { id: 'VERIFY', icon: ShieldCheck, label: 'Verify', href: 'https://explorer.kriptoaman.com', tone: 'text-emerald-300' },
];

export default function ProductFlowRail() {
  return (
    <section
      aria-label="KriptoAman decision loop"
      data-product-architecture={'kriptoaman-final-' + PRODUCT_ARCHITECTURE_VERSION}
      className="rounded-[22px] border border-white/[0.06] bg-[#050c16] px-3 py-3 sm:px-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">KriptoAman Intelligence Flow</p>
        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-cyan-300">Architecture {PRODUCT_ARCHITECTURE_VERSION}</p>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const content = (
            <div className="grid min-h-16 place-items-center rounded-xl border border-white/[0.05] bg-white/[0.02] px-1 text-center transition hover:bg-white/[0.04] focus-within:ring-2 focus-within:ring-cyan-300/70">
              <Icon className={'h-4 w-4 ' + step.tone} aria-hidden="true" />
              <span className="text-[8px] font-black uppercase tracking-[0.06em] text-slate-300">{step.label}</span>
            </div>
          );

          return step.href ? (
            <a key={step.id} href={step.href} target="_blank" rel="noreferrer" aria-label={step.label + ' using ZEVARYQ Explorer'}>
              {content}
            </a>
          ) : (
            <Link key={step.id} to={step.to} aria-label={step.label + ' in KriptoAman'}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

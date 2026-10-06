import React from 'react';
import { BrainCircuit, Eye, FileCheck2, ShieldCheck, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRODUCT_ARCHITECTURE_VERSION } from '@/lib/productArchitecture';

const STEPS = [
  { id: 'OBSERVE', icon: Eye, label: 'Observe', to: '/Market' },
  { id: 'UNDERSTAND', icon: BrainCircuit, label: 'Understand', to: '/IntelligenceHub' },
  { id: 'DECIDE', icon: FileCheck2, label: 'Decide', to: '/IntelligenceHub' },
  { id: 'EXECUTE', icon: WalletCards, label: 'Execute', to: '/wallet-app' },
  { id: 'VERIFY', icon: ShieldCheck, label: 'Verify', href: 'https://explorer.kriptoaman.com' },
];

export default function ProductFlowRail() {
  return (
    <section
      aria-label="KriptoAman decision loop"
      data-product-architecture={'kriptoaman-final-' + PRODUCT_ARCHITECTURE_VERSION}
      className="rounded-2xl border border-white/[0.045] bg-[#040a13] px-3 py-2"
    >
      <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="mr-1 shrink-0 text-[7px] font-black uppercase tracking-[0.14em] text-slate-300">
          Intelligence Flow
        </span>
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const content = (
            <span className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[8px] font-black uppercase tracking-[0.06em] text-slate-300 transition hover:bg-white/[0.035] hover:text-cyan-200">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {step.label}
            </span>
          );

          return (
            <React.Fragment key={step.id}>
              {step.href ? (
                <a href={step.href} target="_blank" rel="noreferrer" aria-label={step.label + ' using ZEVARYQ Explorer'}>
                  {content}
                </a>
              ) : (
                <Link to={step.to} aria-label={step.label + ' in KriptoAman'}>
                  {content}
                </Link>
              )}
              {index < STEPS.length - 1 && <span className="shrink-0 text-[8px] text-slate-400">→</span>}
            </React.Fragment>
          );
        })}
        <span className="ml-auto hidden shrink-0 text-[7px] font-black uppercase tracking-[0.1em] text-slate-400 sm:inline">
          v{PRODUCT_ARCHITECTURE_VERSION}
        </span>
      </div>
    </section>
  );
}

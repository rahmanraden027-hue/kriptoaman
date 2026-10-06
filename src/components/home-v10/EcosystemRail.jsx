import React from 'react';
import { Boxes, BrainCircuit, Network, ShieldCheck, WalletCards, Waypoints } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRODUCTS = [
  { name: 'KriptoAman', type: 'Platform Intelligence', icon: ShieldCheck, to: '/' },
  { name: 'ZEVARYQ', type: 'Network · Chain 22028', icon: Network, to: '/ZEVARYQ' },
  { name: 'ZEVARYQ Wallet', type: 'Secure Wallet Surface', icon: WalletCards, to: '/wallet-app' },
  { name: 'QoryVEx', type: 'Discovery & Liquidity', icon: Waypoints, to: '/QoryVExDiscovery' },
  { name: 'Nexus', type: 'Intelligence Layer', icon: BrainCircuit, to: '/IntelligenceHub' },
  { name: 'Advanced Solutions', type: 'Ecosystem Services', icon: Boxes, to: '/Services' },
];

export default function EcosystemRail() {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-amber-300/[0.10] bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,.07),transparent_34%),#050c16] p-4" aria-label="KriptoAman ecosystem">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-300">ONE GLOBAL INTELLIGENCE NETWORK</p>
          <h2 className="mt-1 text-lg font-black text-white">Ekosistem KriptoAman</h2>
        </div>
        <Link to="/Services" className="min-h-11 rounded-xl px-3 py-3 text-[9px] font-black text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80">Lihat ekosistem →</Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {PRODUCTS.map(({ name, type, icon: Icon, to }, index) => (
          <Link
            key={name}
            to={to}
            className="group relative min-h-[108px] overflow-hidden rounded-2xl border border-white/[0.055] bg-[#06101d]/78 p-3 transition hover:-translate-y-0.5 hover:border-amber-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80"
          >
            <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/25 to-transparent" aria-hidden="true" />
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.045] text-cyan-200 group-hover:text-amber-200">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <b className="mt-3 block text-[11px] text-white">{name}</b>
            <span className="mt-1 block text-[8px] leading-4 text-slate-400">{type}</span>
            {index < PRODUCTS.length - 1 ? <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 text-cyan-300/25 xl:block" aria-hidden="true">→</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

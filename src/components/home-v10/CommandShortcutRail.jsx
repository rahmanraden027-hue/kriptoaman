import React from 'react';
import { BrainCircuit, Network, Radar, ShieldCheck, Waypoints } from 'lucide-react';
import { Link } from 'react-router-dom';

const ITEMS = [
  { label: 'Market Intelligence', detail: 'Harga, momentum, volume, dan breadth.', icon: Radar, to: '/Market' },
  { label: 'On-Chain Analysis', detail: 'Bukti first-party dari ZEVARYQ.', icon: Waypoints, to: '/OnChain' },
  { label: 'Risk Radar', detail: 'Konteks risiko dan evidence.', icon: ShieldCheck, to: '/IntelligenceHub' },
  { label: 'Ecosystem Map', detail: 'Produk dan koneksi KriptoAman.', icon: Network, to: '/Services' },
  { label: 'AI Insights', detail: 'Intelligence berbasis data terverifikasi.', icon: BrainCircuit, to: '/IntelligenceHub' },
];

export default function CommandShortcutRail() {
  return (
    <section aria-label="KriptoAman command shortcuts" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {ITEMS.map(({ label, detail, icon: Icon, to }) => (
        <Link
          key={label}
          to={to}
          className="group relative flex min-h-[82px] items-center gap-3 overflow-hidden rounded-2xl border border-cyan-300/[0.09] bg-[#06101d]/76 p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-[#081522] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
        >
          <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" aria-hidden="true" />
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] text-cyan-200 transition group-hover:text-amber-200">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <b className="block truncate text-[11px] font-black text-white">{label}</b>
            <span className="mt-1 block text-[9px] leading-4 text-slate-400">{detail}</span>
          </span>
          <span className="ml-auto text-cyan-300" aria-hidden="true">→</span>
        </Link>
      ))}
    </section>
  );
}

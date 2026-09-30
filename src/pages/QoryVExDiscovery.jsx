import React from 'react';
import {
  Activity, ArrowRight, Binary, Database, Fingerprint, Globe2,
  Radio, Radar, ShieldCheck, Sparkles, Waves,
} from 'lucide-react';
import NewTokenRadar from '@/components/market/NewTokenRadar';

const FLOW = [
  {
    step: '01', icon: Globe2, title: 'ZEVARYQ Mainnet', tone: 'cyan',
    kicker: 'FIRST-PARTY BLOCKCHAIN DATA',
    body: 'Chain ID 22028 / 0x560c. QoryVEx reads observable ZEVARYQ block, transaction, receipt, bytecode, and contract metadata evidence.',
  },
  {
    step: '02', icon: Radar, title: 'New Token Radar', tone: 'sky',
    kicker: 'CONTRACT CREATION DETECTION',
    body: 'Recent blocks are scanned for contract creation. A new contract remains a contract until token metadata can be independently proven on-chain.',
  },
  {
    step: '03', icon: Fingerprint, title: 'Asset Passport', tone: 'emerald',
    kicker: 'VERIFIABLE ASSET IDENTITY',
    body: 'Creator, creation transaction, block, bytecode size, symbol, decimals, supply declaration, and provenance are attached to the discovered asset.',
  },
  {
    step: '04', icon: Binary, title: 'Launch DNA', tone: 'violet',
    kicker: 'DESCRIPTIVE ON-CHAIN FINGERPRINT',
    body: 'Launch age, bytecode characteristics, metadata proof, and first-party evidence are summarized without turning technical facts into a safety score.',
  },
  {
    step: '05', icon: Sparkles, title: 'QoryVEx Discovery', tone: 'amber',
    kicker: 'EVIDENCE-GATED DISCOVERY',
    body: 'Verified evidence becomes discoverable while pool, liquidity, and execution remain gated until their own first-party evidence is available.',
  },
];

const TONES = {
  cyan: 'border-cyan-400/20 bg-cyan-400/[0.055] text-cyan-200',
  sky: 'border-sky-400/20 bg-sky-400/[0.055] text-sky-200',
  emerald: 'border-emerald-400/20 bg-emerald-400/[0.055] text-emerald-200',
  violet: 'border-violet-400/20 bg-violet-400/[0.055] text-violet-200',
  amber: 'border-amber-400/20 bg-amber-400/[0.055] text-amber-200',
};

export default function QoryVExDiscovery() {
  return (
    <main className="min-h-screen bg-[#020611] text-white">
      <section className="mx-auto max-w-[1480px] px-3 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="relative mb-4 overflow-hidden rounded-[34px] border border-cyan-400/20 bg-[radial-gradient(circle_at_50%_0%,rgba(14,116,255,.24),transparent_30%),radial-gradient(circle_at_88%_14%,rgba(245,183,65,.13),transparent_23%),linear-gradient(145deg,#06152b,#020714_64%,#01040a)] p-5 shadow-[0_28px_100px_-55px_rgba(34,211,238,.45)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-70" style={{
            backgroundImage: 'linear-gradient(rgba(56,189,248,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.035) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />
          <div className="relative grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.24em] text-amber-300">
                <Waves className="h-3.5 w-3.5 text-cyan-300" /> KRIPTOAMAN · ZEVARYQ · QORYVEX
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                QoryVEx <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-amber-300 bg-clip-text text-transparent">Discovery</span>
              </h1>
              <p className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Final Production Architecture</p>
              <p className="mt-4 max-w-3xl text-xs leading-6 text-slate-300 sm:text-sm sm:leading-7">
                A first-party on-chain discovery layer for ZEVARYQ. New Token Radar observes contract creation, Asset Passport attaches provenance, and Launch DNA describes what is technically visible before QoryVEx exposes it as discovery data.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black text-emerald-300">
                  <Activity className="h-3.5 w-3.5" /> PRODUCTION VERIFIED
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-black text-cyan-200">
                  <Database className="h-3.5 w-3.5" /> FIRST-PARTY DATA
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[10px] font-black text-amber-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> EVIDENCE-GATED
                </span>
              </div>
            </div>

            <div className="relative min-h-[260px] overflow-hidden rounded-[30px] border border-cyan-400/20 bg-[#03101f]/85 p-5">
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/30 bg-[radial-gradient(circle_at_35%_25%,#2bc4ff_0_2%,transparent_3%),radial-gradient(circle_at_45%_45%,#1475d8_0_22%,#082b57_42%,#020713_70%)] shadow-[0_0_70px_rgba(14,165,233,.35)]" />
              <div className="absolute left-1/2 top-1/2 h-16 w-[250px] -translate-x-1/2 -translate-y-1/2 rotate-[-16deg] rounded-[50%] border border-amber-300/60 shadow-[0_0_20px_rgba(245,183,65,.12)]" />
              <div className="absolute left-1/2 top-1/2 h-20 w-[260px] -translate-x-1/2 -translate-y-1/2 rotate-[22deg] rounded-[50%] border border-cyan-300/45" />
              <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-amber-300/40 bg-[#061426]/90 text-xl font-black text-amber-300 shadow-[0_0_28px_rgba(56,189,248,.35)]">ZVQ</div>
              <span className="absolute left-[14%] top-[30%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_#67e8f9]" />
              <span className="absolute right-[15%] top-[26%] h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_16px_#fcd34d]" />
              <span className="absolute bottom-[24%] right-[25%] h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_#6ee7b7]" />
              <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2">
                {[
                  ['Chain', '22028'],
                  ['Identity', '0x560c'],
                  ['Mode', 'Read-only'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/25 p-2 text-center backdrop-blur">
                    <p className="text-xs font-black text-white">{value}</p>
                    <p className="mt-1 text-[8px] uppercase tracking-widest text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mb-4 rounded-[30px] border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5" aria-label="QoryVEx production architecture">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">Evidence flow</p>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">From chain event to discoverable asset evidence</h2>
            </div>
            <p className="max-w-xl text-[10px] leading-5 text-slate-500">Each stage preserves the distinction between observed facts, proven metadata, and evidence that is still unavailable.</p>
          </div>
          <div className="grid gap-2 xl:grid-cols-5">
            {FLOW.map(({ step, icon: Icon, title, kicker, body, tone }) => (
              <article key={title} className={`relative rounded-[22px] border p-4 ${TONES[tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-current/20 bg-black/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black opacity-25">{step}</span>
                </div>
                <p className="mt-4 text-[8px] font-black uppercase tracking-[0.16em] opacity-80">{kicker}</p>
                <h3 className="mt-1 text-base font-black text-white">{title}</h3>
                <p className="mt-2 text-[10px] leading-5 text-slate-400">{body}</p>
                <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-cyan-300/30 xl:block" />
              </article>
            ))}
          </div>
        </section>

        <NewTokenRadar expanded />

        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-400/[0.035] p-4">
            <div className="flex items-center gap-2 text-emerald-300"><Radio className="h-4 w-4"/><h2 className="text-sm font-black text-white">Live evidence first</h2></div>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">The production component below renders current API evidence. No sample token, fabricated address, or synthetic liquidity is inserted into the live feed.</p>
          </div>
          <div className="rounded-[24px] border border-cyan-400/15 bg-cyan-400/[0.035] p-4">
            <div className="flex items-center gap-2 text-cyan-300"><Fingerprint className="h-4 w-4"/><h2 className="text-sm font-black text-white">Provenance attached</h2></div>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Creator, block, creation transaction, contract code and metadata evidence remain visible as separate technical facts instead of being collapsed into an opaque score.</p>
          </div>
          <div className="rounded-[24px] border border-amber-400/15 bg-amber-400/[0.035] p-4">
            <div className="flex items-center gap-2 text-amber-300"><ShieldCheck className="h-4 w-4"/><h2 className="text-sm font-black text-white">Execution remains gated</h2></div>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Pool, liquidity and swap execution stay unavailable until the relevant factory/router registry and event evidence are independently verified from first-party chain data.</p>
          </div>
        </section>
      </section>
    </main>
  );
}

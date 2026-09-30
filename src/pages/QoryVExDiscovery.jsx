import React from 'react';
import { Database, Radio, ShieldCheck } from 'lucide-react';
import NewTokenRadar from '@/components/market/NewTokenRadar';

export default function QoryVExDiscovery() {
  return (
    <main className="min-h-screen ka-bg text-white">
      <section className="mx-auto max-w-7xl px-3 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mb-4 overflow-hidden rounded-[30px] border border-cyan-400/15 bg-gradient-to-br from-cyan-500/10 via-slate-950/90 to-violet-500/10 p-5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">
                <Radio className="h-3.5 w-3.5" /> QORYVEX DISCOVERY
              </p>
              <h1 className="mt-2 text-2xl font-black sm:text-4xl">On-chain discovery with evidence attached</h1>
              <p className="mt-3 max-w-3xl text-xs leading-6 text-slate-400 sm:text-sm">
                QoryVEx Discovery separates what the chain proves from what is still unknown. New contracts are observed first, Asset Passport records verifiable metadata, and Launch DNA describes launch characteristics without turning them into an audit, endorsement, or prediction.
              </p>
            </div>
            <div className="grid min-w-[260px] grid-cols-3 gap-2">
              {[
                [Database, 'First-party', 'RPC'],
                [ShieldCheck, 'Truth state', 'Explicit'],
                [Radio, 'Execution', 'Gated'],
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-center">
                  <Icon className="mx-auto h-4 w-4 text-cyan-300" />
                  <p className="mt-2 text-xs font-black text-white">{value}</p>
                  <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <NewTokenRadar expanded />

        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-4">
            <h2 className="text-sm font-black text-white">New Token Radar</h2>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Detects contract creation from recent ZEVARYQ blocks and verifies the deployed contract address from its transaction receipt.</p>
          </div>
          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-4">
            <h2 className="text-sm font-black text-white">Asset Passport + Launch DNA</h2>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Records creator, block, transaction, bytecode size, token metadata evidence, supply declaration, and launch age from first-party chain reads.</p>
          </div>
          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-4">
            <h2 className="text-sm font-black text-white">QoryVEx execution gate</h2>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">Pool, liquidity, and swap execution remain unavailable until the relevant factory/router registry and event evidence are explicitly verified.</p>
          </div>
        </section>
      </section>
    </main>
  );
}

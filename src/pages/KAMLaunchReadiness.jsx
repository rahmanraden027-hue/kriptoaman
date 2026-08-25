import React from 'react';
import { CheckCircle2, Clock3, ExternalLink, ShieldCheck } from 'lucide-react';

const gates = [
  ['Chain identity', 'Chain ID 22028 / 0x560c and EVM metadata stay consistent across RPC, explorer, wallet metadata, and registry submissions.'],
  ['Block production', 'Blocks must continue advancing without unexplained stalls during the final evidence window.'],
  ['RPC & explorer', 'Public RPC must remain reachable; explorer must track the same chain within the promotion-gate lag threshold.'],
  ['Sensitive namespaces', 'admin/debug/personal/qbft must remain blocked on public RPC.'],
  ['Validator evidence', 'Four production validator hosts, unique identities, persistent operation, and private evidence must remain valid.'],
  ['Backup & restore', 'Latest backup/restore evidence must remain valid before promotion.'],
  ['24/24 evidence', 'Every required hourly bucket must contain a valid readiness proof; missing or failed buckets break continuity.'],
  ['Protected origin', 'Public traffic must terminate through the intended protected RPC origin/sentry path, not directly on validators.'],
  ['Chain ID collision', 'Run the final authoritative collision check immediately before public promotion.'],
  ['Docs & channels', 'Official docs, wallet metadata, explorer, logo assets, and verification channels must be consistent.'],
];

export default function KAMLaunchReadiness() {
  return (
    <main className="ka-bg min-h-screen px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="ka-command-hero p-6 sm:p-8">
          <p className="ka-command-kicker">KAM MAINNET PROMOTION</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Final Launch Readiness</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">A transparent checklist for the final production-review phase. This page does not promote the network and does not replace Issue #115 evidence.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200"><Clock3 className="h-4 w-4" /> Awaiting complete final evidence</div>
        </section>

        <section className="ka-command-panel overflow-hidden p-0">
          <div className="divide-y divide-slate-800/80">{gates.map(([title, detail], index) => (
            <div key={title} className="flex gap-4 px-5 py-4 sm:px-6"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 text-[10px] font-black text-slate-400">{index + 1}</div><div><p className="text-sm font-black text-slate-200">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div></div>
          ))}</div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <a href="/KAMNetwork" className="ka-command-panel p-5 transition hover:border-sky-400/30"><CheckCircle2 className="h-5 w-5 text-sky-300" /><h2 className="mt-3 font-black">Network Status</h2><p className="mt-1 text-xs leading-5 text-slate-500">Public RPC, Chain ID, block progression, and wallet metadata.</p></a>
          <a href="/KAMDeveloper" className="ka-command-panel p-5 transition hover:border-sky-400/30"><ShieldCheck className="h-5 w-5 text-emerald-300" /><h2 className="mt-3 font-black">Developer Portal</h2><p className="mt-1 text-xs leading-5 text-slate-500">Developer quick start and safe integration guidance.</p></a>
          <a href="https://github.com/ethereum-lists/chains/pull/8639" target="_blank" rel="noreferrer" className="ka-command-panel p-5 transition hover:border-violet-400/30"><ExternalLink className="h-5 w-5 text-violet-300" /><h2 className="mt-3 font-black">Registry Submission</h2><p className="mt-1 text-xs leading-5 text-slate-500">External registry submission remains subject to upstream CI/review.</p></a>
        </section>

        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4 text-[10px] leading-relaxed text-amber-100/70">Promotion rule: a green UI is not sufficient. Final promotion requires the authoritative workflow/artifact evidence, private validator and backup evidence, protected-origin proof, collision check, and explicit approved promotion action.</div>
      </div>
    </main>
  );
}

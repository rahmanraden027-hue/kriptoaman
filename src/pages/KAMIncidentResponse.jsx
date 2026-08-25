import React from 'react';
import { AlertTriangle, DatabaseBackup, Network, ServerCog, ShieldAlert } from 'lucide-react';

const scenarios = [
  ['RPC unavailable', 'Confirm whether the protected public gateway or the origin/sentry is affected. Do not expose validator RPC as an emergency shortcut. Keep sensitive namespaces blocked.', Network],
  ['Explorer lag', 'Compare explorer head to authoritative RPC block height. If lag exceeds the operational threshold, treat explorer as degraded while keeping chain health separate.', ServerCog],
  ['Validator offline', 'Identify the affected validator through private monitoring. Preserve remaining quorum, avoid re-key/re-genesis, and restore the host using the documented production procedure.', ShieldAlert],
  ['Block production halt', 'Escalate immediately. Freeze promotion/public-launch actions, preserve logs and evidence, check quorum/peer health privately, and avoid state-changing recovery until root cause is understood.', AlertTriangle],
  ['Backup/restore concern', 'Do not overwrite the last known-good backup. Validate backup integrity and restore procedure in the approved isolated recovery path before treating the evidence as valid.', DatabaseBackup],
  ['DNS / edge issue', 'Separate DNS/Cloudflare availability from chain production. Keep validators private and restore the public edge/origin path without bypassing security controls.', Network],
];

export default function KAMIncidentResponse() {
  return (
    <main className="ka-bg min-h-screen px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="ka-command-hero p-6 sm:p-8">
          <p className="ka-command-kicker">KAM OPERATIONS · ADMIN</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Incident Response Playbook</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">High-level production response guidance designed to protect chain continuity, evidence integrity, and validator isolation. No secrets, validator addresses, or recovery credentials are exposed here.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">{scenarios.map(([title, detail, Icon]) => (
          <div key={title} className="ka-command-panel p-5"><Icon className="h-5 w-5 text-amber-300" /><h2 className="mt-3 text-sm font-black text-slate-200">{title}</h2><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>
        ))}</section>

        <section className="ka-command-panel p-5 sm:p-6">
          <h2 className="text-lg font-black">Mandatory response sequence</h2>
          <ol className="mt-4 space-y-3 text-xs leading-5 text-slate-400">
            <li><strong className="text-slate-200">1. Detect & classify.</strong> Confirm whether the issue is chain consensus, validator host, RPC edge, explorer, DNS, or third-party infrastructure.</li>
            <li><strong className="text-slate-200">2. Stop promotion actions.</strong> If an active incident can affect readiness evidence, do not continue mainnet promotion or external launch claims.</li>
            <li><strong className="text-slate-200">3. Preserve evidence.</strong> Retain logs, timestamps, block heights, monitoring results, and configuration fingerprints needed for root-cause review.</li>
            <li><strong className="text-slate-200">4. Contain safely.</strong> Never make admin/debug/personal/qbft publicly reachable, never expose validator RPC, and never share signing material.</li>
            <li><strong className="text-slate-200">5. Recover minimally.</strong> Prefer the smallest reversible repair that restores the documented architecture. Avoid re-genesis/re-key unless separately approved and justified.</li>
            <li><strong className="text-slate-200">6. Re-validate.</strong> Re-run the normal readiness evidence window after recovery; do not reuse pre-incident continuity as proof if the incident invalidated it.</li>
          </ol>
        </section>

        <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-4 text-[10px] leading-relaxed text-red-100/70">This page is operational guidance, not an automated recovery controller. High-risk state changes, validator key operations, consensus reconfiguration, or production promotion still require explicit approval and verified evidence.</div>
      </div>
    </main>
  );
}

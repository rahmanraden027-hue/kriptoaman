import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

export default function AdminCommandShell({ kicker, title, description, icon: Icon, children }) {
  return (
    <div className="ka-bg ka-workspace-page ka-admin-modern min-h-screen text-white pb-28">
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-7 mb-5">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-500/10 shadow-[0_0_34px_rgba(14,165,233,.10)]">
                <Icon className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <p className="ka-command-kicker">{kicker}</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ka-command-status">ADMIN SESSION</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-[10px] font-extrabold text-indigo-300">
                <ShieldCheck className="h-3.5 w-3.5" /> OWNER CONTROL
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-2 text-[10px] font-extrabold text-sky-300">
                <Activity className="h-3.5 w-3.5" /> LIVE WORKSPACE
              </span>
            </div>
          </div>
        </section>
      </div>
      <div className="ka-admin-legacy">{children}</div>
    </div>
  );
}

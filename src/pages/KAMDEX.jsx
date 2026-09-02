import React from 'react';
import {
  ArrowDownUp,
  BarChart3,
  Coins,
  Droplets,
  ExternalLink,
  Info,
  LockKeyhole,
  Network,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

const WKAM_ADDRESS = '0x0d8848CE88BB09a81a4248Efdd574d50B98b544A';

const Metric = ({ label, value, note }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="mt-2 text-xl font-black text-white">{value}</p>
    {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
  </div>
);

const StatusChip = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
    <span className="h-2 w-2 rounded-full bg-emerald-400" />
    {children}
  </span>
);

export default function KAMDEX() {
  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-sky-500/20 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-950/60 p-5 shadow-[0_30px_90px_-55px_rgba(14,165,233,.8)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip>KAM Mainnet · Chain ID 22028</StatusChip>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">Readiness Preview · Trading Disabled</span>
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">KriptoAman DEX</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Native liquidity interface untuk KAM Network. Tampilan ini menghubungkan rancangan KAMFactory, KAMPair, KAMRouter dan canonical WKAM tanpa mengaktifkan transaksi atau memindahkan dana.
              </p>
            </div>
            <div className="flex gap-3">
              <a href="https://explorer.kriptoaman.com" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-bold text-slate-200 transition hover:border-sky-500/50 hover:text-white">
                Explorer <ExternalLink className="h-4 w-4" />
              </a>
              <button type="button" disabled className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-xl bg-sky-600/60 px-4 text-sm font-black text-white opacity-70">
                <Wallet className="h-4 w-4" /> Connect Wallet
              </button>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.15fr_.85fr]">
          <section className="rounded-[26px] border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Network Overview</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Native Asset" value="KAM" note="18 decimals" />
              <Metric label="Wrapped Asset" value="WKAM" note="1:1 native wrapper" />
              <Metric label="Swap Fee" value="0.30%" note="AMM contract model" />
              <Metric label="AMM" value="x · y = k" note="constant product" />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Canonical WKAM</div>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-400">{WKAM_ADDRESS}</p>
            </div>
          </section>

          <section className="rounded-[26px] border border-sky-500/20 bg-slate-950 p-5 shadow-[0_24px_80px_-60px_rgba(14,165,233,.9)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Swap</p>
                <h2 className="mt-1 text-xl font-black">KAM Native Swap</h2>
              </div>
              <ArrowDownUp className="h-5 w-5 text-sky-300" />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500"><span>From</span><span>Balance: —</span></div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-3xl font-black text-slate-300">0.00</span>
                <span className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black">KAM</span>
              </div>
            </div>

            <div className="mx-auto -my-2 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-950"><ArrowDownUp className="h-4 w-4 text-sky-300" /></div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500"><span>To · estimated</span><span>Balance: —</span></div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-3xl font-black text-slate-300">0.00</span>
                <span className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black">WKAM</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs"><span className="text-slate-500">Slippage protection</span><span className="font-bold text-sky-300">Configured at execution</span></div>
            <button type="button" disabled className="mt-4 min-h-12 w-full cursor-not-allowed rounded-2xl bg-sky-600/60 font-black text-white opacity-70">Trading remains disabled until production gates pass</button>
          </section>

          <section className="rounded-[26px] border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Liquidity Readiness</p>
            <div className="mt-4 space-y-3">
              {[
                ['Factory', 'Implemented'],
                ['Pair / LP', 'Implemented'],
                ['Router', 'Implemented'],
                ['WKAM', 'Recorded deployment'],
                ['Quote asset', 'Pending provenance'],
                ['Real pool reserves', 'Not seeded'],
              ].map(([name, state]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm">
                  <span className="font-semibold text-slate-300">{name}</span>
                  <span className={state.includes('Pending') || state.includes('Not') ? 'text-amber-300' : 'text-emerald-300'}>{state}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[26px] border border-slate-800 bg-slate-950/80 p-5 sm:p-6">
            <div className="flex items-center gap-3"><Network className="h-5 w-5 text-sky-300" /><h2 className="text-lg font-black">DEX Architecture</h2></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['KAMRouter', 'Entry point', ArrowDownUp],
                ['KAMFactory', 'Creates pairs', Coins],
                ['KAMPair', 'Liquidity pools', Droplets],
              ].map(([name, desc, Icon]) => (
                <div key={name} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <Icon className="h-5 w-5 text-sky-300" />
                  <p className="mt-3 font-black text-white">{name}</p>
                  <p className="mt-1 text-xs text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm leading-6 text-slate-400">
              Wallet → Router → Factory/Pair → canonical WKAM + reviewed counter-asset. Pool price comes from real reserve ratios and real trading, not an internally fabricated market value.
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-800 bg-slate-950/80 p-5 sm:p-6">
            <div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-emerald-300" /><h2 className="text-lg font-black">Production Gates</h2></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ['Contract CI', 'Passing baseline'],
                ['Canonical WKAM', 'Bound in repository'],
                ['Independent audit', 'Required before launch'],
                ['Quote asset provenance', 'Required before pool'],
                ['Treasury authorization', 'Required before funds move'],
                ['Small real swap smoke', 'Only after previous gates'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-[24px] border border-blue-500/15 bg-blue-500/5 p-4 sm:p-5">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
            <p className="text-sm leading-6 text-slate-400">
              Preview ini tidak menampilkan harga KAM, TVL, volume, APY, listing, atau likuiditas yang belum terverifikasi. Connect Wallet dan transaksi sengaja dinonaktifkan sampai audit, quote-asset provenance, deployment verification, dan otorisasi treasury selesai.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

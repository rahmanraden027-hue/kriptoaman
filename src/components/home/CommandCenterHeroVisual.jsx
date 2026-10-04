import React from 'react';
import { Activity, Database, Globe2, Radio, ShieldCheck, Sparkles } from 'lucide-react';

const fmt = (value) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString('en-US')
  : '—';

function Metric({ icon: Icon, label, value, note, tone = 'cyan' }) {
  const toneClass = tone === 'emerald'
    ? 'text-emerald-300'
    : tone === 'amber'
      ? 'text-amber-300'
      : tone === 'violet'
        ? 'text-violet-300'
        : 'text-cyan-300';
  return (
    <div className="rounded-2xl border border-white/[.06] bg-[#07111f]/76 p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      </div>
      <div className="mt-2 text-base font-black text-white">{value}</div>
      <div className="mt-1 min-h-4 text-[8px] leading-4 text-slate-500">{note}</div>
    </div>
  );
}

export default function CommandCenterHeroVisual({ zvq, market, activeChains, pulse }) {
  const verified = zvq?.verified === true;
  const head = Number(zvq?.blockNumber);
  const rpcLatency = Number(zvq?.probeDurationMs);
  const trackedAssets = Number(market?.activeCryptocurrencies);
  const evidenceLive = pulse?.status === 'live' && Number(pulse?.chainId) === 22028;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-sky-400/12 bg-[#04101c]/86 p-4 sm:p-5">
      <style>{`
        .ka-command-orbit{position:absolute;left:50%;top:42%;width:min(72vw,370px);height:min(30vw,148px);transform:translate(-50%,-50%) rotate(-15deg);border:1px solid rgba(56,189,248,.2);border-radius:50%;box-shadow:0 0 28px rgba(34,211,238,.08)}
        .ka-command-orbit.second{transform:translate(-50%,-50%) rotate(29deg);border-color:rgba(245,158,11,.2)}
        .ka-command-globe{position:absolute;left:50%;top:42%;width:min(50vw,235px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;border:1px solid rgba(103,232,249,.28);background:radial-gradient(circle at 35% 30%,rgba(125,211,252,.42),rgba(14,116,144,.15) 28%,rgba(2,6,23,.9) 68%);box-shadow:inset 0 0 46px rgba(34,211,238,.14),0 0 54px rgba(14,165,233,.16)}
        .ka-command-globe::before,.ka-command-globe::after{content:'';position:absolute;inset:8%;border-radius:50%;border:1px solid rgba(125,211,252,.16)}
        .ka-command-globe::before{transform:rotateX(68deg)}.ka-command-globe::after{transform:rotateY(68deg)}
        .ka-command-node{position:absolute;width:8px;height:8px;border-radius:999px;background:#67e8f9;box-shadow:0 0 16px rgba(103,232,249,.85)}
        .ka-command-node.gold{background:#facc15;box-shadow:0 0 16px rgba(250,204,21,.75)}
        .ka-command-scan{position:absolute;left:18%;right:18%;top:42%;height:1px;background:linear-gradient(90deg,transparent,rgba(103,232,249,.8),transparent);box-shadow:0 0 18px rgba(34,211,238,.35);animation:kaCommandScan 3.6s ease-in-out infinite}
        @keyframes kaCommandScan{0%,100%{transform:translateY(-54px);opacity:.18}50%{transform:translateY(54px);opacity:.85}}
        @media(prefers-reduced-motion:reduce){.ka-command-scan{animation:none}}
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,.08),transparent_42%)]" />
      <div className="ka-command-orbit" />
      <div className="ka-command-orbit second" />
      <div className="ka-command-globe">
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[9px] font-black tracking-[.18em] text-amber-200">ZEVARYQ</div>
            <div className="mt-1 text-2xl font-black text-white">ZVQ</div>
            <div className="mt-1 text-[9px] text-sky-300">CHAIN 22028</div>
          </div>
        </div>
      </div>
      <div className="ka-command-scan" />
      <span className="ka-command-node" style={{ left: '21%', top: '29%' }} />
      <span className="ka-command-node gold" style={{ right: '18%', top: '33%' }} />
      <span className="ka-command-node" style={{ left: '17%', top: '54%' }} />
      <span className="ka-command-node gold" style={{ right: '22%', top: '58%' }} />

      <div className="absolute left-4 top-4 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.14em] text-emerald-300">
        {verified ? 'MAINNET VERIFIED' : 'VERIFYING NETWORK'}
      </div>
      <div className="absolute right-4 top-4 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.14em] text-sky-300">
        {evidenceLive ? 'EVIDENCE LIVE' : 'EVIDENCE GATED'}
      </div>

      <div className="relative z-10 mt-[235px] grid grid-cols-2 gap-2 sm:mt-[245px] sm:grid-cols-3">
        <Metric icon={Activity} label="Block Head" value={verified && Number.isFinite(head) ? `#${fmt(head)}` : 'UNAVAILABLE'} note="Verified ZEVARYQ RPC" tone="emerald" />
        <Metric icon={Radio} label="Sync" value={verified ? String(zvq?.syncStatus || 'unknown').toUpperCase() : 'UNAVAILABLE'} note={verified && Number.isFinite(rpcLatency) ? `RPC probe ${fmt(rpcLatency)} ms` : 'Waiting for verified RPC'} tone={zvq?.syncStatus === 'synced' ? 'emerald' : 'amber'} />
        <Metric icon={Globe2} label="Active Chains" value={Number.isFinite(Number(activeChains)) ? fmt(activeChains) : 'UNAVAILABLE'} note="Current successful network probes" />
        <Metric icon={Database} label="Tracked Assets" value={Number.isFinite(trackedAssets) ? fmt(trackedAssets) : 'UNAVAILABLE'} note="Production market source" tone="violet" />
        <Metric icon={Sparkles} label="Market Data" value={market ? 'AVAILABLE' : 'UNAVAILABLE'} note="KriptoAman market overview" tone={market ? 'emerald' : 'amber'} />
        <Metric icon={ShieldCheck} label="Evidence State" value={evidenceLive ? 'LIVE' : 'GATED'} note="First-party on-chain evidence" tone={evidenceLive ? 'emerald' : 'amber'} />
      </div>
    </div>
  );
}

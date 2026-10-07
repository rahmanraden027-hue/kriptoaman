import React, { useMemo } from 'react';
import { Activity, Blocks, Database, Gauge } from 'lucide-react';
import { DATA_STATE } from '@/lib/dataState';
import { formatCompactUsd } from './format';

const safeSum = (assets, key) => (Array.isArray(assets) ? assets : []).reduce((sum, asset) => {
  const value = Number(asset?.[key]);
  return Number.isFinite(value) && value > 0 ? sum + value : sum;
}, 0);

const toneFor = (state) => {
  if ([DATA_STATE.LIVE, DATA_STATE.SYNCED, DATA_STATE.VERIFIED, DATA_STATE.INDEXED].includes(state)) return 'text-emerald-300';
  if ([DATA_STATE.DELAYED, DATA_STATE.SNAPSHOT, DATA_STATE.CHECKING].includes(state)) return 'text-amber-300';
  return 'text-slate-300';
};

function StatCard({ icon: Icon, label, value, detail, state }) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-cyan-300/[0.09] bg-[#06101d]/82 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" aria-hidden="true" />
      <div className="flex items-start gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] text-cyan-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <b className="block truncate text-sm font-black text-white sm:text-base">{value}</b>
          <span className="mt-0.5 block truncate text-[8px] font-black uppercase tracking-[0.12em] text-slate-300">{label}</span>
          <span className={'mt-1 block truncate text-[8px] font-bold uppercase tracking-[0.08em] ' + toneFor(state)}>{detail}</span>
        </span>
      </div>
    </div>
  );
}

export default function CommandStats({ market, zevaryq }) {
  const metrics = useMemo(() => {
    const assets = Array.isArray(market?.assets) ? market.assets : [];
    return {
      tracked: Number(market?.rawAssetCount || market?.assetCount || 0),
      volume: safeSum(assets, 'volume'),
    };
  }, [market]);

  const network = zevaryq?.network || null;
  const block = Number(network?.blockNumber);
  const probeMs = Number(network?.probeDurationMs);
  const marketState = market?.priceState || market?.state || DATA_STATE.UNAVAILABLE;
  const catalogState = market?.catalogState || DATA_STATE.UNAVAILABLE;
  const networkState = zevaryq?.networkState || DATA_STATE.CHECKING;

  const cards = [
    {
      icon: Database,
      label: 'Aset dipantau',
      value: metrics.tracked > 0 ? metrics.tracked.toLocaleString('en-US') : '—',
      detail: 'CATALOG · ' + catalogState,
      state: catalogState,
    },
    {
      icon: Activity,
      label: 'Volume tracked 24H',
      value: metrics.volume > 0 ? formatCompactUsd(metrics.volume) : '—',
      detail: marketState === DATA_STATE.LIVE
        ? 'CALCULATED · LIVE'
        : marketState === DATA_STATE.SNAPSHOT
          ? 'CALCULATED · SNAPSHOT'
          : marketState,
      state: marketState,
    },
    {
      icon: Blocks,
      label: 'ZEVARYQ head',
      value: Number.isSafeInteger(block) ? '#' + block.toLocaleString('en-US') : '—',
      detail: networkState,
      state: networkState,
    },
    {
      icon: Gauge,
      label: 'RPC probe',
      value: Number.isFinite(probeMs) ? Math.round(probeMs) + ' ms' : '—',
      detail: networkState,
      state: networkState,
    },
  ];

  return (
    <section
      aria-label="Live command statistics"
      data-assets-tracked={metrics.tracked || ''}
      data-master-kpi-count="4"
      data-kpi-source-mode="truth-scoped-v2"
      data-market-catalog-state={catalogState}
      data-market-price-state={marketState}
      className="grid grid-cols-2 gap-2 lg:grid-cols-4"
    >
      {cards.map((card) => <StatCard key={card.label} {...card} />)}
    </section>
  );
}

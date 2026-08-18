import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, BarChart3, Layers3, Radar, ShieldCheck, Sparkles } from 'lucide-react';
import PortfolioStats from '../components/portfolio/PortfolioStats';
import AssetAllocationChart from '../components/portfolio/AssetAllocationChart';
import StrategyOverviewCard from '../components/portfolio/StrategyOverviewCard';

export default function PortfolioOverview() {
  const { data: strategies = [] } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => base44.entities.AutoTradingStrategy.list(),
  });

  const { data: liveTrades = [] } = useQuery({
    queryKey: ['liveTrades'],
    queryFn: () => base44.entities.LivePaperTrade.list(),
    refetchInterval: 5000,
  });

  const { data: paperTrades = [] } = useQuery({
    queryKey: ['paperTrades'],
    queryFn: () => base44.entities.PaperTrade.list(),
  });

  const portfolioMetrics = useMemo(() => {
    let totalPortfolioValue = 0;
    let totalRealizedPL = 0;
    let totalUnrealizedPL = 0;
    const assetBreakdown = {};
    let activeCount = 0;
    let inactiveCount = 0;

    liveTrades.forEach(trade => {
      if (trade.status === 'open') {
        totalUnrealizedPL += trade.unrealizedPL || 0;
        totalPortfolioValue += (trade.entryPrice * trade.quantity) || 0;
      } else if (trade.status === 'closed') {
        totalRealizedPL += trade.realizedPL || 0;
      }
      const key = trade.assetClass || 'unknown';
      assetBreakdown[key] = (assetBreakdown[key] || 0) + Math.abs(trade.quantity * trade.currentPrice || 0);
    });

    paperTrades.forEach(trade => {
      if (trade.status === 'completed' && trade.statistics) totalRealizedPL += trade.statistics.totalPL || 0;
    });

    strategies.forEach(strategy => {
      if (strategy.isActive) activeCount += 1;
      else inactiveCount += 1;
    });

    totalPortfolioValue += totalUnrealizedPL;

    return {
      totalPortfolioValue: Math.max(0, totalPortfolioValue),
      totalRealizedPL,
      totalUnrealizedPL,
      assetBreakdown,
      activeStrategies: activeCount,
      inactiveStrategies: inactiveCount,
      totalStrategies: strategies.length,
    };
  }, [liveTrades, paperTrades, strategies]);

  const empty = !strategies.length && !liveTrades.length && !paperTrades.length;

  return (
    <div className="ka-bg ka-workspace-page min-h-screen pb-28 text-white">
      <div className="mx-auto max-w-7xl space-y-5 px-4 pt-5 sm:px-6 lg:px-8">
        <section className="ka-command-hero p-5 sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="ka-command-kicker"><Radar className="h-3.5 w-3.5" /> KRIPTOAMAN PORTFOLIO INTELLIGENCE</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Portfolio Intelligence</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Ringkasan terintegrasi untuk strategi, simulasi, eksposur aset, dan performa portofolio dalam satu workspace.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ka-command-status">LIVE WORKSPACE</span>
              <span className="rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-2 text-[10px] font-bold text-sky-300">{portfolioMetrics.totalStrategies} STRATEGIES</span>
            </div>
          </div>
        </section>

        {empty ? (
          <section className="ka-command-panel flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-sky-500/20 bg-sky-500/10"><BarChart3 className="h-9 w-9 text-sky-400" /></div>
            <h2 className="mt-5 text-xl font-black">Belum ada data portofolio</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">Data akan muncul ketika strategi atau simulasi portofolio tersedia.</p>
          </section>
        ) : (
          <>
            <section className="ka-command-panel p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="ka-command-kicker"><Activity className="h-3.5 w-3.5" /> PORTFOLIO SIGNALS</p><h2 className="mt-2 text-lg font-black">Portfolio Metrics</h2></div>
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <PortfolioStats metrics={portfolioMetrics} />
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="ka-command-panel overflow-hidden p-4 sm:p-5"><AssetAllocationChart breakdown={portfolioMetrics.assetBreakdown} /></section>
              <section className="ka-command-panel overflow-hidden p-4 sm:p-5"><StrategyOverviewCard active={portfolioMetrics.activeStrategies} inactive={portfolioMetrics.inactiveStrategies} total={portfolioMetrics.totalStrategies} /></section>
            </div>

            <section className="ka-command-panel p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="ka-command-kicker"><Layers3 className="h-3.5 w-3.5" /> STRATEGY MATRIX</p><h2 className="mt-2 text-lg font-black">Active Strategies</h2></div>
                <Sparkles className="h-5 w-5 text-sky-400" />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {strategies.filter(strategy => strategy.isActive).length > 0 ? strategies.filter(strategy => strategy.isActive).map(strategy => (
                  <div key={strategy.id} className="ka-command-tile p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-black text-white">{strategy.name}</p><p className="mt-1 text-xs text-slate-500">{strategy.pair} • {strategy.assetClass}</p></div><span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300">ACTIVE</span></div>
                    <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-slate-700/50 bg-slate-950/35 p-3"><p className="text-[9px] text-slate-500">P/L</p><p className="mt-1 text-sm font-black text-emerald-400">+{strategy.stats?.totalPL || 0}</p></div><div className="rounded-xl border border-slate-700/50 bg-slate-950/35 p-3"><p className="text-[9px] text-slate-500">WIN RATE</p><p className="mt-1 text-sm font-black">{strategy.stats?.winRate || 0}%</p></div></div>
                  </div>
                )) : <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">No active strategies</div>}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

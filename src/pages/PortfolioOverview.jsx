import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
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
    let assetBreakdown = {};
    let activeCount = 0;
    let inactiveCount = 0;

    // Calculate from live trades
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

    // Calculate from paper trades (completed simulations)
    paperTrades.forEach(trade => {
      if (trade.status === 'completed' && trade.statistics) {
        totalRealizedPL += trade.statistics.totalPL || 0;
      }
    });

    // Count strategies
    strategies.forEach(s => {
      if (s.isActive) activeCount++;
      else inactiveCount++;
    });

    // Add unrealized to total
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

  if (!strategies.length && !liveTrades.length && !paperTrades.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Overview</h1>
          <p className="text-slate-400 mb-8">Get started by creating a trading strategy or connecting an account.</p>
          <div className="flex items-center justify-center min-h-[400px] bg-slate-800/40 rounded-xl border border-slate-700/40">
            <p className="text-slate-400">No portfolio data yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 pt-8">
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Overview</h1>
          <p className="text-slate-400">Aggregate view of all your trading accounts and strategies</p>
        </div>

        {/* Portfolio Stats */}
        <PortfolioStats metrics={portfolioMetrics} />

        {/* Charts & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetAllocationChart breakdown={portfolioMetrics.assetBreakdown} />
          <StrategyOverviewCard 
            active={portfolioMetrics.activeStrategies}
            inactive={portfolioMetrics.inactiveStrategies}
            total={portfolioMetrics.totalStrategies}
          />
        </div>

        {/* Strategies List */}
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Active Strategies</h2>
          <div className="space-y-3">
            {strategies.length > 0 ? (
              strategies.filter(s => s.isActive).map(strategy => (
                <div key={strategy.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <div>
                    <p className="font-semibold text-white">{strategy.name}</p>
                    <p className="text-xs text-slate-400">{strategy.pair} • {strategy.assetClass}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-400">+{strategy.stats?.totalPL || 0}</p>
                    <p className="text-xs text-slate-400">{strategy.stats?.winRate || 0}% Win Rate</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No active strategies</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import MetricsCards from '../components/analytics/MetricsCards';
import PerformanceChart from '../components/analytics/PerformanceChart';
import PeriodSelector from '../components/analytics/PeriodSelector';
import TradesTable from '../components/analytics/TradesTable';
import { BarChart3, Loader2 } from 'lucide-react';

export default function TradingAnalytics() {
  const [period, setPeriod] = useState('monthly');

  const { data: allTrades = [], isLoading } = useQuery({
    queryKey: ['tradePerformance'],
    queryFn: async () => {
      const trades = await base44.entities.TradePerformance.list();
      return trades.sort((a, b) => new Date(b.executedDate) - new Date(a.executedDate));
    }
  });

  // Filter trades by period
  const getFilteredTrades = () => {
    const now = new Date();
    let startDate;

    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
    }

    return allTrades.filter(trade => {
      const tradeDate = new Date(trade.executedDate);
      return tradeDate >= startDate;
    });
  };

  const filteredTrades = getFilteredTrades();

  // Calculate metrics
  const calculateMetrics = () => {
    if (filteredTrades.length === 0) {
      return {
        totalPL: 0,
        winRate: 0,
        avgPLPerTrade: 0,
        totalTrades: 0,
        winTrades: 0
      };
    }

    const executedTrades = filteredTrades.filter(t => t.status === 'executed');
    const winningTrades = executedTrades.filter(t => (t.profitLoss || 0) > 0);
    const totalPL = executedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const winRate = executedTrades.length > 0 
      ? (winningTrades.length / executedTrades.length) * 100 
      : 0;
    const avgPLPerTrade = executedTrades.length > 0 
      ? totalPL / executedTrades.length 
      : 0;

    return {
      totalPL,
      winRate,
      avgPLPerTrade,
      totalTrades: executedTrades.length,
      winTrades: winningTrades.length
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Trading Analytics</h1>
        </div>

        {/* Period Selector */}
        <PeriodSelector period={period} onPeriodChange={setPeriod} />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-slate-400">Memuat data...</span>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-400 mb-2">Belum ada data</h2>
            <p className="text-slate-500">Mulai berdagang untuk melihat analytics Anda</p>
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <MetricsCards metrics={metrics} />

            {/* Charts */}
            <PerformanceChart trades={filteredTrades} period={period} />

            {/* Trades Table */}
            <TradesTable trades={filteredTrades} />
          </>
        )}
      </div>
    </div>
  );
}
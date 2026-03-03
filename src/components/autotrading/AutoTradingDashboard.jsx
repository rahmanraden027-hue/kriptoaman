import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, TrendingUp, Activity, Zap, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import TradingRuleForm from './TradingRuleForm';
import TradingRuleCard from './TradingRuleCard';
import AutoTradingPerformance from './AutoTradingPerformance';

export default function AutoTradingDashboard({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [runningBot, setRunningBot] = useState(false);
  const [botResult, setBotResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading, refetch } = useQuery({
    queryKey: ['tradingRules', user?.email],
    queryFn: () => base44.entities.TradingRule.filter({ userEmail: user?.email }),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const { data: openPositions = [] } = useQuery({
    queryKey: ['openPositions', user?.email],
    queryFn: () => base44.entities.OpenPosition.filter({ userEmail: user?.email, status: 'open' }),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  const handleRunBot = async () => {
    setRunningBot(true);
    setBotResult(null);
    try {
      const res = await base44.functions.invoke('runAutoTradingBot', {});
      setBotResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['tradingRules'] });
      queryClient.invalidateQueries({ queryKey: ['openPositions'] });
      queryClient.invalidateQueries({ queryKey: ['tradingSignals'] });
    } catch (err) {
      setBotResult({ error: err.message });
    }
    setRunningBot(false);
  };

  const activeRules = rules.filter(r => r.isActive).length;
  const totalPnL = rules.reduce((acc, r) => acc + (r.stats?.totalPnL || 0), 0);
  const totalTrades = rules.reduce((acc, r) => acc + (r.stats?.totalTrades || 0), 0);
  const avgWinRate = rules.length > 0
    ? (rules.reduce((acc, r) => acc + (r.stats?.winRate || 0), 0) / rules.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs">Strategi Aktif</p>
          <p className="text-2xl font-bold text-blue-400">{activeRules}</p>
          <p className="text-xs text-slate-500">dari {rules.length} total</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs">Posisi Terbuka</p>
          <p className="text-2xl font-bold text-amber-400">{openPositions.length}</p>
          <p className="text-xs text-slate-500">aktif saat ini</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs">Total PnL</p>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">USDT</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs">Win Rate Rata-rata</p>
          <p className="text-2xl font-bold text-purple-400">{avgWinRate}%</p>
          <p className="text-xs text-slate-500">{totalTrades} total trade</p>
        </div>
      </div>

      {/* Open Positions */}
      {openPositions.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Posisi Terbuka ({openPositions.length})
          </p>
          <div className="space-y-2">
            {openPositions.map(pos => (
              <div key={pos.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-white text-sm font-semibold">{pos.pair}</p>
                  <p className="text-slate-400 text-xs">{pos.ruleName} · Entry: ${pos.entryPrice?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${(pos.unrealizedPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(pos.unrealizedPnL || 0) >= 0 ? '+' : ''}{(pos.unrealizedPnL || 0).toFixed(4)} USDT
                  </p>
                  <p className="text-slate-500 text-xs">
                    {(pos.unrealizedPnLPercent || 0) >= 0 ? '+' : ''}{(pos.unrealizedPnLPercent || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bot Control */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={handleRunBot} disabled={runningBot}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold">
          {runningBot ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          Jalankan Bot Sekarang
        </Button>
        <Button variant="outline" onClick={() => refetch()}
          className="border-slate-600 text-slate-300 hover:text-white">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
        <Button onClick={() => setShowForm(true)}
          className="bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30">
          <Plus className="w-4 h-4 mr-2" /> Buat Strategi Baru
        </Button>
      </div>

      {botResult && (
        <div className={`rounded-xl p-3 text-xs ${botResult.error ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
          {botResult.error ? (
            <p>❌ Error: {botResult.error}</p>
          ) : (
            <div>
              <p className="font-bold mb-1">✅ Bot selesai — {botResult.processed} rule diproses</p>
              {botResult.results?.map((r, i) => (
                <p key={i} className="text-slate-300">
                  • {r.rule}: <span className={r.signal === 'buy' ? 'text-green-400' : r.signal === 'sell' ? 'text-red-400' : 'text-slate-400'}>{r.signal?.toUpperCase()}</span>
                  {r.price && ` @ $${r.price?.toLocaleString()}`}
                  {r.error && <span className="text-red-400"> [{r.error}]</span>}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="strategies">
        <TabsList className="bg-slate-800 border border-slate-700 rounded-xl">
          <TabsTrigger value="strategies">Strategi</TabsTrigger>
          <TabsTrigger value="performance">Performa</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="mt-4">
          {showForm && (
            <div className="mb-4">
              <TradingRuleForm
                onSaved={() => { setShowForm(false); refetch(); }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">Belum ada strategi trading</p>
              <p className="text-slate-500 text-sm mt-1 mb-4">Buat strategi berdasarkan indikator teknikal</p>
              <Button onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Buat Strategi Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map(rule => (
                <TradingRuleCard key={rule.id} rule={rule} onRefresh={refetch} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <AutoTradingPerformance userEmail={user?.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
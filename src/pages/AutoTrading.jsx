import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Zap, Plus, Microscope, Radio, Grid3X3, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StrategySetupForm from '../components/autotrading/StrategySetupForm';
import StrategyList from '../components/autotrading/StrategyList';
import StrategySimulationTab from '../components/autotrading/StrategySimulationTab';
import RealTimeMarketPanel from '../components/autotrading/RealTimeMarketPanel';
import StrategyPerformanceDashboard from '../components/autotrading/StrategyPerformanceDashboard';
import RealtimePriceMonitor from '../components/autotrading/RealtimePriceMonitor';
import LiveTradePanel from '../components/autotrading/LiveTradePanel';
import TradeExecutionPanel from '../components/autotrading/TradeExecutionPanel';
import LivePerformanceDashboard from '../components/autotrading/LivePerformanceDashboard';
import NewsSentimentImpact from '../components/autotrading/NewsSentimentImpact';
import AITradeRecommendations from '../components/autotrading/AITradeRecommendations';
import AlertsConfiguration from '../components/autotrading/AlertsConfiguration';
import GridTradingPanel from '../components/autotrading/GridTradingPanel';
import AutoTradingDashboard from '../components/autotrading/AutoTradingDashboard';

export default function AutoTrading() {
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [mainTab, setMainTab] = useState('bot');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: strategies = [], isLoading, refetch } = useQuery({
    queryKey: ['autoTradingStrategies'],
    queryFn: async () => {
      const strats = await base44.entities.AutoTradingStrategy.list();
      return strats.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const handleStrategyCreated = () => { setShowSetupForm(false); refetch(); };
  const handleStrategyUpdate = () => refetch();
  const handleStrategyDelete = () => refetch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-lg border border-blue-500/40">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Auto-Trading</h1>
              <p className="text-slate-400 text-sm mt-1">AI strategies & Grid Bot otomatis</p>
            </div>
          </div>
          {mainTab === 'strategy' && (
            <Button onClick={() => setShowSetupForm(!showSetupForm)} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-5 h-5" /> Strategi Baru
            </Button>
          )}
        </div>

        {/* Main Tabs */}
        <div className="flex gap-1 bg-slate-800/60 border border-slate-700/40 rounded-xl p-1 mb-6 overflow-x-auto">
          <button onClick={() => setMainTab('bot')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${mainTab === 'bot' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <Bot className="w-4 h-4" /> Rule Bot
          </button>
          <button onClick={() => setMainTab('strategy')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${mainTab === 'strategy' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <Zap className="w-4 h-4" /> AI Strategi
          </button>
          <button onClick={() => setMainTab('grid')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${mainTab === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <Grid3X3 className="w-4 h-4" /> Grid Bot
          </button>
        </div>

        {/* ── RULE BOT TAB ── */}
        {mainTab === 'bot' && <AutoTradingDashboard user={user} />}

        {/* ── GRID BOT TAB ── */}
        {mainTab === 'grid' && <GridTradingPanel />}

        {/* ── AI STRATEGY TAB ── */}
        {mainTab === 'strategy' && (
          <>
            {/* Setup Form */}
            {showSetupForm && (
              <div className="mb-8">
                <StrategySetupForm onStrategyCreated={handleStrategyCreated} onCancel={() => setShowSetupForm(false)} />
              </div>
            )}

            {/* Info Box */}
            <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <span className="font-semibold">Cara Kerja:</span> Sistem akan menganalisis pasar sesuai interval yang ditentukan,
                mengidentifikasi peluang trading menggunakan AI, dan eksekusi otomatis dengan stop-loss & take-profit dinamis berbasis ATR.
              </p>
            </div>

            {/* Sub Tabs (only when strategy selected) */}
            {selectedStrategy && (
              <div className="mb-6 flex gap-2 border-b border-slate-700/40">
                <button onClick={() => setActiveTab('list')}
                  className={`px-4 py-3 font-semibold text-sm transition border-b-2 ${activeTab === 'list' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}>
                  Strategi
                </button>
                <button onClick={() => setActiveTab('simulation')}
                  className={`px-4 py-3 font-semibold text-sm transition border-b-2 flex items-center gap-2 ${activeTab === 'simulation' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}>
                  <Microscope className="w-4 h-4" /> Backtest
                </button>
                <button onClick={() => setActiveTab('live')}
                  className={`px-4 py-3 font-semibold text-sm transition border-b-2 flex items-center gap-2 ${activeTab === 'live' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'}`}>
                  <Radio className="w-4 h-4 animate-pulse" /> Live Trading
                </button>
              </div>
            )}

            {/* Strategy List */}
            {!selectedStrategy && (
              isLoading ? (
                <div className="text-center py-12"><p className="text-slate-400">Memuat strategi...</p></div>
              ) : (
                <StrategyList
                  strategies={strategies}
                  onStrategyUpdate={handleStrategyUpdate}
                  onStrategyDelete={handleStrategyDelete}
                  onSelectStrategy={setSelectedStrategy}
                />
              )
            )}

            {/* Simulation/Backtest */}
            {selectedStrategy && activeTab === 'simulation' && (
              <StrategySimulationTab strategy={selectedStrategy} />
            )}

            {/* Live Trading */}
            {selectedStrategy && activeTab === 'live' && (
              <div className="space-y-6">
                <RealtimePriceMonitor pair={selectedStrategy.pair} assetClass={selectedStrategy.assetClass} onPriceUpdate={setCurrentPrice} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AITradeRecommendations strategy={selectedStrategy} currentPrice={currentPrice} />
                  <NewsSentimentImpact pair={selectedStrategy.pair} symbol={selectedStrategy.pair.split('/')[0]} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <TradeExecutionPanel strategy={selectedStrategy} currentPrice={currentPrice} />
                    <AlertsConfiguration strategy={selectedStrategy} onAlertsChange={() => {}} />
                  </div>
                  <div className="space-y-6">
                    <LiveTradePanel strategy={selectedStrategy} />
                  </div>
                </div>
                <LivePerformanceDashboard strategy={selectedStrategy} />
              </div>
            )}

            {/* Strategy Detail */}
            {selectedStrategy && activeTab === 'list' && (
              <div className="space-y-6">
                <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedStrategy.name}</h2>
                      <p className="text-slate-400 text-sm mt-2">
                        {selectedStrategy.pair} • {selectedStrategy.chain} • {selectedStrategy.analysisInterval} menit
                      </p>
                    </div>
                    <Button onClick={() => setSelectedStrategy(null)} variant="outline" className="border-slate-700">
                      Kembali
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Status', value: selectedStrategy.isActive ? '✓ Aktif' : 'Inaktif' },
                      { label: 'Total Trades', value: selectedStrategy.stats?.totalTrades || 0 },
                      { label: 'Win Rate', value: `${(selectedStrategy.stats?.winRate || 0).toFixed(1)}%` },
                      { label: 'Total P/L', value: `$${(selectedStrategy.stats?.totalPL || 0).toFixed(2)}`, color: (selectedStrategy.stats?.totalPL || 0) >= 0 ? 'text-green-400' : 'text-red-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className={`text-lg font-bold mt-1 ${color || 'text-white'}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Kondisi Pasar Real-Time</h3>
                  <RealTimeMarketPanel pair={selectedStrategy.pair} symbol={selectedStrategy.pair.split('/')[0]} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Performa Strategi</h3>
                  <StrategyPerformanceDashboard strategy={selectedStrategy} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Zap, Plus, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StrategySetupForm from '../components/autotrading/StrategySetupForm';
import StrategyList from '../components/autotrading/StrategyList';
import StrategySimulationTab from '../components/autotrading/StrategySimulationTab';
import RealTimeMarketPanel from '../components/autotrading/RealTimeMarketPanel';
import StrategyPerformanceDashboard from '../components/autotrading/StrategyPerformanceDashboard';

export default function AutoTrading() {
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  const { data: strategies = [], isLoading, refetch } = useQuery({
    queryKey: ['autoTradingStrategies'],
    queryFn: async () => {
      const strats = await base44.entities.AutoTradingStrategy.list();
      return strats.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const handleStrategyCreated = (newStrategy) => {
    setShowSetupForm(false);
    refetch();
  };

  const handleStrategyUpdate = () => {
    refetch();
  };

  const handleStrategyDelete = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-lg border border-blue-500/40">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Auto-Trading</h1>
              <p className="text-slate-400 text-sm mt-1">AI-powered trading strategies dengan manajemen risiko otomatis</p>
            </div>
          </div>

          <Button
            onClick={() => setShowSetupForm(!showSetupForm)}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="w-5 h-5" />
            Strategi Baru
          </Button>
        </div>

        {/* Setup Form */}
        {showSetupForm && (
          <div className="mb-8">
            <StrategySetupForm
              onStrategyCreated={handleStrategyCreated}
              onCancel={() => setShowSetupForm(false)}
            />
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            💡 <span className="font-semibold">Cara Kerja:</span> Sistem akan menganalisis pasar sesuai interval yang ditentukan, 
            mengidentifikasi peluang trading menggunakan AI, dan eksekusi otomatis dengan stop-loss & take-profit dinamis berbasis ATR.
          </p>
        </div>

        {/* Tabs */}
        {selectedStrategy && (
          <div className="mb-6 flex gap-2 border-b border-slate-700/40">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-3 font-semibold text-sm transition border-b-2 ${
                activeTab === 'list'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              Strategi
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`px-4 py-3 font-semibold text-sm transition border-b-2 flex items-center gap-2 ${
                activeTab === 'simulation'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              <Microscope className="w-4 h-4" />
              Paper Trading
            </button>
          </div>
        )}

        {/* Strategy List */}
        {!selectedStrategy && (
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-slate-400">Memuat strategi...</p>
              </div>
            ) : (
              <StrategyList
                strategies={strategies}
                onStrategyUpdate={handleStrategyUpdate}
                onStrategyDelete={handleStrategyDelete}
                onSelectStrategy={setSelectedStrategy}
              />
            )}
          </>
        )}

        {/* Simulation Tab */}
        {selectedStrategy && activeTab === 'simulation' && (
          <StrategySimulationTab strategy={selectedStrategy} />
        )}

        {/* Strategy Detail */}
        {selectedStrategy && activeTab === 'list' && (
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedStrategy.name}</h2>
                <p className="text-slate-400 text-sm mt-2">
                  {selectedStrategy.pair} • {selectedStrategy.chain} • {selectedStrategy.analysisInterval} menit
                </p>
              </div>
              <Button
                onClick={() => setSelectedStrategy(null)}
                variant="outline"
                className="border-slate-700"
              >
                Kembali
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
                <p className="text-xs text-slate-400">Status</p>
                <p className="text-lg font-bold text-white mt-1">
                  {selectedStrategy.isActive ? '✓ Aktif' : 'Inaktif'}
                </p>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
                <p className="text-xs text-slate-400">Total Trades</p>
                <p className="text-lg font-bold text-white mt-1">{selectedStrategy.stats?.totalTrades || 0}</p>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
                <p className="text-xs text-slate-400">Win Rate</p>
                <p className="text-lg font-bold text-white mt-1">{(selectedStrategy.stats?.winRate || 0).toFixed(1)}%</p>
              </div>
              <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
                <p className="text-xs text-slate-400">Total P/L</p>
                <p className={`text-lg font-bold mt-1 ${(selectedStrategy.stats?.totalPL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(selectedStrategy.stats?.totalPL || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
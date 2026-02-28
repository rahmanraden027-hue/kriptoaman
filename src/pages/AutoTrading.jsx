import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Zap, Plus, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StrategySetupForm from '../components/autotrading/StrategySetupForm';
import StrategyList from '../components/autotrading/StrategyList';
import StrategySimulationTab from '../components/autotrading/StrategySimulationTab';

export default function AutoTrading() {
  const [showSetupForm, setShowSetupForm] = useState(false);
  const queryClient = useQueryClient();

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

        {/* Strategy List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Memuat strategi...</p>
          </div>
        ) : (
          <StrategyList
            strategies={strategies}
            onStrategyUpdate={handleStrategyUpdate}
            onStrategyDelete={handleStrategyDelete}
          />
        )}
      </div>
    </div>
  );
}
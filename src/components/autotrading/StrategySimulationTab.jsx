import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SimulationRunner from './SimulationRunner';
import SimulationResults from './SimulationResults';
import MetricsBuilder from './MetricsBuilder';
import StrategyComparisonDashboard from './StrategyComparisonDashboard';

export default function StrategySimulationTab({ strategy }) {
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const { data: simulations = [], isLoading, refetch } = useQuery({
    queryKey: ['paperTrades', strategy.id],
    queryFn: async () => {
      const sims = await base44.entities.PaperTrade.filter(
        { strategyId: strategy.id },
        '-created_date'
      );
      return sims;
    }
  });

  const handleSimulationComplete = (newSim) => {
    setSelectedSimulation(newSim);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Simulation Runner */}
      <SimulationRunner
        strategy={strategy}
        onSimulationComplete={handleSimulationComplete}
      />

      {/* Selected Simulation Results */}
      {selectedSimulation && (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedSimulation.simulationName}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {new Date(selectedSimulation.created_date).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <SimulationResults simulation={selectedSimulation} />
        </div>
      )}

      {/* Simulation History */}
      {simulations.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Riwayat Simulasi</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              {simulations.map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => setSelectedSimulation(sim)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedSimulation?.id === sim.id
                      ? 'bg-blue-600/20 border-blue-500/40'
                      : 'bg-slate-900/40 border-slate-700/40 hover:border-slate-600/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{sim.simulationName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Capital: ${sim.startingCapital} → ${sim.statistics.finalBalance.toLocaleString()} 
                        ({sim.statistics.totalPLPercent > 0 ? '+' : ''}{sim.statistics.totalPLPercent.toFixed(2)}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${sim.statistics.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${sim.statistics.totalPL.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{sim.statistics.totalTrades} trades</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
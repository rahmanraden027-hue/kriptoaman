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

  const handleToggleComparison = (simId) => {
    setSelectedForComparison(prev =>
      prev.includes(simId) ? prev.filter(id => id !== simId) : [...prev, simId]
    );
  };

  const comparableSimulations = simulations.filter(sim => selectedForComparison.includes(sim.id));

  return (
    <div className="space-y-6">
      {/* Advanced Features Toggle */}
      <Button
        onClick={() => setShowAdvanced(!showAdvanced)}
        variant="outline"
        className="bg-slate-900/40 border-slate-700/40 text-slate-300 h-9"
      >
        <ChevronDown className={`w-4 h-4 mr-2 transition ${showAdvanced ? 'rotate-180' : ''}`} />
        Advanced Backtesting
      </Button>

      {/* Metrics Builder (Advanced) */}
      {showAdvanced && (
        <MetricsBuilder 
          onMetricsChange={setSelectedMetrics} 
          defaultMetrics={selectedMetrics}
        />
      )}

      {/* Simulation Runner */}
      <SimulationRunner
        strategy={strategy}
        onSimulationComplete={handleSimulationComplete}
        showAdvanced={showAdvanced}
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

      {/* Simulation History & Comparison */}
      {simulations.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Riwayat Simulasi</h3>
            {showAdvanced && (
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant="outline"
                className="h-8 text-xs bg-slate-900/40 border-slate-700/40"
                disabled={selectedForComparison.length < 2}
              >
                Compare ({selectedForComparison.length})
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              {simulations.map((sim) => (
                <div key={sim.id} className={`p-3 rounded-lg border transition ${
                  selectedSimulation?.id === sim.id
                    ? 'bg-blue-600/20 border-blue-500/40'
                    : 'bg-slate-900/40 border-slate-700/40 hover:border-slate-600/40'
                }`}>
                  <button
                    onClick={() => setSelectedSimulation(sim)}
                    className="w-full text-left"
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

                  {showAdvanced && (
                    <div className="mt-2 pt-2 border-t border-slate-700/40 flex gap-2">
                      <Button
                        onClick={() => handleToggleComparison(sim.id)}
                        variant="ghost"
                        size="sm"
                        className={`h-6 text-xs ${
                          selectedForComparison.includes(sim.id)
                            ? 'bg-blue-600/30 text-blue-300'
                            : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {selectedForComparison.includes(sim.id) ? '✓ Selected' : 'Select for Compare'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strategy Comparison Dashboard */}
      {showComparison && showAdvanced && comparableSimulations.length >= 2 && (
        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Performance Comparison</h3>
            <Button
              onClick={() => setShowComparison(false)}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-300"
            >
              Close
            </Button>
          </div>
          <StrategyComparisonDashboard
            simulations={comparableSimulations}
            selectedMetrics={selectedMetrics.length > 0 ? selectedMetrics : ['totalTrades', 'winRate', 'totalPL', 'sharpeRatio']}
          />
        </div>
      )}
    </div>
  );
}
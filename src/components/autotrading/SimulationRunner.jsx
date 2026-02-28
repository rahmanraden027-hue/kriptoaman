import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlayCircle } from 'lucide-react';
import BacktestDateRangePicker from './BacktestDateRangePicker';

export default function SimulationRunner({ strategy, onSimulationComplete, showAdvanced = false }) {
  const [loading, setLoading] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [startingCapital, setStartingCapital] = useState('10000');
  const [simulationDays, setSimulationDays] = useState('30');
  const [dateRange, setDateRange] = useState(null);

  const handleRunSimulation = async () => {
    if (!startingCapital || !simulationDays) {
      alert('Mohon isi semua field');
      return;
    }

    setLoading(true);

    const response = await base44.functions.invoke('runPaperTradeSimulation', {
      strategyId: strategy.id,
      startingCapital: parseFloat(startingCapital),
      simulationDays: parseInt(simulationDays),
      simulationName: simulationName || `${strategy.name} Simulation`,
      dateRange: dateRange
    });

    setLoading(false);
    onSimulationComplete(response.data.simulation);
    setSimulationName('');
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">Jalankan Simulasi</h3>

      <div className="space-y-3">
        <div>
          <label className="text-sm text-slate-300 block mb-2">Nama Simulasi (Opsional)</label>
          <Input
            value={simulationName}
            onChange={(e) => setSimulationName(e.target.value)}
            placeholder={`${strategy.name} Simulation`}
            className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600"
          />
        </div>

        {showAdvanced && <BacktestDateRangePicker onRangeSelect={setDateRange} />}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-300 block mb-2">Modal Awal (USD)</label>
            <Input
              type="number"
              value={startingCapital}
              onChange={(e) => setStartingCapital(e.target.value)}
              min="100"
              step="100"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-2">Durasi Simulasi (Hari)</label>
            <Input
              type="number"
              value={simulationDays}
              onChange={(e) => setSimulationDays(e.target.value)}
              min="5"
              max="365"
              step="5"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </div>

        <Button
          onClick={handleRunSimulation}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menjalankan Simulasi...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" />
              Jalankan Simulasi
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
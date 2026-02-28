import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AlgorithmicExecution({ pair, totalQuantity, currentPrice, strategyId }) {
  const [algorithm, setAlgorithm] = useState('twap');
  const [duration, setDuration] = useState(60); // seconds
  const [isExecuting, setIsExecuting] = useState(false);

  const executionPlan = useMemo(() => {
    if (!totalQuantity || !duration) return null;

    const orders = [];
    if (algorithm === 'twap') {
      // TWAP: Time Weighted Average Price - divide orders evenly by time
      const slices = Math.ceil(duration / 10); // 10-second intervals
      const qtyPerSlice = totalQuantity / slices;
      for (let i = 0; i < slices; i++) {
        orders.push({
          slice: i + 1,
          quantity: qtyPerSlice,
          estimatedTime: `${(i + 1) * 10}s`,
          description: `TWAP Slice ${i + 1}/${slices}`,
        });
      }
    } else if (algorithm === 'vwap') {
      // VWAP: Volume Weighted Average Price - weighted by volume profile
      const slices = 5;
      const volumeWeights = [0.05, 0.15, 0.4, 0.25, 0.15]; // Realistic volume profile
      for (let i = 0; i < slices; i++) {
        orders.push({
          slice: i + 1,
          quantity: totalQuantity * volumeWeights[i],
          estimatedTime: `${(i + 1) * (duration / slices)}s`,
          description: `VWAP Slice ${i + 1}/${slices}`,
        });
      }
    }

    return orders;
  }, [algorithm, totalQuantity, duration]);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      // Execute algorithmic order
      await base44.functions.invoke('executeAlgorithmicOrder', {
        strategyId,
        pair,
        totalQuantity,
        algorithm,
        duration,
        executionPlan,
      });
      setIsExecuting(false);
    } catch (error) {
      console.error('Execution failed:', error);
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white">Algorithmic Execution</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Algorithm</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={isExecuting}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="twap">TWAP (Time-Weighted)</option>
            <option value="vwap">VWAP (Volume-Weighted)</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Duration (seconds)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={isExecuting}
            min="10"
            max="3600"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Execution Plan Preview */}
      {executionPlan && (
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-3">Execution Plan ({algorithm.toUpperCase()})</p>
          <div className="space-y-2">
            {executionPlan.map((order, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{order.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{order.quantity.toFixed(4)} units</span>
                  <span className="text-slate-500">{order.estimatedTime}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-600/40 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Quantity:</span>
            <span className="text-white font-semibold">{totalQuantity.toFixed(4)} units</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-slate-400">Estimated Fill Time:</span>
            <span className="text-white font-semibold">{duration}s</span>
          </div>
        </div>
      )}

      <Button
        onClick={handleExecute}
        disabled={isExecuting || !executionPlan}
        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
      >
        {isExecuting && <Loader2 className="w-4 h-4 animate-spin" />}
        Execute {algorithm.toUpperCase()}
      </Button>
    </div>
  );
}
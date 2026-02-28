import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

const ALL_METRICS = [
  { id: 'totalTrades', label: 'Total Trades', category: 'overview' },
  { id: 'winRate', label: 'Win Rate (%)', category: 'overview' },
  { id: 'totalPL', label: 'Total P/L ($)', category: 'overview' },
  { id: 'totalPLPercent', label: 'Return (%)', category: 'overview' },
  { id: 'sharpeRatio', label: 'Sharpe Ratio', category: 'risk' },
  { id: 'maxDrawdown', label: 'Max Drawdown (%)', category: 'risk' },
  { id: 'profitFactor', label: 'Profit Factor', category: 'performance' },
  { id: 'avgWin', label: 'Avg Win ($)', category: 'performance' },
  { id: 'avgLoss', label: 'Avg Loss ($)', category: 'performance' },
  { id: 'winningTrades', label: 'Winning Trades', category: 'performance' },
  { id: 'losingTrades', label: 'Losing Trades', category: 'performance' }
];

export default function MetricsBuilder({ onMetricsChange, defaultMetrics = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(
    defaultMetrics.length > 0 ? defaultMetrics : ['totalTrades', 'winRate', 'totalPL', 'sharpeRatio', 'maxDrawdown']
  );

  const handleToggle = (metricId) => {
    const updated = selectedMetrics.includes(metricId)
      ? selectedMetrics.filter(m => m !== metricId)
      : [...selectedMetrics, metricId];
    
    setSelectedMetrics(updated);
    onMetricsChange(updated);
  };

  const handleSelectAll = () => {
    if (selectedMetrics.length === ALL_METRICS.length) {
      setSelectedMetrics([]);
      onMetricsChange([]);
    } else {
      const all = ALL_METRICS.map(m => m.id);
      setSelectedMetrics(all);
      onMetricsChange(all);
    }
  };

  const categories = ['overview', 'risk', 'performance'];
  const categoryLabels = { overview: 'Overview', risk: 'Risk Metrics', performance: 'Performance' };

  return (
    <Card className="bg-slate-800/60 border-slate-700/40 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Evaluation Metrics</h4>
          <Button
            onClick={() => setExpanded(!expanded)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <ChevronDown className={`w-4 h-4 transition ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {expanded && (
          <div className="space-y-4">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              className="w-full h-8 text-xs bg-slate-900/40 border-slate-700/40"
            >
              {selectedMetrics.length === ALL_METRICS.length ? 'Deselect All' : 'Select All'}
            </Button>

            {categories.map(category => (
              <div key={category}>
                <p className="text-xs text-slate-400 font-semibold mb-2 uppercase">{categoryLabels[category]}</p>
                <div className="space-y-2">
                  {ALL_METRICS.filter(m => m.category === category).map(metric => (
                    <div key={metric.id} className="flex items-center gap-2">
                      <Checkbox
                        id={metric.id}
                        checked={selectedMetrics.includes(metric.id)}
                        onCheckedChange={() => handleToggle(metric.id)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={metric.id} className="text-xs text-slate-300 cursor-pointer">
                        {metric.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Metrics Display */}
        <div className="bg-slate-900/40 rounded-lg p-3 mt-3">
          <p className="text-xs text-slate-400 mb-2">Selected ({selectedMetrics.length})</p>
          <div className="flex flex-wrap gap-1">
            {selectedMetrics.map(metricId => {
              const metric = ALL_METRICS.find(m => m.id === metricId);
              return (
                <span key={metricId} className="text-xs bg-slate-700/40 text-slate-300 px-2 py-1 rounded">
                  {metric.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
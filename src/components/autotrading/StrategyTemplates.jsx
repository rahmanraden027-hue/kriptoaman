import React from 'react';
import { TrendingUp, Zap, Activity } from 'lucide-react';

const TEMPLATES = {
  rsi: {
    name: 'RSI Strategy',
    description: 'Relative Strength Index - identifies overbought/oversold conditions',
    icon: TrendingUp,
    entryCondition: {
      indicator: 'rsi',
      oversold: 30,
      overbought: 70,
      period: 14
    },
    recommendedRisk: 'Low to Medium'
  },
  macd: {
    name: 'MACD Crossover',
    description: 'Moving Average Convergence Divergence - trend following strategy',
    icon: Activity,
    entryCondition: {
      indicator: 'macd',
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    },
    recommendedRisk: 'Medium'
  },
  bollinger: {
    name: 'Bollinger Bands',
    description: 'Mean reversion strategy using standard deviation bands',
    icon: Zap,
    entryCondition: {
      indicator: 'bollinger',
      period: 20,
      stdDev: 2
    },
    recommendedRisk: 'Medium to High'
  }
};

export default function StrategyTemplates({ onSelectTemplate, selectedTemplate }) {
  return (
    <div className="space-y-3">
      <h3 className="text-white font-bold text-sm">Template Strategi</h3>
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(TEMPLATES).map(([key, template]) => {
          const Icon = template.icon;
          const isSelected = selectedTemplate === key;

          return (
            <button
              key={key}
              onClick={() => onSelectTemplate(key)}
              className={`p-4 rounded-lg text-left border-2 transition-all ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500'
                  : 'bg-slate-800/60 border-slate-700/40 hover:border-slate-600/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                    {template.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{template.description}</div>
                  <div className="text-xs text-slate-500 mt-2">Risk: {template.recommendedRisk}</div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Custom Strategy Option */}
        <button
          onClick={() => onSelectTemplate('custom')}
          className={`p-4 rounded-lg text-left border-2 transition-all ${
            selectedTemplate === 'custom'
              ? 'bg-purple-600/20 border-purple-500'
              : 'bg-slate-800/60 border-slate-700/40 hover:border-slate-600/60'
          }`}
        >
          <div className="flex items-start gap-3">
            <Zap className={`w-5 h-5 mt-0.5 ${selectedTemplate === 'custom' ? 'text-purple-400' : 'text-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${selectedTemplate === 'custom' ? 'text-purple-300' : 'text-white'}`}>
                Custom Strategy
              </div>
              <div className="text-xs text-slate-400 mt-1">Buat strategi trading kustom sesuai kebutuhan Anda</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
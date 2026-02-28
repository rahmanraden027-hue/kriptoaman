import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const INDICATORS = [
  { id: 'ma20', label: 'Moving Average (20)', color: '#fbbf24' },
  { id: 'ma50', label: 'Moving Average (50)', color: '#f97316' },
  { id: 'ema12', label: 'EMA (12)', color: '#3b82f6' },
  { id: 'ema26', label: 'EMA (26)', color: '#06b6d4' },
  { id: 'rsi', label: 'RSI (14)', color: '#8b5cf6' },
  { id: 'macd', label: 'MACD', color: '#ec4899' },
  { id: 'bollinger', label: 'Bollinger Bands', color: '#10b981' },
];

export default function ChartIndicators({ enabledIndicators, onToggle }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {INDICATORS.map(indicator => (
        <div key={indicator.id} className="flex items-center gap-2 p-2 bg-slate-700/20 rounded-lg cursor-pointer" onClick={() => onToggle(indicator.id)}>
          <Checkbox
            checked={enabledIndicators[indicator.id] || false}
            onChange={() => onToggle(indicator.id)}
          />
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: indicator.color }}
            />
            <label className="text-xs text-slate-300 cursor-pointer flex-1">
              {indicator.label}
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
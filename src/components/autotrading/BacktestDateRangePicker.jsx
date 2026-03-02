import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, CheckCircle2 } from 'lucide-react';

const PRESETS = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '180D', days: 180 },
  { label: '1Y', days: 365 },
  { label: '2Y', days: 730 },
];

export default function BacktestDateRangePicker({ onRangeSelect }) {
  const [activePreset, setActivePreset] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [appliedLabel, setAppliedLabel] = useState('30D');

  const handlePresetClick = (days, label) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setActivePreset(days);
    setIsCustom(false);
    setAppliedLabel(label);
    onRangeSelect({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      days
    });
  };

  const handleCustomApply = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    setActivePreset(null);
    setAppliedLabel(`${startDate} → ${endDate}`);
    onRangeSelect({ startDate, endDate, days });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white">Periode Backtest</span>
        {appliedLabel && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 className="w-3 h-3" /> {appliedLabel}
          </span>
        )}
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(({ label, days }) => (
          <button
            key={days}
            onClick={() => handlePresetClick(days, label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              activePreset === days && !isCustom
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => { setIsCustom(!isCustom); setActivePreset(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isCustom
              ? 'bg-purple-600 border-purple-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom range inputs */}
      {isCustom && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/40">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Tanggal Mulai</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white text-xs h-8"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Tanggal Akhir</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="bg-slate-900 border-slate-700 text-white text-xs h-8"
            />
          </div>
          <Button
            onClick={handleCustomApply}
            disabled={!startDate || !endDate || new Date(startDate) >= new Date(endDate)}
            className="col-span-2 bg-purple-600 hover:bg-purple-700 h-8 text-xs"
          >
            Terapkan Range
          </Button>
        </div>
      )}
    </div>
  );
}
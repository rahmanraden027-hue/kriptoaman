import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function BacktestDateRangePicker({ onRangeSelect }) {
  const [isCustom, setIsCustom] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const presetRanges = [
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
    { label: '180 Days', days: 180 },
    { label: '1 Year', days: 365 }
  ];

  const handlePresetClick = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    onRangeSelect({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      days
    });
  };

  const handleCustomApply = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    onRangeSelect({
      startDate,
      endDate,
      days
    });
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700/40 p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h4 className="text-sm font-semibold text-white">Backtest Period</h4>
        </div>

        {/* Preset Ranges */}
        <div className="grid grid-cols-2 gap-2">
          {presetRanges.map((range) => (
            <Button
              key={range.days}
              onClick={() => handlePresetClick(range.days)}
              variant="outline"
              className="text-xs h-8 bg-slate-900/40 border-slate-700/40 hover:border-slate-600/40"
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Custom Range Toggle */}
        <Button
          onClick={() => setIsCustom(!isCustom)}
          variant="ghost"
          className="w-full text-xs text-slate-400 hover:text-slate-300"
        >
          {isCustom ? 'Hide Custom Range' : 'Custom Range'}
        </Button>

        {/* Custom Date Picker */}
        {isCustom && (
          <div className="space-y-3 pt-3 border-t border-slate-700/40">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white text-xs h-8"
              />
            </div>
            <Button
              onClick={handleCustomApply}
              className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs"
            >
              Apply Custom Range
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
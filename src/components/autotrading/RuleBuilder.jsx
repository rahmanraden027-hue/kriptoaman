import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const INDICATORS = [
  { value: 'RSI', label: 'RSI (Relative Strength Index)', hint: 'Overbought >70, Oversold <30' },
  { value: 'EMA9', label: 'EMA 9', hint: 'Exponential Moving Average 9 periode' },
  { value: 'EMA21', label: 'EMA 21', hint: 'Exponential Moving Average 21 periode' },
  { value: 'EMA50', label: 'EMA 50', hint: 'Exponential Moving Average 50 periode' },
  { value: 'EMA200', label: 'EMA 200', hint: 'Exponential Moving Average 200 periode' },
  { value: 'SMA20', label: 'SMA 20', hint: 'Simple Moving Average 20 periode' },
  { value: 'SMA50', label: 'SMA 50', hint: 'Simple Moving Average 50 periode' },
  { value: 'MACD', label: 'MACD Line', hint: 'Moving Average Convergence Divergence' },
  { value: 'MACD_SIGNAL', label: 'MACD Signal', hint: 'Garis signal MACD' },
  { value: 'PRICE', label: 'Harga Saat Ini', hint: 'Harga pasar real-time' },
  { value: 'BB_UPPER', label: 'Bollinger Upper Band', hint: 'Batas atas Bollinger Bands' },
  { value: 'BB_LOWER', label: 'Bollinger Lower Band', hint: 'Batas bawah Bollinger Bands' },
];

const CONDITIONS = [
  { value: 'less_than', label: 'Kurang dari (<)' },
  { value: 'greater_than', label: 'Lebih dari (>)' },
  { value: 'less_than_equal', label: 'Kurang atau sama (≤)' },
  { value: 'greater_than_equal', label: 'Lebih atau sama (≥)' },
  { value: 'crosses_above', label: 'Menembus ke atas' },
  { value: 'crosses_below', label: 'Menembus ke bawah' },
];

const PRESETS = {
  entry: [
    {
      label: 'RSI Oversold (Beli)',
      rules: [{ indicator: 'RSI', condition: 'less_than', value: 30, logic: 'AND' }]
    },
    {
      label: 'EMA Golden Cross (Beli)',
      rules: [
        { indicator: 'EMA9', condition: 'greater_than', value: 0, logic: 'AND' },
        { indicator: 'EMA21', condition: 'less_than', value: 0, logic: 'AND' },
      ]
    },
    {
      label: 'Harga di bawah BB Lower',
      rules: [{ indicator: 'PRICE', condition: 'less_than', value: 0, logic: 'AND' }]
    },
    {
      label: 'MACD Bullish Cross',
      rules: [{ indicator: 'MACD', condition: 'greater_than', value: 0, logic: 'AND' }]
    },
  ],
  exit: [
    {
      label: 'RSI Overbought (Jual)',
      rules: [{ indicator: 'RSI', condition: 'greater_than', value: 70, logic: 'AND' }]
    },
    {
      label: 'EMA Death Cross (Jual)',
      rules: [{ indicator: 'EMA9', condition: 'less_than', value: 0, logic: 'AND' }]
    },
    {
      label: 'MACD Bearish',
      rules: [{ indicator: 'MACD', condition: 'less_than', value: 0, logic: 'AND' }]
    },
  ]
};

function RuleRow({ rule, index, onChange, onRemove, showLogic }) {
  return (
    <div className="flex flex-wrap gap-2 items-start bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
      {showLogic && index > 0 && (
        <Select value={rule.logic || 'AND'} onValueChange={v => onChange(index, 'logic', v)}>
          <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-white text-xs h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Select value={rule.indicator} onValueChange={v => onChange(index, 'indicator', v)}>
        <SelectTrigger className="flex-1 min-w-[140px] bg-slate-700 border-slate-600 text-white text-xs h-9">
          <SelectValue placeholder="Indikator" />
        </SelectTrigger>
        <SelectContent>
          {INDICATORS.map(i => (
            <SelectItem key={i.value} value={i.value}>
              <div>
                <p className="font-medium">{i.label}</p>
                <p className="text-xs text-slate-400">{i.hint}</p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={rule.condition} onValueChange={v => onChange(index, 'condition', v)}>
        <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white text-xs h-9">
          <SelectValue placeholder="Kondisi" />
        </SelectTrigger>
        <SelectContent>
          {CONDITIONS.map(c => (
            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={rule.value ?? ''}
        onChange={e => onChange(index, 'value', parseFloat(e.target.value))}
        placeholder="Nilai"
        className="w-24 bg-slate-700 border-slate-600 text-white text-xs h-9"
      />
      <Button size="icon" variant="ghost" onClick={() => onRemove(index)}
        className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function RuleBuilder({ label, color = 'blue', rules, onChange, presetType = 'entry' }) {
  const addRule = () => onChange([...rules, { indicator: 'RSI', condition: 'less_than', value: 30, logic: 'AND' }]);
  const removeRule = (i) => onChange(rules.filter((_, idx) => idx !== i));
  const updateRule = (i, key, val) => {
    const updated = [...rules];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  };
  const applyPreset = (preset) => onChange(preset.rules);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={`text-sm font-bold text-${color}-400`}>{label}</p>
        <Button size="sm" variant="outline"
          onClick={addRule}
          className="h-7 text-xs border-slate-600 text-slate-300 hover:text-white">
          <Plus className="w-3 h-3 mr-1" /> Tambah Rule
        </Button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS[presetType]?.map((p, i) => (
          <button key={i} onClick={() => applyPreset(p)}
            className="text-[10px] px-2 py-1 rounded-full bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:bg-slate-700 transition-colors">
            ⚡ {p.label}
          </button>
        ))}
      </div>

      {rules.length === 0 ? (
        <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center text-slate-500 text-xs">
          Belum ada rule. Gunakan preset atau tambah manual.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <RuleRow key={i} rule={rule} index={i} onChange={updateRule} onRemove={removeRule} showLogic={true} />
          ))}
        </div>
      )}
    </div>
  );
}
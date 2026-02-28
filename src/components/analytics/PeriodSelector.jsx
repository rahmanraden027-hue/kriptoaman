import React from 'react';
import { Calendar } from 'lucide-react';

export default function PeriodSelector({ period, onPeriodChange }) {
  const periods = [
    { id: 'daily', label: 'Harian' },
    { id: 'weekly', label: 'Mingguan' },
    { id: 'monthly', label: 'Bulanan' }
  ];

  return (
    <div className="flex items-center gap-3 mb-6">
      <Calendar className="w-5 h-5 text-slate-400" />
      <div className="flex gap-2">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => onPeriodChange(p.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              period === p.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
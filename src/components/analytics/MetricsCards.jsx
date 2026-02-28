import React from 'react';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';

export default function MetricsCards({ metrics }) {
  const metricList = [
    {
      label: 'Total P/L',
      value: `$${metrics.totalPL.toFixed(2)}`,
      change: metrics.totalPL,
      icon: metrics.totalPL >= 0 ? TrendingUp : TrendingDown,
      color: metrics.totalPL >= 0 ? 'green' : 'red'
    },
    {
      label: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      change: metrics.totalTrades > 0 ? metrics.winTrades : 0,
      icon: Target,
      color: metrics.winRate >= 50 ? 'green' : 'orange'
    },
    {
      label: 'Avg P/L per Trade',
      value: `$${metrics.avgPLPerTrade.toFixed(2)}`,
      change: metrics.avgPLPerTrade,
      icon: Activity,
      color: metrics.avgPLPerTrade >= 0 ? 'green' : 'red'
    },
    {
      label: 'Total Trades',
      value: metrics.totalTrades,
      change: metrics.totalTrades,
      icon: Activity,
      color: 'blue'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      green: 'bg-green-500/10 border-green-500/20',
      red: 'bg-red-500/10 border-red-500/20',
      orange: 'bg-orange-500/10 border-orange-500/20',
      blue: 'bg-blue-500/10 border-blue-500/20'
    };
    return colors[color] || colors.blue;
  };

  const getTextColor = (color) => {
    const colors = {
      green: 'text-green-400',
      red: 'text-red-400',
      orange: 'text-orange-400',
      blue: 'text-blue-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metricList.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div
            key={idx}
            className={`border rounded-lg p-4 ${getColorClasses(metric.color)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-slate-400 text-sm font-medium">{metric.label}</div>
                <div className={`text-2xl font-bold mt-1 ${getTextColor(metric.color)}`}>
                  {metric.value}
                </div>
              </div>
              <Icon className={`w-5 h-5 ${getTextColor(metric.color)}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
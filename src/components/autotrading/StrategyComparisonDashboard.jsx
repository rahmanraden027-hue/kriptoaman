import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const METRIC_CONFIG = {
  totalTrades: { label: 'Total Trades', format: 'number' },
  winRate: { label: 'Win Rate (%)', format: 'percent' },
  totalPL: { label: 'Total P/L ($)', format: 'currency' },
  totalPLPercent: { label: 'Return (%)', format: 'percent' },
  sharpeRatio: { label: 'Sharpe Ratio', format: 'decimal' },
  maxDrawdown: { label: 'Max Drawdown (%)', format: 'percent' },
  profitFactor: { label: 'Profit Factor', format: 'decimal' },
  avgWin: { label: 'Avg Win ($)', format: 'currency' },
  avgLoss: { label: 'Avg Loss ($)', format: 'currency' },
  winningTrades: { label: 'Winning Trades', format: 'number' },
  losingTrades: { label: 'Losing Trades', format: 'number' }
};

export default function StrategyComparisonDashboard({ simulations, selectedMetrics = [] }) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const comparisonData = useMemo(() => {
    if (!simulations || simulations.length === 0) return [];

    return selectedMetrics.map((metricId, idx) => ({
      metricId,
      data: simulations.map(sim => ({
        name: sim.simulationName.substring(0, 15),
        [metricId]: sim.statistics[metricId] || 0,
        fullName: sim.simulationName
      }))
    }));
  }, [simulations, selectedMetrics]);

  const equityOverlayData = useMemo(() => {
    if (!simulations || simulations.length === 0) return [];

    const maxLength = Math.max(...simulations.map(s => s.equityData?.length || 0));
    const result = [];

    for (let i = 0; i < maxLength; i++) {
      const point = { date: '' };
      simulations.forEach((sim, idx) => {
        if (sim.equityData && sim.equityData[i]) {
          point.date = sim.equityData[i].date;
          point[`sim${idx}_equity`] = sim.equityData[i].equity;
        }
      });
      result.push(point);
    }

    return result;
  }, [simulations]);

  const formatValue = (value, format) => {
    if (format === 'currency') return `$${value.toFixed(2)}`;
    if (format === 'percent') return `${value.toFixed(2)}%`;
    if (format === 'decimal') return value.toFixed(4);
    return Math.round(value);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Comparison Table */}
      <Card className="bg-slate-800/60 border-slate-700/40">
        <CardHeader>
          <CardTitle className="text-white">Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/40">
                  <th className="text-left py-2 px-3 text-slate-400 font-semibold">Metric</th>
                  {simulations.map((sim, idx) => (
                    <th key={idx} className="text-right py-2 px-3 text-slate-300 font-semibold">
                      <div className="truncate" title={sim.simulationName}>{sim.simulationName.substring(0, 20)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedMetrics.map(metricId => {
                  const config = METRIC_CONFIG[metricId];
                  return (
                    <tr key={metricId} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                      <td className="py-2 px-3 text-slate-300 font-medium">{config.label}</td>
                      {simulations.map((sim, idx) => {
                        const value = sim.statistics[metricId] || 0;
                        const isPositive = value > 0;
                        return (
                          <td key={idx} className={`text-right py-2 px-3 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {formatValue(value, config.format)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Bar Charts */}
      {comparisonData.map((metric, idx) => (
        <Card key={metric.metricId} className="bg-slate-800/60 border-slate-700/40">
          <CardHeader>
            <CardTitle className="text-white text-base">{METRIC_CONFIG[metric.metricId].label}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metric.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#cbd5e1' }}
                  formatter={(value) => formatValue(value, METRIC_CONFIG[metric.metricId].format)}
                />
                <Bar dataKey={metric.metricId} fill={colors[idx % colors.length]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}

      {/* Equity Curve Overlay */}
      {equityOverlayData.length > 0 && (
        <Card className="bg-slate-800/60 border-slate-700/40">
          <CardHeader>
            <CardTitle className="text-white">Equity Curve Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={equityOverlayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#cbd5e1' }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {simulations.map((sim, idx) => (
                  <Line
                    key={idx}
                    type="monotone"
                    dataKey={`sim${idx}_equity`}
                    stroke={colors[idx % colors.length]}
                    name={sim.simulationName.substring(0, 20)}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
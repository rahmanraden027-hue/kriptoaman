import React, { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AnomalyDetection({ marketCondition, trades = [] }) {
  const anomalies = useMemo(() => {
    const detected = [];

    if (!marketCondition) return detected;

    // Volatility anomaly
    if (marketCondition.volatility > 8) {
      detected.push({
        id: 'vol',
        type: 'critical',
        title: 'Extreme Volatility',
        description: `Volatility at ${marketCondition.volatility.toFixed(2)}% - consider reducing position size`,
        icon: Zap,
      });
    }

    // Risk level anomaly
    if (marketCondition.riskLevel === 'high') {
      detected.push({
        id: 'risk',
        type: 'warning',
        title: 'High Risk Environment',
        description: 'Market conditions indicate elevated risk - review open positions',
        icon: AlertTriangle,
      });
    }

    // Trend reversal anomaly
    if (marketCondition.alerts?.some(a => a.type === 'trend_reversal')) {
      detected.push({
        id: 'trend',
        type: 'warning',
        title: 'Trend Reversal Detected',
        description: `Strong ${marketCondition.trend} trend detected - verify strategy alignment`,
        icon: TrendingDown,
      });
    }

    // Win rate degradation (if historical data available)
    const recentWins = trades.filter(t => t.realizedPL > 0).length;
    const recentTrades = trades.length;
    if (recentTrades > 5) {
      const winRate = (recentWins / recentTrades) * 100;
      if (winRate < 40) {
        detected.push({
          id: 'wr',
          type: 'warning',
          title: 'Low Win Rate',
          description: `Recent win rate at ${winRate.toFixed(0)}% - consider strategy review`,
          icon: TrendingDown,
        });
      }
    }

    return detected;
  }, [marketCondition, trades]);

  if (anomalies.length === 0) {
    return (
      <Card className="bg-slate-800/60 border-slate-700/40 p-6">
        <p className="text-center text-slate-400 py-4">✓ No anomalies detected</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {anomalies.map(anomaly => {
        const Icon = anomaly.icon;
        const bgColor = anomaly.type === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30';
        const textColor = anomaly.type === 'critical' ? 'text-red-400' : 'text-yellow-400';

        return (
          <Card key={anomaly.id} className={`border p-4 ${bgColor}`}>
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 ${textColor} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`font-semibold ${textColor}`}>{anomaly.title}</p>
                <p className="text-sm text-slate-300 mt-1">{anomaly.description}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
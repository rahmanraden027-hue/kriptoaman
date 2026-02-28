import React, { useMemo, useState } from 'react';
import { LineChart, Line, AreaChart, Area, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ChartIndicators from './ChartIndicators';
import ChartTemplateManager from './ChartTemplateManager';

const INDICATOR_COLORS = {
  ma20: '#fbbf24',
  ma50: '#f97316',
  ema12: '#3b82f6',
  ema26: '#06b6d4',
  rsi: '#8b5cf6',
  macd: '#ec4899',
  macdSignal: '#f472b6',
  bollinger: '#10b981',
};

export default function AdvancedChart({ 
  data = [], 
  title = 'Price Chart',
  onTemplateApply,
  showTemplateManager = true 
}) {
  const [enabledIndicators, setEnabledIndicators] = useState({
    ma20: false,
    ma50: false,
    ema12: false,
    ema26: false,
    rsi: false,
    macd: false,
    bollinger: false,
  });

  const [showIndicatorPanel, setShowIndicatorPanel] = useState(false);
  const [chartType, setChartType] = useState('line');

  // Calculate technical indicators
  const chartDataWithIndicators = useMemo(() => {
    if (!data || data.length === 0) return [];

    let enrichedData = data.map(d => ({ ...d }));

    // Moving Average (20 & 50)
    if (enabledIndicators.ma20 || enabledIndicators.ma50) {
      enrichedData = enrichedData.map((item, idx) => {
        const ma20Data = enrichedData.slice(Math.max(0, idx - 19), idx + 1);
        const ma50Data = enrichedData.slice(Math.max(0, idx - 49), idx + 1);
        
        return {
          ...item,
          ma20: enabledIndicators.ma20 ? (ma20Data.reduce((sum, d) => sum + (d.close || d.value || 0), 0) / ma20Data.length) : undefined,
          ma50: enabledIndicators.ma50 ? (ma50Data.reduce((sum, d) => sum + (d.close || d.value || 0), 0) / ma50Data.length) : undefined,
        };
      });
    }

    // RSI (14)
    if (enabledIndicators.rsi) {
      enrichedData = enrichedData.map((item, idx) => {
        const rsiPeriod = 14;
        const slice = enrichedData.slice(Math.max(0, idx - rsiPeriod), idx + 1);
        let gains = 0, losses = 0;
        
        for (let i = 1; i < slice.length; i++) {
          const diff = (slice[i].close || slice[i].value || 0) - (slice[i - 1].close || slice[i - 1].value || 0);
          if (diff > 0) gains += diff;
          else losses += Math.abs(diff);
        }
        
        const avgGain = gains / rsiPeriod;
        const avgLoss = losses / rsiPeriod;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return { ...item, rsi: enabledIndicators.rsi ? rsi : undefined };
      });
    }

    // MACD
    if (enabledIndicators.macd) {
      enrichedData = enrichedData.map((item, idx) => {
        const ema12Period = 12;
        const ema26Period = 26;
        const slice = enrichedData.slice(Math.max(0, idx - Math.max(ema12Period, ema26Period)), idx + 1);
        
        const calcEMA = (data, period) => {
          let ema = data[0].close || data[0].value || 0;
          const multiplier = 2 / (period + 1);
          for (let i = 1; i < data.length; i++) {
            ema = ((data[i].close || data[i].value || 0) - ema) * multiplier + ema;
          }
          return ema;
        };
        
        const ema12 = calcEMA(slice, ema12Period);
        const ema26 = calcEMA(slice, ema26Period);
        const macd = ema12 - ema26;
        
        return { ...item, macd: enabledIndicators.macd ? macd : undefined };
      });
    }

    // Bollinger Bands
    if (enabledIndicators.bollinger) {
      enrichedData = enrichedData.map((item, idx) => {
        const period = 20;
        const slice = enrichedData.slice(Math.max(0, idx - period), idx + 1);
        const prices = slice.map(d => d.close || d.value || 0);
        const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        
        return {
          ...item,
          bb_upper: enabledIndicators.bollinger ? sma + 2 * stdDev : undefined,
          bb_middle: enabledIndicators.bollinger ? sma : undefined,
          bb_lower: enabledIndicators.bollinger ? sma - 2 * stdDev : undefined,
        };
      });
    }

    return enrichedData;
  }, [data, enabledIndicators]);

  const renderChart = () => {
    if (!chartDataWithIndicators || chartDataWithIndicators.length === 0) {
      return <p className="text-slate-400 text-center py-8">No chart data available</p>;
    }

    const commonProps = {
      data: chartDataWithIndicators,
      margin: { top: 5, right: 30, left: 0, bottom: 5 },
    };

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
            {enabledIndicators.ma20 && <Line type="monotone" dataKey="ma20" stroke={INDICATOR_COLORS.ma20} dot={false} strokeWidth={2} />}
            {enabledIndicators.ma50 && <Line type="monotone" dataKey="ma50" stroke={INDICATOR_COLORS.ma50} dot={false} strokeWidth={2} />}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="time" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} strokeWidth={2} />
          {enabledIndicators.ma20 && <Line type="monotone" dataKey="ma20" stroke={INDICATOR_COLORS.ma20} dot={false} strokeWidth={2} />}
          {enabledIndicators.ma50 && <Line type="monotone" dataKey="ma50" stroke={INDICATOR_COLORS.ma50} dot={false} strokeWidth={2} />}
          {enabledIndicators.ema12 && <Line type="monotone" dataKey="ema12" stroke={INDICATOR_COLORS.ema12} dot={false} strokeWidth={2} />}
          {enabledIndicators.ema26 && <Line type="monotone" dataKey="ema26" stroke={INDICATOR_COLORS.ema26} dot={false} strokeWidth={2} />}
          {enabledIndicators.bollinger && (
            <>
              <Line type="monotone" dataKey="bb_upper" stroke={INDICATOR_COLORS.bollinger} dot={false} strokeWidth={1} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="bb_middle" stroke={INDICATOR_COLORS.bollinger} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="bb_lower" stroke={INDICATOR_COLORS.bollinger} dot={false} strokeWidth={1} strokeDasharray="5 5" />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700/40 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showIndicatorPanel ? 'default' : 'outline'}
            onClick={() => setShowIndicatorPanel(!showIndicatorPanel)}
          >
            Indicators
          </Button>
          {showTemplateManager && <ChartTemplateManager onApply={onTemplateApply} />}
        </div>
      </div>

      {showIndicatorPanel && (
        <div className="mb-4 pb-4 border-b border-slate-700/40">
          <ChartIndicators 
            enabledIndicators={enabledIndicators}
            onToggle={(indicator) => setEnabledIndicators(prev => ({ ...prev, [indicator]: !prev[indicator] }))}
          />
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {['line', 'area'].map(type => (
          <Button
            key={type}
            size="sm"
            variant={chartType === type ? 'default' : 'outline'}
            onClick={() => setChartType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      {renderChart()}
    </Card>
  );
}
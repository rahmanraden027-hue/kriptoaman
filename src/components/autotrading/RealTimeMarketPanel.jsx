import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, BarChart3, Activity, Target, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function RealTimeMarketPanel({ pair, symbol }) {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke('getRealtimeMarketData', {
          symbol,
          pair,
        });
        setMarketData(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setMarketData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, [symbol, pair]);

  if (loading) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 text-center">
        <p className="text-slate-400">Memuat data pasar...</p>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <div className="bg-slate-800/60 border border-red-700/40 rounded-xl p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Error: {error || 'No data available'}</span>
        </div>
      </div>
    );
  }

  const indicators = marketData.indicators || {};
  const isUptrend = indicators.trend === 'UPTREND';
  const isDowntrend = indicators.trend === 'DOWNTREND';
  const change = marketData.change24h || 0;
  const isPositiveChange = change >= 0;

  return (
    <div className="space-y-4">
      {/* Price Card */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-slate-400 text-sm">{marketData.pair}</p>
            <p className="text-3xl font-bold text-white mt-1">
              ${marketData.currentPrice.toFixed(2)}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
            isPositiveChange
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {isPositiveChange ? '+' : ''}{change.toFixed(2)}%
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {isUptrend ? (
            <>
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">UPTREND</span>
            </>
          ) : isDowntrend ? (
            <>
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-semibold">DOWNTREND</span>
            </>
          ) : (
            <span className="text-slate-400">NEUTRAL</span>
          )}
        </div>

        {/* Price Levels */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-slate-500">24h High</p>
            <p className="text-white font-semibold">${marketData.marketData.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">24h Low</p>
            <p className="text-white font-semibold">${marketData.marketData.low.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500">Volume</p>
            <p className="text-white font-semibold">${(marketData.volume24h / 1e6).toFixed(0)}M</p>
          </div>
        </div>
      </div>

      {/* Technical Indicators Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* RSI */}
        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">RSI</p>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white">{indicators.rsi?.toFixed(1)}</p>
          <p className={`text-xs mt-1 ${
            indicators.rsi > 70
              ? 'text-red-400'
              : indicators.rsi < 30
              ? 'text-green-400'
              : 'text-slate-400'
          }`}>
            {indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
          </p>
        </Card>

        {/* ATR */}
        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">ATR</p>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-lg font-bold text-white">${indicators.atr?.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Volatility</p>
        </Card>

        {/* MACD */}
        <Card className="bg-slate-800/60 border-slate-700/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">MACD</p>
            <Target className="w-4 h-4 text-yellow-400" />
          </div>
          <p className={`text-lg font-bold ${
            indicators.macd?.histogram > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {indicators.macd?.histogram.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Momentum</p>
        </Card>
      </div>

      {/* Support & Resistance */}
      <Card className="bg-slate-800/60 border-slate-700/40 p-4">
        <p className="text-sm font-semibold text-white mb-3">Support & Resistance</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Resistance</span>
            <span className="text-sm font-bold text-red-400">${indicators.resistance?.toFixed(2)}</span>
          </div>
          <div className="h-2 bg-slate-700/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-red-500"
              style={{
                width: ((marketData.currentPrice - indicators.support) / (indicators.resistance - indicators.support)) * 100 + '%'
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Support</span>
            <span className="text-sm font-bold text-green-400">${indicators.support?.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Last Updated */}
      <p className="text-xs text-slate-500 text-center">
        Updated: {new Date(marketData.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}
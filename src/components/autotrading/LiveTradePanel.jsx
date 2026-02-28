import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LiveTradePanel({ strategy }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: liveTrades = [], refetch } = useQuery({
    queryKey: ['liveTrades', strategy.id],
    queryFn: async () => {
      const result = await base44.entities.LivePaperTrade.filter(
        { strategyId: strategy.id, status: 'open' },
        '-created_date'
      );
      return result;
    },
    refetchInterval: 1000 // Refetch every second
  });

  useEffect(() => {
    setTrades(liveTrades);
  }, [liveTrades]);

  const handleCloseTrade = async (trade, exitPrice) => {
    setLoading(true);
    try {
      await base44.functions.invoke('closeLiveTradeRequest', {
        tradeId: trade.id,
        exitPrice
      });
      refetch();
    } catch (error) {
      console.error('Error closing trade:', error);
    } finally {
      setLoading(false);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 text-center py-12">
        <p className="text-slate-400">No active trades</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <div key={trade.id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white font-semibold">{trade.pair}</p>
              <p className="text-xs text-slate-400 mt-1">
                Entry: ${trade.entryPrice.toFixed(2)} | Size: {trade.quantity.toFixed(4)}
              </p>
            </div>
            <div className={`text-right`}>
              <p className={`text-lg font-bold ${trade.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${trade.unrealizedPL.toFixed(2)}
              </p>
              <p className={`text-sm ${trade.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trade.unrealizedPLPercent > 0 ? '+' : ''}{trade.unrealizedPLPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
            <div className="bg-slate-900/40 rounded p-2">
              <p className="text-slate-400">Current</p>
              <p className="text-white font-semibold">${trade.currentPrice.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/40 rounded p-2">
              <p className="text-slate-400">SL</p>
              <p className="text-red-400 font-semibold">${trade.stopLoss.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/40 rounded p-2">
              <p className="text-slate-400">TP</p>
              <p className="text-green-400 font-semibold">${trade.takeProfit.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleCloseTrade(trade, trade.currentPrice)}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
              Close Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs text-slate-400"
              disabled
            >
              {trade.executionMode === 'manual' ? 'Manual' : 'Auto'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play } from 'lucide-react';

export default function TradeExecutionPanel({ strategy, currentPrice }) {
  const [loading, setLoading] = useState(false);
  const [executionMode, setExecutionMode] = useState('manual');
  const [entryPrice, setEntryPrice] = useState(currentPrice || '');
  const [quantity, setQuantity] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const handleExecuteTrade = async () => {
    if (!entryPrice || !quantity || !stopLoss || !takeProfit) {
      alert('All fields are required');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('executeLiveTradeRequest', {
        strategyId: strategy.id,
        pair: strategy.pair,
        assetClass: strategy.assetClass,
        entryPrice: parseFloat(entryPrice),
        quantity: parseFloat(quantity),
        stopLoss: parseFloat(stopLoss),
        takeProfit: parseFloat(takeProfit),
        executionMode
      });

      // Reset form
      setEntryPrice('');
      setQuantity('');
      setStopLoss('');
      setTakeProfit('');
      alert('Trade executed successfully');
    } catch (error) {
      console.error('Trade execution error:', error);
      alert('Failed to execute trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">Execute Trade</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-300 block mb-2">Entry Price</label>
          <Input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="0.00"
            className="bg-slate-900 border-slate-700 text-white"
            step="0.01"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300 block mb-2">Quantity</label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            className="bg-slate-900 border-slate-700 text-white"
            step="0.0001"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-300 block mb-2">Stop Loss</label>
          <Input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="0.00"
            className="bg-slate-900 border-slate-700 text-white"
            step="0.01"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300 block mb-2">Take Profit</label>
          <Input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="0.00"
            className="bg-slate-900 border-slate-700 text-white"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-300 block mb-2">Execution Mode</label>
        <Select value={executionMode} onValueChange={setExecutionMode}>
          <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual Execution</SelectItem>
            <SelectItem value="automatic">Automatic (Strategy Signal)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleExecuteTrade}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Execute Trade
          </>
        )}
      </Button>
    </div>
  );
}
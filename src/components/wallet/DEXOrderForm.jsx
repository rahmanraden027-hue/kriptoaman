import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, AlertTriangle, CheckCircle2, Loader } from 'lucide-react';

export default function DEXOrderForm({ 
  fromToken, toToken, chain, onOrderCreated, onCancel 
}) {
  const [orderType, setOrderType] = useState('take-profit');
  const [amount, setAmount] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Masukkan jumlah token yang valid');
      return;
    }

    if (!triggerPrice || parseFloat(triggerPrice) <= 0) {
      setError('Masukkan harga trigger yang valid');
      return;
    }

    if (!fromToken || !toToken) {
      setError('Pilih token asal dan tujuan terlebih dahulu');
      return;
    }

    setLoading(true);

    const orderData = {
      orderType,
      chainId: chain.chainId,
      chainName: chain.name,
      fromTokenSymbol: fromToken.symbol,
      fromTokenAddress: fromToken.address,
      toTokenSymbol: toToken.symbol,
      toTokenAddress: toToken.address,
      amount: amount,
      triggerPrice: parseFloat(triggerPrice),
      status: 'pending',
      notes: `${orderType === 'take-profit' ? 'Take-Profit' : 'Stop-Loss'} order untuk ${amount} ${fromToken.symbol}`,
    };

    await base44.entities.DEXOrder.create(orderData);
    
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setAmount('');
      setTriggerPrice('');
      setSuccess(false);
      onOrderCreated?.();
    }, 2000);
  };

  return (
    <form onSubmit={handleCreateOrder} className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 space-y-4">
      {/* Order Type */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-2 block">Jenis Order</label>
        <div className="flex gap-2">
          {['take-profit', 'stop-loss'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                orderType === type
                  ? type === 'take-profit'
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-red-600 border-red-500 text-white'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
            >
              {type === 'take-profit' ? '📈 Take-Profit' : '⛔ Stop-Loss'}
            </button>
          ))}
        </div>
      </div>

      {/* Token Info */}
      <div className="bg-slate-900/60 rounded-xl p-3 text-xs">
        <div className="text-slate-500 mb-2">Pair Trading</div>
        <div className="flex items-center gap-2">
          <span className="text-base">{fromToken?.logo}</span>
          <span className="text-white font-bold">{fromToken?.symbol}</span>
          <span className="text-slate-600">→</span>
          <span className="text-base">{toToken?.logo}</span>
          <span className="text-white font-bold">{toToken?.symbol}</span>
          <span className="text-slate-600 ml-auto">{chain?.shortName}</span>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-1 block">Jumlah {fromToken?.symbol}</label>
        <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl p-2">
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-transparent border-0 text-white text-lg font-bold p-0 h-auto focus-visible:ring-0 flex-1"
          />
          <span className="text-slate-400 text-xs">{fromToken?.symbol}</span>
        </div>
      </div>

      {/* Trigger Price */}
      <div>
        <label className="text-slate-400 text-xs font-semibold mb-1 block">
          Harga Trigger ({toToken?.symbol})
        </label>
        <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl p-2">
          <span className="text-white text-xs">$</span>
          <Input
            type="number"
            placeholder="0.0"
            value={triggerPrice}
            onChange={e => setTriggerPrice(e.target.value)}
            className="bg-transparent border-0 text-white text-lg font-bold p-0 h-auto focus-visible:ring-0 flex-1"
          />
        </div>
      </div>

      {/* Info */}
      <div className={`flex items-start gap-2 p-2.5 rounded-xl border ${
        orderType === 'take-profit'
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <span className="text-sm shrink-0 mt-0.5">{orderType === 'take-profit' ? '📈' : '⛔'}</span>
        <p className={`text-xs leading-relaxed ${orderType === 'take-profit' ? 'text-green-300' : 'text-red-300'}`}>
          {orderType === 'take-profit'
            ? `Otomatis menjual ${amount} ${fromToken?.symbol} ketika harganya mencapai $${triggerPrice}`
            : `Otomatis menjual ${amount} ${fromToken?.symbol} ketika harganya turun ke $${triggerPrice} untuk mencegah kerugian lebih besar`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-2 p-2.5 bg-green-500/10 border border-green-500/30 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
          <p className="text-green-400 text-xs">Order berhasil dibuat! Monitoring dimulai...</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-slate-600 text-slate-400 hover:text-white"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading || success}
          className={`flex-1 text-white font-semibold ${
            orderType === 'take-profit'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading && <Loader className="w-4 h-4 animate-spin mr-2" />}
          {loading ? 'Membuat...' : `Buat ${orderType === 'take-profit' ? 'Take-Profit' : 'Stop-Loss'}`}
        </Button>
      </div>
    </form>
  );
}
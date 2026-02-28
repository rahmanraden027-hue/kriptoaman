import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function DEXOrderManager({ fromToken, toToken, chain }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | pending | executed | cancelled

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const allOrders = await base44.entities.DEXOrder.list();
      // Filter orders by chain dan token pair
      const filtered = allOrders.filter(o =>
        o.chainId === chain?.chainId &&
        o.fromTokenSymbol === fromToken?.symbol &&
        o.toTokenSymbol === toToken?.symbol
      );
      setOrders(filtered);
      setLoading(false);
    };

    fetchOrders();

    // Real-time subscription
    const unsubscribe = base44.entities.DEXOrder.subscribe((event) => {
      if (event.type === 'update' || event.type === 'delete') {
        fetchOrders();
      } else if (event.type === 'create') {
        fetchOrders();
      }
    });

    return () => unsubscribe?.();
  }, [chain?.chainId, fromToken?.symbol, toToken?.symbol]);

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const handleDeleteOrder = async (orderId) => {
    await base44.entities.DEXOrder.delete(orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'triggered':
        return <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />;
      case 'executed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      triggered: 'Executing...',
      executed: 'Executed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'executed', 'cancelled', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === f
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-400 text-sm">Loading orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <div className="text-slate-400 text-sm">Tidak ada order</div>
          <div className="text-slate-600 text-xs mt-1">Buat order pertama Anda untuk memulai</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map(order => (
            <div key={order.id}
              className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: order.orderType === 'take-profit' ? '#22c55e33' : '#ef444433',
                      border: `1px solid ${order.orderType === 'take-profit' ? '#22c55e55' : '#ef444455'}`
                    }}>
                    {order.orderType === 'take-profit' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">
                        {order.orderType === 'take-profit' ? '📈 Take-Profit' : '⛔ Stop-Loss'}
                      </span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          background: order.orderType === 'take-profit' ? '#22c55e20' : '#ef444420',
                        }}>
                        {getStatusIcon(order.status)}
                        <span className="text-xs font-medium" style={{
                          color: order.status === 'pending' ? '#facc15' : order.status === 'executed' ? '#22c55e' : '#f97316'
                        }}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-500 text-xs mt-1">{order.notes}</div>
                  </div>
                </div>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500">Amount</div>
                  <div className="text-white font-bold mt-0.5">{order.amount} {order.fromTokenSymbol}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500">Trigger Price</div>
                  <div className="text-white font-bold mt-0.5">${order.triggerPrice.toFixed(4)}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-slate-500">Network</div>
                  <div className="text-white font-bold mt-0.5">{order.chainName}</div>
                </div>
              </div>

              {/* Execution info */}
              {order.status === 'executed' && order.executionPrice && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                  <div className="text-xs text-green-400">
                    ✓ Executed at ${order.executionPrice.toFixed(4)}
                  </div>
                  {order.txHash && (
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      TX: {order.txHash}
                    </div>
                  )}
                </div>
              )}

              {/* Failed info */}
              {order.status === 'failed' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  <div className="text-xs text-red-400 font-medium">
                    ✗ Execution Failed (Retry {order.retryCount || 0}/3)
                  </div>
                  {order.lastError && (
                    <div className="text-xs text-slate-400 mt-1">
                      {order.lastError}
                    </div>
                  )}
                </div>
              )}

              {/* Triggered/Executing info */}
              {order.status === 'triggered' && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                  <div className="text-xs text-orange-400 font-medium flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Executing (Retry {order.retryCount || 1}/3)
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
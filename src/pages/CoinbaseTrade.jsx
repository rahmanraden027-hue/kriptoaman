import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, TrendingUp, TrendingDown, RefreshCw, Wallet, ArrowRight, ShoppingCart, Info } from 'lucide-react';

export default function CoinbaseTrade() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState([]);
  const [productQuery, setProductQuery] = useState('BTC-USD');
  const [productData, setProductData] = useState(null);
  const [orderConfig, setOrderConfig] = useState({
    product_id: 'BTC-USD',
    side: 'BUY',
    type: 'market',
    quote_size: '100'
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const callApi = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('coinbaseAdvancedTrade', payload);
      return res.data;
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    const data = await callApi({ action: 'get_balance' });
    if (data?.accounts) setBalances(data.accounts);
  }, [callApi]);

  const fetchProduct = useCallback(async () => {
    if (!productQuery.trim()) return;
    const data = await callApi({ action: 'get_product', product_id: productQuery.trim().toUpperCase() });
    if (data) setProductData(data);
  }, [callApi, productQuery]);

  const previewOrder = useCallback(async () => {
    setPreviewResult(null);
    setOrderResult(null);
    const config = {
      product_id: orderConfig.product_id,
      side: orderConfig.side,
      order_configuration: {
        [orderConfig.type === 'market' ? 'market_market_ioc' : 'limit_limit_gtc']: orderConfig.type === 'market'
          ? { quote_size: orderConfig.quote_size }
          : { base_size: orderConfig.base_size || '0.001', limit_price: orderConfig.limit_price || '50000' }
      }
    };
    const data = await callApi({ action: 'preview_order', order_config: config });
    if (data) setPreviewResult(data);
  }, [callApi, orderConfig]);

  const executeOrder = useCallback(async () => {
    setOrderResult(null);
    const config = {
      product_id: orderConfig.product_id,
      side: orderConfig.side,
      client_order_id: crypto.randomUUID(),
      order_configuration: {
        [orderConfig.type === 'market' ? 'market_market_ioc' : 'limit_limit_gtc']: orderConfig.type === 'market'
          ? { quote_size: orderConfig.quote_size }
          : { base_size: orderConfig.base_size || '0.001', limit_price: orderConfig.limit_price || '50000' }
      }
    };
    const data = await callApi({ action: 'create_order', order_config: config });
    if (data) {
      setOrderResult(data);
      fetchBalances();
    }
  }, [callApi, orderConfig, fetchBalances]);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-slate-950 text-slate-100 p-4 space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Coinbase Advanced Trade
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Powered by Coinbase for Agents — CDP API integration</p>
        </div>
        <button
          onClick={() => { fetchBalances(); fetchProduct(); }}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800/50 rounded-xl p-3 text-rose-300 text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Balances */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-sm">Account Balances</h2>
          <button onClick={fetchBalances} disabled={loading} className="ml-auto text-xs text-indigo-400 hover:text-indigo-300">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {balances.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {balances.filter(a => parseFloat(a.available?.value || a.balance || 0) > 0).map((acc) => (
              <div key={acc.uuid} className="bg-slate-800/60 rounded-lg p-2.5">
                <div className="text-xs text-slate-400">{acc.currency}</div>
                <div className="text-sm font-semibold">{parseFloat(acc.available?.value || acc.balance || 0).toLocaleString('en-US', { maximumFractionDigits: 8 })}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Click Refresh to load balances.</p>
        )}
      </div>

      {/* Price Lookup */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-sm">Price Lookup</h2>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={productQuery}
            onChange={e => setProductQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProduct()}
            placeholder="e.g. BTC-USD, ETH-USD"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button onClick={fetchProduct} disabled={loading || !productQuery.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
            Search
          </button>
        </div>
        {productData && (
          <div className="bg-slate-800/60 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">{productData.product_id || productQuery.toUpperCase()}</span>
              <span className="text-lg font-bold text-emerald-400">
                ${parseFloat(productData.price || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500">24h Change</span>
                <div className={`font-semibold ${parseFloat(productData.change_24h) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {parseFloat(productData.change_24h || 0).toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-slate-500">24h Volume</span>
                <div className="font-semibold">${parseFloat(productData.volume_24h || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              </div>
              <div>
                <span className="text-slate-500">24h High</span>
                <div className="font-semibold">${parseFloat(productData.high_24h || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Panel — Admin only */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-sm">Order Panel</h2>
          {!isAdmin && <span className="ml-auto text-xs text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-full">Admin Only</span>}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Product</label>
              <input
                value={orderConfig.product_id}
                onChange={e => setOrderConfig({ ...orderConfig, product_id: e.target.value.toUpperCase() })}
                placeholder="BTC-USD"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Side</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setOrderConfig({ ...orderConfig, side: 'BUY' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${orderConfig.side === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >Buy</button>
                <button
                  onClick={() => setOrderConfig({ ...orderConfig, side: 'SELL' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${orderConfig.side === 'SELL' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >Sell</button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Order Type</label>
            <div className="flex gap-1">
              <button
                onClick={() => setOrderConfig({ ...orderConfig, type: 'market' })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${orderConfig.type === 'market' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >Market</button>
              <button
                onClick={() => setOrderConfig({ ...orderConfig, type: 'limit' })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${orderConfig.type === 'limit' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >Limit</button>
            </div>
          </div>

          {orderConfig.type === 'market' ? (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Quote Size (USD)</label>
              <input
                value={orderConfig.quote_size}
                onChange={e => setOrderConfig({ ...orderConfig, quote_size: e.target.value })}
                placeholder="100"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Base Size</label>
                <input
                  value={orderConfig.base_size || ''}
                  onChange={e => setOrderConfig({ ...orderConfig, base_size: e.target.value })}
                  placeholder="0.001"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Limit Price (USD)</label>
                <input
                  value={orderConfig.limit_price || ''}
                  onChange={e => setOrderConfig({ ...orderConfig, limit_price: e.target.value })}
                  placeholder="50000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={previewOrder}
              disabled={loading || !isAdmin}
              className="flex-1 py-2 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              Preview
            </button>
            <button
              onClick={executeOrder}
              disabled={loading || !isAdmin}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors ${orderConfig.side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
            >
              Execute {orderConfig.side}
            </button>
          </div>

          {previewResult && (
            <div className="bg-slate-800/60 rounded-lg p-3 text-xs space-y-1">
              <div className="font-semibold text-amber-400 mb-1">Preview Result</div>
              <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(previewResult, null, 2)}
              </pre>
            </div>
          )}

          {orderResult && (
            <div className="bg-slate-800/60 rounded-lg p-3 text-xs space-y-1">
              <div className="font-semibold text-emerald-400 mb-1">Order Executed</div>
              <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(orderResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          This integration uses Coinbase CDP API keys with ES256 JWT authentication. Trades and transfers require admin access. Market data (prices, products) is available to all authenticated users. API keys are configured via environment variables — contact your admin if credentials are missing.
        </p>
      </div>
    </div>
  );
}
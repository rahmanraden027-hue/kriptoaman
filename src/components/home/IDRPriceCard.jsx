import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const COINS = [
  { id: 'bitcoin', sym: 'BTC', name: 'Bitcoin', color: '#f59e0b', emoji: '₿' },
  { id: 'ethereum', sym: 'ETH', name: 'Ethereum', color: '#6366f1', emoji: 'Ξ' },
  { id: 'tether', sym: 'USDT', name: 'Tether', color: '#26a17b', emoji: '₮' },
  { id: 'binancecoin', sym: 'BNB', name: 'BNB', color: '#f0b90b', emoji: 'B' },
  { id: 'solana', sym: 'SOL', name: 'Solana', color: '#9945ff', emoji: '◎' },
  { id: 'ripple', sym: 'XRP', name: 'XRP', color: '#00aae4', emoji: 'X' },
];

export default function IDRPriceCard() {
  const [prices, setPrices] = useState({});
  const [idrRate, setIdrRate] = useState(16200);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const ids = COINS.map(c => c.id).join(',');
      const [priceRes, fxRes] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,idr&include_24hr_change=true`),
        fetch('https://api.exchangerate-api.com/v4/latest/USD'),
      ]);
      const priceData = await priceRes.json();
      setPrices(priceData);
      setLastUpdated(new Date());
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        if (fxData.rates?.IDR) setIdrRate(fxData.rates.IDR);
      }
    } catch (e) {
      // fallback: use USD * 16200
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatIDR = (val) => {
    if (!val) return '—';
    if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(2)}M`;
    if (val >= 1e6) return `Rp ${(val / 1e6).toFixed(2)} Jt`;
    if (val >= 1e3) return `Rp ${(val / 1e3).toFixed(0)}K`;
    return `Rp ${val.toFixed(0)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Harga Live (IDR)</p>
          {lastUpdated && <p className="text-slate-600 text-[10px]">Update: {lastUpdated.toLocaleTimeString('id-ID')}</p>}
        </div>
        <button onClick={fetchPrices} disabled={loading} className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg">
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {COINS.map(coin => {
          const data = prices[coin.id];
          const idrPrice = data?.idr || (data?.usd ? data.usd * idrRate : null);
          const change = data?.usd_24h_change;
          const isUp = change >= 0;

          return (
            <div key={coin.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700/40 rounded-2xl px-4 py-3 active:scale-[0.99] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow"
                  style={{ background: coin.color }}>
                  {coin.emoji}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{coin.sym}</p>
                  <p className="text-slate-500 text-[10px]">{coin.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-bold">
                  {idrPrice ? formatIDR(idrPrice) : loading ? '...' : '—'}
                </p>
                <div className="flex items-center justify-end gap-0.5">
                  {change !== undefined && (
                    isUp
                      ? <TrendingUp className="w-3 h-3 text-green-400" />
                      : <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <p className={`text-[11px] font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {change !== undefined ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : '—'}
                  </p>
                </div>
                {data?.usd && (
                  <p className="text-slate-600 text-[10px]">${data.usd.toLocaleString()}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
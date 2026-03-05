import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, Search, RefreshCw, Globe, BarChart2, Clock } from 'lucide-react';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import CandlestickModal from '../components/market/CandlestickModal';

const COINS = [
  { id: 'bitcoin', sym: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', sym: 'ETH', name: 'Ethereum' },
  { id: 'binancecoin', sym: 'BNB', name: 'BNB' },
  { id: 'solana', sym: 'SOL', name: 'Solana' },
  { id: 'ripple', sym: 'XRP', name: 'XRP' },
  { id: 'cardano', sym: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', sym: 'DOGE', name: 'Dogecoin' },
  { id: 'tron', sym: 'TRX', name: 'TRON' },
  { id: 'avalanche-2', sym: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot', sym: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', sym: 'LINK', name: 'Chainlink' },
  { id: 'matic-network', sym: 'MATIC', name: 'Polygon' },
  { id: 'litecoin', sym: 'LTC', name: 'Litecoin' },
  { id: 'uniswap', sym: 'UNI', name: 'Uniswap' },
  { id: 'tether', sym: 'USDT', name: 'Tether' },
  { id: 'usd-coin', sym: 'USDC', name: 'USD Coin' },
];

export default function Market() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // all | gainers | losers
  const [chartCoin, setChartCoin] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchPrices = useCallback(() => {
    setLoading(true);
    const ids = COINS.map(c => c.id).join(',');
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setLastUpdated(new Date()); setCountdown(30); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPrices();
    // Auto-refresh setiap 30 detik
    intervalRef.current = setInterval(fetchPrices, 30000);
    // Countdown timer
    countdownRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [fetchPrices]);

  const filtered = COINS.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.sym.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
    const chg = data[c.id]?.usd_24h_change;
    if (tab === 'gainers' && (chg == null || chg < 0)) return false;
    if (tab === 'losers' && (chg == null || chg > 0)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {chartCoin && (
        <CandlestickModal
          coin={chartCoin}
          currentPrice={data[chartCoin.id]?.usd}
          change24h={data[chartCoin.id]?.usd_24h_change}
          onClose={() => setChartCoin(null)}
        />
      )}
      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Market</h1>
            <p className="text-slate-500 text-xs">Harga live · CoinGecko</p>
          </div>
          <button onClick={fetchPrices} className="p-2 bg-slate-800 border border-slate-700/40 rounded-xl hover:bg-slate-700 transition-colors">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari koin..."
            className="w-full bg-slate-800/70 border border-slate-700/50 rounded-2xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[['all', 'Semua'], ['gainers', '🔼 Naik'], ['losers', '🔽 Turun']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${tab === key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Coin list */}
        <div className="space-y-2">
          {filtered.map(c => {
            const d = data[c.id];
            const chg = d?.usd_24h_change;
            const isUp = chg >= 0;
            return (
              <div key={c.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700/40 rounded-2xl px-4 py-3 cursor-pointer hover:border-indigo-500/40 transition-all active:scale-[0.99]"
                onClick={() => setChartCoin(c)}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${isUp ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                    {c.sym.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{c.sym}</p>
                    <p className="text-slate-500 text-[11px]">{c.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-white text-sm font-bold">
                      {d?.usd != null ? `$${d.usd.toLocaleString('en-US', { maximumFractionDigits: 6 })}` : '—'}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {chg != null ? `${isUp ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <BarChart2 className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-16">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Tidak ada hasil</p>
          </div>
        )}
      </div>
    </div>
  );
}
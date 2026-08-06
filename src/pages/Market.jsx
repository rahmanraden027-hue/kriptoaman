 import React, { useState } from 'react';

import {
  TrendingUp,
  TrendingDown,
  Search,
  Globe,
  BarChart2,
  Star,
  Wifi,
  WifiOff
} from 'lucide-react';

import CandlestickModal from '../components/market/CandlestickModal';
import useLivePrices from '../components/market/useLivePrices';
const coinImage = (id) => {
  const logos = {
    bitcoin: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    ethereum: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    binancecoin: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    solana: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    ripple: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    cardano: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    dogecoin: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    tron: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png",
    "avalanche-2": "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
    polkadot: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
    chainlink: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
    "matic-network": "https://assets.coingecko.com/coins/images/4713/large/polygon.png",
    litecoin: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
    uniswap: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png",
    tether: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    "usd-coin": "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
    "shiba-inu": "https://assets.coingecko.com/coins/images/11939/large/shiba.png",
    pepe: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg"
  };

  return logos[id] || "/images/default-coin.png";
};
const COINS = [
  { id: 'bitcoin', sym: 'BTC', name: 'Bitcoin', emoji: '₿', color: '#f59e0b' },
  { id: 'ethereum', sym: 'ETH', name: 'Ethereum', emoji: 'Ξ', color: '#6366f1' },
  { id: 'binancecoin', sym: 'BNB', name: 'BNB', emoji: 'B', color: '#f0b90b' },
  { id: 'solana', sym: 'SOL', name: 'Solana', emoji: '◎', color: '#9945ff' },
  { id: 'ripple', sym: 'XRP', name: 'XRP', emoji: 'X', color: '#00aae4' },
  { id: 'cardano', sym: 'ADA', name: 'Cardano', emoji: 'A', color: '#0033ad' },
  { id: 'dogecoin', sym: 'DOGE', name: 'Dogecoin', emoji: 'D', color: '#c2a633' },
  { id: 'tron', sym: 'TRX', name: 'TRON', emoji: 'T', color: '#ef0027' },
  { id: 'avalanche-2', sym: 'AVAX', name: 'Avalanche', emoji: 'A', color: '#e84142' },
  { id: 'polkadot', sym: 'DOT', name: 'Polkadot', emoji: 'D', color: '#e6007a' },
  { id: 'chainlink', sym: 'LINK', name: 'Chainlink', emoji: '⬡', color: '#2a5ada' },
  { id: 'matic-network', sym: 'MATIC', name: 'Polygon', emoji: 'P', color: '#8247e5' },
  { id: 'litecoin', sym: 'LTC', name: 'Litecoin', emoji: 'Ł', color: '#345d9d' },
  { id: 'uniswap', sym: 'UNI', name: 'Uniswap', emoji: '🦄', color: '#ff007a' },
  { id: 'tether', sym: 'USDT', name: 'Tether', emoji: '₮', color: '#26a17b' },
  { id: 'usd-coin', sym: 'USDC', name: 'USD Coin', emoji: '$', color: '#2775ca' },
  { id: 'shiba-inu', sym: 'SHIB', name: 'Shiba Inu', emoji: '🐕', color: '#e0522b' },
  { id: 'pepe', sym: 'PEPE', name: 'Pepe', emoji: '🐸', color: '#4caf50' },
];



export default function Market() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currency, setCurrency] = useState('idr');
  const [chartCoin, setChartCoin] = useState(null);
  const [watchlist, setWatchlist] = useState(() => JSON.parse(localStorage.getItem('ka_watchlist') || '[]'));

  const { prices: liveData, connected, idrRate } = useLivePrices();

  const toggleWatchlist = (sym) => {
    const next = watchlist.includes(sym) ? watchlist.filter(s => s !== sym) : [...watchlist, sym];
    setWatchlist(next);
    localStorage.setItem('ka_watchlist', JSON.stringify(next));
  };

  const filtered = COINS.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.sym.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
    const chg = liveData[c.sym]?.change24h;
    if (tab === 'gainers' && (chg == null || chg < 0)) return false;
    if (tab === 'losers' && (chg == null || chg > 0)) return false;
    if (tab === 'watchlist' && !watchlist.includes(c.sym)) return false;
    return true;
  });

   const formatPrice = (coin) => {
  const d = liveData[coin.sym];

  if (!d || d.price == null) return "—";

  if (currency === "usd") {
    if (d.price >= 1) return `$${d.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    return `$${d.price.toFixed(6)}`;
  }

  const idr = d.price * idrRate;

  if (idr >= 1e9) return `Rp ${(idr / 1e9).toFixed(2)} M`;
  if (idr >= 1e6) return `Rp ${(idr / 1e6).toFixed(2)} Jt`;
  if (idr >= 1000) return `Rp ${idr.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

  return `Rp ${idr.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  })}`;
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {chartCoin && (
        <CandlestickModal
          coin={chartCoin}
          currentPrice={liveData[chartCoin.sym]?.price}
          change24h={liveData[chartCoin.sym]?.change24h}
          onClose={() => setChartCoin(null)}
        />
      )}
      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Market</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${connected ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <p className={`text-xs ${connected ? 'text-green-400' : 'text-yellow-400'}`}>
                {connected ? 'WebSocket Live 24/7' : 'Reconnecting…'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrency(c => c === 'idr' ? 'usd' : 'idr')}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors">
              {currency === 'idr' ? 'IDR 🇮🇩' : 'USD 🇺🇸'}
            </button>
            <div className={`p-2 rounded-xl border ${connected ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-800 border-slate-700'}`}>
              {connected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari koin... (BTC, ETH, SOL)"
            className="w-full bg-slate-800/70 border border-slate-700/50 rounded-2xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['all', '🌐 Semua'], ['gainers', '🔼 Naik'], ['losers', '🔽 Turun'], ['watchlist', '⭐ Watchlist']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === key ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Market stats bar */}
        {Object.keys(liveData).length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Naik hari ini', value: COINS.filter(c => (liveData[c.sym]?.change24h || 0) > 0).length, color: 'text-green-400' },
              { label: 'Turun hari ini', value: COINS.filter(c => (liveData[c.sym]?.change24h || 0) < 0).length, color: 'text-red-400' },
              { label: 'Total koin', value: COINS.length, color: 'text-slate-300' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5 text-center">
                <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-slate-600 text-[10px]">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Coin list */}
        <div className="space-y-2">
          {filtered.map((c, idx) => {
            const d = liveData[c.sym];
            const chg = d?.change24h;
            const isUp = (chg || 0) >= 0;
            const inWatchlist = watchlist.includes(c.sym);
            return (
              
  <div
    key={c.id}
    className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl"
    onClick={() => setChartCoin(c)}
  >
    <div className="flex items-center gap-3">
      <div className="relative">
        <img
    src={coinImage(c.id)}
          alt={c.name}
          className="w-9 h-9 rounded-full"
          onError={(e) => {
            e.currentTarget.src = "/images/default-coin.png";
          }}
        />
        <span className="absolute -bottom-1 -right-1 text-[9px] bg-slate-700 text-slate-400 rounded-full px-1">
          #{idx + 1}
        </span>
      </div>

      <div>
        <p className="text-white text-sm font-bold">{c.sym}</p>
        <p className="text-slate-500 text-[10px]">{c.name}</p>
      </div>
    </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-bold transition-colors duration-300 ${d?.tick === 'up' ? 'text-green-300' : d?.tick === 'down' ? 'text-red-300' : 'text-white'}`}>
                      {formatPrice(c)}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {chg != null ? `${isUp ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleWatchlist(c.sym); }}
                    className={`p-1.5 rounded-lg transition-all ${inWatchlist ? 'text-yellow-400' : 'text-slate-700 hover:text-slate-500'}`}>
                    <Star className={`w-4 h-4 ${inWatchlist ? 'fill-yellow-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-16">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {tab === 'watchlist' ? 'Belum ada koin di watchlist. Tap ⭐ pada koin untuk menambahkan.' : 'Tidak ada hasil'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';

import {
  TrendingUp,
  TrendingDown,
  Search,
  Globe,
  Star,
  Wifi,
  WifiOff
} from 'lucide-react';

import useLivePrices from '../components/market/useLivePrices';
import useCoinMarkets from '../components/home/useCoinMarkets';
import InteractiveSparkline from '../components/home/InteractiveSparkline';
import TradingViewModal from '../components/market/TradingViewModal';

const coinImage = (id) => {
  const logos = {
    bitcoin: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    ethereum: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    binancecoin: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    solana: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    ripple: "https://cryptologos.cc/logos/xrp-xrp-logo.png?v=040",
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
  { id: 'bitcoin', sym: 'BTC', name: 'Bitcoin', color: '#f7931a' },
  { id: 'ethereum', sym: 'ETH', name: 'Ethereum', color: '#627eea' },
  { id: 'binancecoin', sym: 'BNB', name: 'BNB', color: '#f0b90b' },
  { id: 'solana', sym: 'SOL', name: 'Solana', color: '#14f195' },
  { id: 'ripple', sym: 'XRP', name: 'XRP', color: '#00aae4' },
  { id: 'cardano', sym: 'ADA', name: 'Cardano', color: '#0033ad' },
  { id: 'dogecoin', sym: 'DOGE', name: 'Dogecoin', color: '#c2a633' },
  { id: 'tron', sym: 'TRX', name: 'TRON', color: '#ef0027' },
  { id: 'avalanche-2', sym: 'AVAX', name: 'Avalanche', color: '#e84142' },
  { id: 'polkadot', sym: 'DOT', name: 'Polkadot', color: '#e6007a' },
  { id: 'chainlink', sym: 'LINK', name: 'Chainlink', color: '#2a5ada' },
  { id: 'matic-network', sym: 'MATIC', name: 'Polygon', color: '#8247e5' },
  { id: 'litecoin', sym: 'LTC', name: 'Litecoin', color: '#345d9d' },
  { id: 'uniswap', sym: 'UNI', name: 'Uniswap', color: '#ff007a' },
  { id: 'tether', sym: 'USDT', name: 'Tether', color: '#26a17b' },
  { id: 'usd-coin', sym: 'USDC', name: 'USD Coin', color: '#2775ca' },
  { id: 'shiba-inu', sym: 'SHIB', name: 'Shiba Inu', color: '#e0522b' },
  { id: 'pepe', sym: 'PEPE', name: 'Pepe', color: '#4caf50' },
];

export default function Market() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currency, setCurrency] = useState('idr');
  const [chartCoin, setChartCoin] = useState(null);
  const [watchlist, setWatchlist] = useState(() => JSON.parse(localStorage.getItem('ka_watchlist') || '[]'));

  const { prices: liveData, connected, idrRate } = useLivePrices();
  const { markets } = useCoinMarkets();

  const toggleWatchlist = (sym) => {
    const next = watchlist.includes(sym) ? watchlist.filter(s => s !== sym) : [...watchlist, sym];
    setWatchlist(next);
    localStorage.setItem('ka_watchlist', JSON.stringify(next));
  };

  const filtered = COINS.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.sym.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
    const chg = liveData[c.sym]?.change24h ?? markets[c.sym]?.change24h;
    if (tab === 'gainers' && (chg == null || chg < 0)) return false;
    if (tab === 'losers' && (chg == null || chg > 0)) return false;
    if (tab === 'watchlist' && !watchlist.includes(c.sym)) return false;
    return true;
  });

  const formatPrice = (sym) => {
    const d = liveData[sym] || markets[sym];
    const price = d?.price;
    if (price == null) return "—";
    if (currency === "usd") {
      return price >= 1 ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${price.toFixed(6)}`;
    }
    const idr = price * idrRate;
    if (idr >= 1e9) return `Rp ${(idr / 1e9).toFixed(2)} M`;
    if (idr >= 1e6) return `Rp ${(idr / 1e6).toFixed(2)} Jt`;
    if (idr >= 1000) return `Rp ${idr.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
    return `Rp ${idr.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;
  };

  return (
    <div className="min-h-screen ka-bg text-white pb-24">
      {chartCoin && (
        <TradingViewModal
          coin={chartCoin}
          price={liveData[chartCoin.sym]?.price ?? markets[chartCoin.sym]?.price}
          change24h={liveData[chartCoin.sym]?.change24h ?? markets[chartCoin.sym]?.change24h}
          onClose={() => setChartCoin(null)}
        />
      )}

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Markets</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-ka-emerald ka-pulse-dot' : 'bg-yellow-400'}`} />
              <p className={`text-xs ${connected ? 'text-ka-emerald' : 'text-yellow-400'}`}>
                {connected ? 'Live 24/7' : 'Reconnecting…'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrency(c => c === 'idr' ? 'usd' : 'idr')}
              className="px-3 py-1.5 ka-chip text-xs font-bold ka-muted hover:text-white transition-colors">
              {currency === 'idr' ? 'IDR 🇮🇩' : 'USD 🇺🇸'}
            </button>
            <div className={`p-2 rounded-xl border ${connected ? 'bg-ka-emerald/10 border-ka-emerald/20' : 'ka-chip'}`}>
              {connected ? <Wifi className="w-4 h-4 text-ka-emerald" /> : <WifiOff className="w-4 h-4 text-yellow-400" />}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ka-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari koin... (BTC, ETH, SOL)"
            className="w-full ka-surface rounded-2xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-ka-emerald placeholder:ka-muted"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[['all', 'Semua'], ['gainers', 'Naik'], ['losers', 'Turun'], ['watchlist', 'Watchlist']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === key ? 'bg-ka-emerald text-black' : 'ka-chip ka-muted hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Market stats bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Naik', value: COINS.filter(c => ((liveData[c.sym]?.change24h ?? markets[c.sym]?.change24h) || 0) > 0).length, color: 'text-ka-emerald' },
            { label: 'Turun', value: COINS.filter(c => ((liveData[c.sym]?.change24h ?? markets[c.sym]?.change24h) || 0) < 0).length, color: 'text-[#e74c3c]' },
            { label: 'Total', value: COINS.length, color: 'text-white' },
          ].map(stat => (
            <div key={stat.label} className="ka-surface p-2.5 text-center">
              <p className={`text-sm font-bold ka-num ${stat.color}`}>{stat.value}</p>
              <p className="ka-muted text-[10px]">{stat.label} hari ini</p>
            </div>
          ))}
        </div>

        {/* Coin list */}
        <div className="space-y-2">
          {filtered.map((c) => {
            const d = liveData[c.sym] || markets[c.sym];
            const chg = d?.change24h;
            const isUp = (chg || 0) >= 0;
            const inWatchlist = watchlist.includes(c.sym);
            const spark = markets[c.sym]?.sparkline;
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 ka-surface ka-surface-hover p-3"
                onClick={() => setChartCoin(c)}
              >
                <div className="relative shrink-0">
                  <img
                    src={coinImage(c.id)}
                    alt={c.name}
                    className="w-9 h-9 rounded-full"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = "/images/default-coin.png"; }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold">{c.sym}</p>
                  <p className="ka-muted text-[10px]">{c.name}</p>
                </div>
                <div className="ml-auto flex items-center gap-2.5">
                  <InteractiveSparkline data={spark} up={isUp} height={28} width={64} />
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ka-num transition-colors ${d?.tick === 'up' ? 'text-ka-emerald' : d?.tick === 'down' ? 'text-[#e74c3c]' : 'text-white'}`}>
                      {formatPrice(c.sym)}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${isUp ? 'text-ka-emerald' : 'text-[#e74c3c]'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {chg != null ? `${isUp ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleWatchlist(c.sym); }}
                    className={`p-1.5 rounded-lg transition-all shrink-0 tap-reset ${inWatchlist ? 'text-yellow-400' : 'ka-muted hover:text-white'}`}
                    aria-label="Watchlist">
                    <Star className={`w-4 h-4 ${inWatchlist ? 'fill-yellow-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center ka-muted py-16">
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
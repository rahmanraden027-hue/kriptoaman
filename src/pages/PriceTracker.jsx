import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, Search, Star, StarOff,
  Activity, BarChart2, Globe, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';

// ── All coins with metadata ───────────────────────────────────────────────────
const ALL_COINS = [
  { id: 'BTC',  name: 'Bitcoin',          coingecko: 'bitcoin',       color: '#F7931A', icon: '₿',  network: 'Bitcoin',          cat: 'L1' },
  { id: 'ETH',  name: 'Ethereum',         coingecko: 'ethereum',      color: '#627EEA', icon: 'Ξ',  network: 'Ethereum',         cat: 'L1' },
  { id: 'BNB',  name: 'BNB Chain',        coingecko: 'binancecoin',   color: '#F0B90B', icon: 'B',  network: 'BNB Chain',        cat: 'L1' },
  { id: 'SOL',  name: 'Solana',           coingecko: 'solana',        color: '#9945FF', icon: '◎',  network: 'Solana',           cat: 'L1' },
  { id: 'AVAX', name: 'Avalanche',        coingecko: 'avalanche-2',   color: '#E84142', icon: '▲',  network: 'Avalanche',        cat: 'L1' },
  { id: 'MATIC',name: 'Polygon',          coingecko: 'matic-network', color: '#8247E5', icon: 'P',  network: 'Polygon',          cat: 'L1' },
  { id: 'DOT',  name: 'Polkadot',         coingecko: 'polkadot',      color: '#E6007A', icon: '●',  network: 'Polkadot',         cat: 'L1' },
  { id: 'ATOM', name: 'Cosmos',           coingecko: 'cosmos',        color: '#2E3148', icon: '⚛',  network: 'Cosmos Hub',       cat: 'L1' },
  { id: 'NEAR', name: 'NEAR Protocol',    coingecko: 'near',          color: '#00C08B', icon: 'N',  network: 'NEAR',             cat: 'L1' },
  { id: 'ADA',  name: 'Cardano',          coingecko: 'cardano',       color: '#0033AD', icon: '₳',  network: 'Cardano',          cat: 'L1' },
  { id: 'LTC',  name: 'Litecoin',         coingecko: 'litecoin',      color: '#A0A0A0', icon: 'Ł',  network: 'Litecoin',         cat: 'L1' },
  { id: 'DOGE', name: 'Dogecoin',         coingecko: 'dogecoin',      color: '#C2A633', icon: 'Ð',  network: 'Dogecoin',         cat: 'Meme' },
  { id: 'SHIB', name: 'Shiba Inu',        coingecko: 'shiba-inu',     color: '#FFA409', icon: '🐕',  network: 'Ethereum',         cat: 'Meme' },
  { id: 'ARB',  name: 'Arbitrum',         coingecko: 'arbitrum',      color: '#28A0F0', icon: 'A',  network: 'Arbitrum One',     cat: 'L2' },
  { id: 'OP',   name: 'Optimism',         coingecko: 'optimism',      color: '#FF0420', icon: 'O',  network: 'OP Mainnet',       cat: 'L2' },
  { id: 'FTM',  name: 'Fantom',           coingecko: 'fantom',        color: '#1969FF', icon: 'F',  network: 'Fantom Opera',     cat: 'L1' },
  { id: 'UNI',  name: 'Uniswap',          coingecko: 'uniswap',       color: '#FF007A', icon: '🦄',  network: 'Ethereum',         cat: 'DeFi' },
  { id: 'LINK', name: 'Chainlink',        coingecko: 'chainlink',     color: '#375BD2', icon: '🔗',  network: 'Multi-chain',      cat: 'Oracle' },
  { id: 'AAVE', name: 'Aave',             coingecko: 'aave',          color: '#B6509E', icon: '👻',  network: 'Multi-chain',      cat: 'DeFi' },
  { id: 'CRV',  name: 'Curve DAO',        coingecko: 'curve-dao-token',color:'#40649F', icon: '📈',  network: 'Multi-chain',      cat: 'DeFi' },
  { id: 'INJ',  name: 'Injective',        coingecko: 'injective-protocol', color: '#00A3FF', icon: 'I', network: 'Injective',   cat: 'L1' },
  { id: 'SUI',  name: 'Sui',              coingecko: 'sui',           color: '#4CA3FF', icon: 'S',  network: 'Sui',              cat: 'L1' },
  { id: 'APT',  name: 'Aptos',            coingecko: 'aptos',         color: '#2AB8E7', icon: '●',  network: 'Aptos',            cat: 'L1' },
  { id: 'XRP',  name: 'XRP',              coingecko: 'ripple',        color: '#00AAE4', icon: '⚡',  network: 'XRP Ledger',       cat: 'L1' },
  { id: 'TRX',  name: 'TRON',             coingecko: 'tron',          color: '#FF0013', icon: 'T',  network: 'TRON',             cat: 'L1' },
];

// Simulated base prices
const BASE_PRICES = {
  BTC: 95200, ETH: 3420, BNB: 582, SOL: 172, AVAX: 38.5, MATIC: 0.46,
  DOT: 7.8, ATOM: 8.9, NEAR: 5.2, ADA: 0.48, LTC: 86, DOGE: 0.124,
  SHIB: 0.0000248, ARB: 1.12, OP: 1.85, FTM: 0.57, UNI: 8.4, LINK: 14.8,
  AAVE: 195, CRV: 0.51, INJ: 22, SUI: 3.8, APT: 12.5, XRP: 0.57, TRX: 0.124,
};

const CATEGORIES = ['Semua', 'L1', 'L2', 'DeFi', 'Meme', 'Oracle'];
const HISTORY_KEY = 'pt_price_history';
const STARRED_KEY = 'pt_starred_coins';

function loadHistory() { try { return JSON.parse(sessionStorage.getItem(HISTORY_KEY)) || {}; } catch { return {}; } }
function saveHistory(h) { try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {} }

function generateSparkline(basePrice, points = 24) {
  const data = [];
  let price = basePrice * (0.95 + Math.random() * 0.1);
  for (let i = 0; i < points; i++) {
    price = price * (1 + (Math.random() - 0.5) * 0.03);
    data.push({ t: i, p: parseFloat(price.toFixed(price > 100 ? 2 : price > 1 ? 4 : 8)) });
  }
  return data;
}

function formatPrice(price) {
  if (!price) return '—';
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return '$' + price.toFixed(2);
  if (price >= 0.01) return '$' + price.toFixed(4);
  return '$' + price.toFixed(8);
}

function formatMarketCap(price, circulating = 1e9) {
  const mc = price * circulating;
  if (mc >= 1e12) return '$' + (mc / 1e12).toFixed(2) + 'T';
  if (mc >= 1e9)  return '$' + (mc / 1e9).toFixed(1) + 'B';
  if (mc >= 1e6)  return '$' + (mc / 1e6).toFixed(0) + 'M';
  return '$' + mc.toFixed(0);
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color, positive }) {
  if (!data?.length) return <div className="w-16 h-8 bg-slate-700/30 rounded animate-pulse" />;
  return (
    <ResponsiveContainer width={64} height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="p" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.replace('#','')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Coin Row ──────────────────────────────────────────────────────────────────
function CoinRow({ coin, liveData, sparkline, rank, starred, onStar, onClick }) {
  const price  = liveData?.price || BASE_PRICES[coin.id] || 0;
  const change = liveData?.change24h || 0;
  const isUp   = change >= 0;
  const tick   = liveData?.tick;

  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800/60 rounded-xl transition-colors text-left group">
      {/* Rank */}
      <span className="text-slate-600 text-xs w-6 text-center">{rank}</span>

      {/* Star */}
      <button onClick={e => { e.stopPropagation(); onStar(coin.id); }}
        className="text-slate-600 hover:text-yellow-400 transition-colors">
        {starred ? <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" /> : <StarOff className="w-3.5 h-3.5" />}
      </button>

      {/* Coin info */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ background: coin.color }}>
        {coin.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-sm font-semibold">{coin.id}</span>
          <span className="text-[9px] px-1 py-0.5 rounded font-bold" style={{ background: coin.color + '22', color: coin.color }}>{coin.cat}</span>
        </div>
        <div className="text-slate-500 text-xs truncate">{coin.name}</div>
      </div>

      {/* Sparkline */}
      <div className="hidden sm:block">
        <Sparkline data={sparkline} color={coin.color} positive={isUp} />
      </div>

      {/* Price */}
      <div className="text-right min-w-[80px]">
        <div className={`text-sm font-bold transition-colors ${
          tick === 'up' ? 'text-green-300' : tick === 'down' ? 'text-red-300' : 'text-white'
        }`}>
          {formatPrice(price)}
        </div>
        <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change).toFixed(2)}%
        </div>
      </div>
    </button>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────
function CoinDetail({ coin, liveData, history, onClose }) {
  const price  = liveData?.price || BASE_PRICES[coin.id] || 0;
  const change = liveData?.change24h || 0;
  const isUp   = change >= 0;
  const [range, setRange] = useState('1D');

  const ranges = ['1H', '1D', '7D', '1M'];

  // Generate OHLC-style data for selected range
  const chartData = useMemo(() => {
    const pts = range === '1H' ? 60 : range === '1D' ? 24 : range === '7D' ? 7 * 24 : 30;
    const data = [];
    let p = price * 0.94;
    for (let i = 0; i < pts; i++) {
      p = p * (1 + (Math.random() - 0.49) * 0.025);
      const label = range === '1H' ? `${i}m` : range === '1D' ? `${i}h` : range === '7D' ? `${Math.floor(i/24)}d${i%24}h` : `${i+1}`;
      data.push({ t: label, p: parseFloat(p.toFixed(price > 100 ? 2 : 4)) });
    }
    return data;
  }, [coin.id, range, price]);

  const low  = chartData.length ? Math.min(...chartData.map(d => d.p)) : 0;
  const high = chartData.length ? Math.max(...chartData.map(d => d.p)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg"
              style={{ background: coin.color }}>{coin.icon}</div>
            <div>
              <div className="text-white font-bold">{coin.name}</div>
              <div className="text-slate-500 text-xs">{coin.id} · {coin.network}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Price header */}
          <div>
            <div className="text-3xl font-bold text-white">{formatPrice(price)}</div>
            <div className={`flex items-center gap-1 mt-1 text-sm font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isUp ? '+' : ''}{change.toFixed(2)}% (24h)
            </div>
          </div>

          {/* Range selector */}
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            {ranges.map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${range === r ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
                {r}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-slate-900/60 rounded-xl p-3">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={coin.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={coin.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="t" tick={{ fill: '#475569', fontSize: 9 }} interval={Math.floor(chartData.length / 4)} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  formatter={v => [formatPrice(v), 'Harga']}
                />
                <Area type="monotone" dataKey="p" stroke={coin.color} strokeWidth={2}
                  fill="url(#detailGrad)" dot={false} activeDot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Terendah', value: formatPrice(low), color: 'text-red-400' },
              { label: 'Tertinggi', value: formatPrice(high), color: 'text-green-400' },
              { label: 'Market Cap', value: formatMarketCap(price, coin.id === 'BTC' ? 19.7e6 : 1e9), color: 'text-white' },
              { label: 'Jaringan', value: coin.network, color: 'text-blue-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
                <div className="text-slate-500 text-xs mb-1">{stat.label}</div>
                <div className={`text-sm font-bold truncate ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function useMemo(factory, deps) {
  const ref = useRef({ deps: null, value: null });
  if (!ref.current.deps || deps.some((d, i) => d !== ref.current.deps[i])) {
    ref.current.value = factory();
    ref.current.deps = deps;
  }
  return ref.current.value;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PriceTracker() {
  const [livePrices, setLivePrices] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [starred, setStarred] = useState(['BTC', 'ETH', 'SOL']);
  const [showStarred, setShowStarred] = useState(false);
  const [detail, setDetail] = useState(null);
  const [ticker, setTicker] = useState(true);
  const priceRef = useRef({});
  const intervalRef = useRef(null);

  // Init sparklines
  useEffect(() => {
    const sp = {};
    ALL_COINS.forEach(c => { sp[c.id] = generateSparkline(BASE_PRICES[c.id] || 1); });
    setSparklines(sp);
    const initial = {};
    ALL_COINS.forEach(c => {
      initial[c.id] = { price: BASE_PRICES[c.id] || 1, change24h: (Math.random() - 0.45) * 8 };
    });
    setLivePrices(initial);
    priceRef.current = initial;
  }, []);

  // Real-time price updates
  useEffect(() => {
    if (!ticker) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setLivePrices(prev => {
        const updated = { ...prev };
        ALL_COINS.forEach(c => {
          const current = prev[c.id]?.price || BASE_PRICES[c.id] || 1;
          const delta = (Math.random() - 0.5) * 0.006;
          const newPrice = Math.max(current * (1 + delta), 0.000001);
          updated[c.id] = {
            price: newPrice,
            change24h: prev[c.id]?.change24h + (Math.random() - 0.5) * 0.1,
            tick: delta > 0 ? 'up' : 'down',
          };
        });
        return updated;
      });
      // Update sparklines (append last point)
      setSparklines(prev => {
        const updated = { ...prev };
        ALL_COINS.forEach(c => {
          const sp = prev[c.id] || [];
          if (sp.length >= 24) {
            const newP = (sp[sp.length - 1]?.p || BASE_PRICES[c.id] || 1) * (1 + (Math.random() - 0.5) * 0.025);
            updated[c.id] = [...sp.slice(1), { t: Date.now(), p: parseFloat(newP.toFixed(newP > 100 ? 2 : 4)) }];
          }
        });
        return updated;
      });
    }, 2000);
    return () => clearInterval(intervalRef.current);
  }, [ticker]);

  const toggleStar = useCallback((id) => {
    setStarred(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }, []);

  // Filter coins
  const filtered = ALL_COINS.filter(c => {
    const matchSearch = !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Semua' || c.cat === category;
    const matchStar = !showStarred || starred.includes(c.id);
    return matchSearch && matchCat && matchStar;
  });

  // Top movers
  const topGainers = [...ALL_COINS].sort((a, b) => (livePrices[b.id]?.change24h || 0) - (livePrices[a.id]?.change24h || 0)).slice(0, 3);
  const topLosers  = [...ALL_COINS].sort((a, b) => (livePrices[a.id]?.change24h || 0) - (livePrices[b.id]?.change24h || 0)).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md mx-auto p-4 pb-10 space-y-4">

        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">Crypto Price Tracker</h1>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live · {ALL_COINS.length} aset terlacak
              </div>
            </div>
          </div>
          <button onClick={() => setTicker(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${ticker ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <Zap className="w-3 h-3" />{ticker ? 'Live' : 'Pause'}
          </button>
        </div>

        {/* Top Movers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1 text-green-400 text-xs font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Top Gainers
            </div>
            {topGainers.map(c => (
              <div key={c.id} className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c.color }}>{c.icon}</div>
                  <span className="text-white text-xs font-semibold">{c.id}</span>
                </div>
                <span className="text-green-400 text-xs font-bold">+{(livePrices[c.id]?.change24h || 0).toFixed(2)}%</span>
              </div>
            ))}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1 text-red-400 text-xs font-semibold mb-2">
              <TrendingDown className="w-3.5 h-3.5" /> Top Losers
            </div>
            {topLosers.map(c => (
              <div key={c.id} className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c.color }}>{c.icon}</div>
                  <span className="text-white text-xs font-semibold">{c.id}</span>
                </div>
                <span className="text-red-400 text-xs font-bold">{(livePrices[c.id]?.change24h || 0).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari koin atau jaringan..."
            className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-slate-600" />
        </div>

        {/* Category + Star filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button onClick={() => setShowStarred(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all shrink-0 ${showStarred ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <Star className="w-3 h-3" /> Favorit
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all shrink-0 ${category === cat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Coin list */}
        <div className="bg-slate-900/60 border border-slate-700/30 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800">
            <span className="w-6" />
            <span className="w-5" />
            <span className="w-8" />
            <span className="text-slate-600 text-xs flex-1">Nama</span>
            <span className="hidden sm:block text-slate-600 text-xs w-16 text-center">7 Hari</span>
            <span className="text-slate-600 text-xs text-right min-w-[80px]">Harga</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">Tidak ada koin ditemukan</div>
          ) : (
            filtered.map((coin, i) => (
              <CoinRow
                key={coin.id}
                coin={coin}
                liveData={livePrices[coin.id]}
                sparkline={sparklines[coin.id]}
                rank={i + 1}
                starred={starred.includes(coin.id)}
                onStar={toggleStar}
                onClick={() => setDetail(coin)}
              />
            ))
          )}
        </div>

        <p className="text-center text-slate-600 text-xs">Harga bersifat simulasi real-time untuk demo • Sumber: CoinGecko API</p>
      </div>

      {detail && (
        <CoinDetail
          coin={detail}
          liveData={livePrices[detail.id]}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Wallet } from 'lucide-react';
import { COINS, getPrices, getBalance, formatAmount } from './multiCoinApi';

const COIN_LIST = ['BTC', 'ETH', 'BNB', 'SOL', 'DOGE', 'MATIC', 'LTC'];
const COIN_ICONS = { BTC: '₿', ETH: 'Ξ', LTC: 'Ł', BNB: 'B', SOL: '◎', DOGE: 'Ð', MATIC: 'M' };
const RANGE_OPTIONS = [
  { label: '7H', days: 7 },
  { label: '1B', days: 30 },
  { label: '3B', days: 90 },
];
const PREF_KEY = 'assetWidget_prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; }
}
function savePrefs(p) {
  localStorage.setItem(PREF_KEY, JSON.stringify(p));
}

async function fetchHistory(coingeckoId, days = 7) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.prices || []).map(([ts, price]) => ({
    date: new Date(ts).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    price: parseFloat(price.toFixed(2)),
  }));
}

function formatPrice(p) {
  if (!p) return '—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + p.toFixed(2);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white shadow">
      <div className="font-semibold">${payload[0].value.toLocaleString()}</div>
      <div className="text-slate-400">{payload[0].payload.date}</div>
    </div>
  );
};

function CoinChart({ coinId, globalRange, addresses }) {
  const coin = COINS[coinId];
  const [history, setHistory] = useState([]);
  const [price, setPrice] = useState(null);
  const [change24h, setChange24h] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [hist, prices] = await Promise.all([
      fetchHistory(coin.coingeckoId, globalRange).catch(() => []),
      getPrices(),
    ]);
    setHistory(hist);
    setPrice(prices[coinId]?.price || null);
    setChange24h(prices[coinId]?.change24h || null);
    setLoading(false);
  }, [coinId, globalRange]);

  useEffect(() => { load(); }, [load]);

  const isPositive = (change24h || 0) >= 0;
  const minPrice = history.length ? Math.min(...history.map(d => d.price)) : 0;
  const maxPrice = history.length ? Math.max(...history.map(d => d.price)) : 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: coin.color }}>{COIN_ICONS[coinId]}</span>
          <div>
            <div className="text-white text-sm font-semibold">{coin.name}</div>
            <div className="text-slate-500 text-xs">{coin.symbol}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-sm">{formatPrice(price)}</div>
          {change24h !== null && (
            <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-24 bg-slate-700/30 rounded-lg animate-pulse" />
      ) : history.length > 0 ? (
        <ResponsiveContainer width="100%" height={96}>
          <AreaChart data={history} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={coin.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={coin.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="price" stroke={coin.color} strokeWidth={2}
              fill={`url(#grad-${coinId})`} dot={false} activeDot={{ r: 3, fill: coin.color }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-24 flex items-center justify-center text-slate-600 text-xs">Data tidak tersedia</div>
      )}

      {!loading && history.length > 0 && (
        <div className="flex justify-between mt-2 pt-2 border-t border-slate-700/40">
          <div>
            <div className="text-slate-600 text-xs">Terendah</div>
            <div className="text-slate-400 text-xs font-medium">{formatPrice(minPrice)}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-600 text-xs">Tertinggi</div>
            <div className="text-slate-400 text-xs font-medium">{formatPrice(maxPrice)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CryptoPriceChart({ addresses = {} }) {
  const prefs = loadPrefs();
  const [visibleCoins, setVisibleCoins] = useState(
    prefs.visibleCoins || COIN_LIST
  );
  const [globalRange, setGlobalRange] = useState(prefs.globalRange || 7);
  const [refreshKey, setRefreshKey] = useState(0);
  const [prices, setPrices] = useState({});
  const [balances, setBalances] = useState({});
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  // Fetch prices & balances for portfolio total
  useEffect(() => {
    async function loadPortfolio() {
      setPortfolioLoading(true);
      const [priceData, ...balResults] = await Promise.all([
        getPrices(),
        ...COIN_LIST.map(coin =>
          addresses[coin]?.address
            ? getBalance(coin, addresses[coin].address).catch(() => null).then(b => ({ coin, b }))
            : Promise.resolve({ coin, b: null })
        ),
      ]);
      setPrices(priceData);
      const bals = {};
      balResults.forEach(({ coin, b }) => { bals[coin] = b; });
      setBalances(bals);
      setPortfolioLoading(false);
    }
    loadPortfolio();
  }, [refreshKey]);

  const totalUSD = COIN_LIST.reduce((sum, coinId) => {
    const bal = balances[coinId];
    const p = prices[coinId]?.price;
    if (!bal || !p) return sum;
    const display = parseFloat(formatAmount(coinId, bal.balance || 0));
    return sum + display * p;
  }, 0);

  const toggleCoin = (coinId) => {
    setVisibleCoins(prev => {
      const next = prev.includes(coinId)
        ? prev.filter(c => c !== coinId)
        : [...prev, coinId];
      savePrefs({ visibleCoins: next, globalRange });
      return next;
    });
  };

  const handleRangeChange = (days) => {
    setGlobalRange(days);
    savePrefs({ visibleCoins, globalRange: days });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h2 className="text-white font-semibold text-sm">Performa Aset</h2>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Portfolio Total */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/60 border border-slate-700/40 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-xs">Total Portofolio</span>
        </div>
        {portfolioLoading ? (
          <div className="h-7 w-32 bg-slate-700/50 rounded-lg animate-pulse" />
        ) : (
          <div className="text-2xl font-bold text-white">
            ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          {COIN_LIST.map(coinId => {
            const bal = balances[coinId];
            const p = prices[coinId]?.price;
            const display = bal ? parseFloat(formatAmount(coinId, bal.balance || 0)) : 0;
            const usd = display * (p || 0);
            const pct = totalUSD > 0 ? (usd / totalUSD) * 100 : 0;
            const coin = COINS[coinId];
            return (
              <div key={coinId} className="flex-1">
                <div className="h-1 rounded-full mb-1.5 bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: coin.color }} />
                </div>
                <div className="text-slate-500 text-xs">{coin.symbol}</div>
                <div className="text-slate-300 text-xs font-medium">{pct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls: Coin filter + Range */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {COIN_LIST.map(coinId => {
            const coin = COINS[coinId];
            const active = visibleCoins.includes(coinId);
            return (
              <button
                key={coinId}
                onClick={() => toggleCoin(coinId)}
                className="text-xs px-2.5 py-1 rounded-lg border transition-all font-medium"
                style={active
                  ? { backgroundColor: coin.color + '22', borderColor: coin.color + '66', color: coin.color }
                  : { backgroundColor: 'transparent', borderColor: '#334155', color: '#64748b' }}
              >
                {COIN_ICONS[coinId]} {coin.symbol}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
          {RANGE_OPTIONS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => handleRangeChange(days)}
              className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
                globalRange === days
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      {visibleCoins.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">Pilih minimal satu aset untuk ditampilkan</div>
      ) : (
        visibleCoins.map(id => (
          <CoinChart key={`${id}-${refreshKey}-${globalRange}`} coinId={id} globalRange={globalRange} addresses={addresses} />
        ))
      )}
    </div>
  );
}
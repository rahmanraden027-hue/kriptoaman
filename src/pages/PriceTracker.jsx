import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, GitCompare, RefreshCw,
  Search, Star, StarOff, TrendingDown, TrendingUp,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import CoinCompare from '../components/wallet/CoinCompare';

const ALL_COINS = [
  { id: 'BTC', name: 'Bitcoin', color: '#F7931A', icon: '₿', network: 'Bitcoin', cat: 'L1' },
  { id: 'ETH', name: 'Ethereum', color: '#627EEA', icon: 'Ξ', network: 'Ethereum', cat: 'L1' },
  { id: 'BNB', name: 'BNB Chain', color: '#F0B90B', icon: 'B', network: 'BNB Chain', cat: 'L1' },
  { id: 'SOL', name: 'Solana', color: '#9945FF', icon: '◎', network: 'Solana', cat: 'L1' },
  { id: 'AVAX', name: 'Avalanche', color: '#E84142', icon: '▲', network: 'Avalanche', cat: 'L1' },
  { id: 'MATIC', name: 'Polygon', color: '#8247E5', icon: 'P', network: 'Polygon', cat: 'L1' },
  { id: 'DOT', name: 'Polkadot', color: '#E6007A', icon: '●', network: 'Polkadot', cat: 'L1' },
  { id: 'ATOM', name: 'Cosmos', color: '#2E3148', icon: '⚛', network: 'Cosmos Hub', cat: 'L1' },
  { id: 'NEAR', name: 'NEAR Protocol', color: '#00C08B', icon: 'N', network: 'NEAR', cat: 'L1' },
  { id: 'ADA', name: 'Cardano', color: '#0033AD', icon: '₳', network: 'Cardano', cat: 'L1' },
  { id: 'LTC', name: 'Litecoin', color: '#A0A0A0', icon: 'Ł', network: 'Litecoin', cat: 'L1' },
  { id: 'DOGE', name: 'Dogecoin', color: '#C2A633', icon: 'Ð', network: 'Dogecoin', cat: 'Meme' },
  { id: 'SHIB', name: 'Shiba Inu', color: '#FFA409', icon: '🐕', network: 'Ethereum', cat: 'Meme' },
  { id: 'ARB', name: 'Arbitrum', color: '#28A0F0', icon: 'A', network: 'Arbitrum One', cat: 'L2' },
  { id: 'OP', name: 'Optimism', color: '#FF0420', icon: 'O', network: 'OP Mainnet', cat: 'L2' },
  { id: 'FTM', name: 'Fantom', color: '#1969FF', icon: 'F', network: 'Fantom Opera', cat: 'L1' },
  { id: 'UNI', name: 'Uniswap', color: '#FF007A', icon: '🦄', network: 'Ethereum', cat: 'DeFi' },
  { id: 'LINK', name: 'Chainlink', color: '#375BD2', icon: '🔗', network: 'Multi-chain', cat: 'Oracle' },
  { id: 'AAVE', name: 'Aave', color: '#B6509E', icon: '👻', network: 'Multi-chain', cat: 'DeFi' },
  { id: 'CRV', name: 'Curve DAO', color: '#40649F', icon: '📈', network: 'Multi-chain', cat: 'DeFi' },
  { id: 'INJ', name: 'Injective', color: '#00A3FF', icon: 'I', network: 'Injective', cat: 'L1' },
  { id: 'SUI', name: 'Sui', color: '#4CA3FF', icon: 'S', network: 'Sui', cat: 'L1' },
  { id: 'APT', name: 'Aptos', color: '#2AB8E7', icon: '●', network: 'Aptos', cat: 'L1' },
  { id: 'XRP', name: 'XRP', color: '#00AAE4', icon: '⚡', network: 'XRP Ledger', cat: 'L1' },
  { id: 'TRX', name: 'TRON', color: '#FF0013', icon: 'T', network: 'TRON', cat: 'L1' },
];

const CATEGORIES = ['Semua', 'L1', 'L2', 'DeFi', 'Meme', 'Oracle'];
const STARRED_KEY = 'pt_starred_coins';
const REFRESH_MS = 60_000;

function formatPrice(price) {
  if (!Number.isFinite(Number(price))) return '—';
  const value = Number(price);
  if (value >= 1000) return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (value >= 1) return '$' + value.toFixed(2);
  if (value >= 0.01) return '$' + value.toFixed(4);
  return '$' + value.toFixed(8);
}

function formatMarketCap(value) {
  const mc = Number(value);
  if (!Number.isFinite(mc) || mc <= 0) return '—';
  if (mc >= 1e12) return '$' + (mc / 1e12).toFixed(2) + 'T';
  if (mc >= 1e9) return '$' + (mc / 1e9).toFixed(1) + 'B';
  if (mc >= 1e6) return '$' + (mc / 1e6).toFixed(0) + 'M';
  return '$' + mc.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function Sparkline({ data, color }) {
  if (!Array.isArray(data) || data.length < 2) {
    return <div className="flex h-8 w-16 items-center justify-center rounded bg-slate-800/40 text-[8px] text-slate-600">no history</div>;
  }
  const points = data.slice(-48).map((p, index) => ({ t: index, p: Number(p) })).filter(p => Number.isFinite(p.p));
  if (points.length < 2) return <div className="h-8 w-16 rounded bg-slate-800/40" />;

  return (
    <ResponsiveContainer width={64} height={32}>
      <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="p" stroke={color} strokeWidth={1.5} fill={`url(#sg-${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CoinRow({ coin, liveData, rank, starred, onStar, onClick }) {
  const price = liveData?.price;
  const change = Number(liveData?.change24h);
  const hasChange = Number.isFinite(change);
  const isUp = hasChange && change >= 0;

  return (
    <button onClick={onClick} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-800/60">
      <span className="w-6 text-center text-xs text-slate-600">{rank}</span>
      <button onClick={e => { e.stopPropagation(); onStar(coin.id); }} className="text-slate-600 transition-colors hover:text-yellow-400">
        {starred ? <Star className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" /> : <StarOff className="h-3.5 w-3.5" />}
      </button>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: coin.color }}>{coin.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white">{coin.id}</span>
          <span className="rounded px-1 py-0.5 text-[9px] font-bold" style={{ background: coin.color + '22', color: coin.color }}>{coin.cat}</span>
        </div>
        <div className="truncate text-xs text-slate-500">{liveData?.name || coin.name}</div>
      </div>
      <div className="hidden sm:block"><Sparkline data={liveData?.sparkline} color={coin.color} /></div>
      <div className="min-w-[80px] text-right">
        <div className="text-sm font-bold text-white">{formatPrice(price)}</div>
        <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${!hasChange ? 'text-slate-600' : isUp ? 'text-green-400' : 'text-red-400'}`}>
          {hasChange ? (isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />) : null}
          {hasChange ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : 'unavailable'}
        </div>
      </div>
    </button>
  );
}

function CoinDetail({ coin, liveData, onClose }) {
  const change = Number(liveData?.change24h);
  const hasChange = Number.isFinite(change);
  const isUp = hasChange && change >= 0;
  const chartData = (liveData?.sparkline || []).slice(-168).map((p, index) => ({ t: index, p: Number(p) })).filter(p => Number.isFinite(p.p));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-700 bg-slate-950 sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: coin.color }}>{coin.icon}</div>
            <div><div className="font-bold text-white">{liveData?.name || coin.name}</div><div className="text-xs text-slate-500">{coin.id} · {coin.network}</div></div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center text-xl font-bold text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <div className="text-3xl font-bold text-white">{formatPrice(liveData?.price)}</div>
            <div className={`mt-1 flex items-center gap-1 text-sm font-semibold ${!hasChange ? 'text-slate-500' : isUp ? 'text-green-400' : 'text-red-400'}`}>
              {hasChange ? (isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />) : null}
              {hasChange ? `${isUp ? '+' : ''}${change.toFixed(2)}% (24h)` : '24h change unavailable'}
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/60 p-3">
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <defs><linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={coin.color} stopOpacity={0.4} /><stop offset="95%" stopColor={coin.color} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="t" tick={{ fill: '#475569', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 9 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} formatter={v => [formatPrice(v), 'Harga']} />
                  <Area type="monotone" dataKey="p" stroke={coin.color} strokeWidth={2} fill="url(#detailGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-40 items-center justify-center text-xs text-slate-500">Riwayat harga belum tersedia pada snapshot KriptoAman.</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['Terendah 24h', formatPrice(liveData?.low24h)],
              ['Tertinggi 24h', formatPrice(liveData?.high24h)],
              ['Market Cap', formatMarketCap(liveData?.marketCap)],
              ['Sumber UI', 'KriptoAman API'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-700/40 bg-slate-800/50 p-3">
                <div className="mb-1 text-xs text-slate-500">{label}</div>
                <div className="truncate text-sm font-bold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PriceTracker() {
  const [livePrices, setLivePrices] = useState({});
  const [source, setSource] = useState(null);
  const [capturedAt, setCapturedAt] = useState(null);
  const [status, setStatus] = useState('loading');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [starred, setStarred] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STARRED_KEY)) || ['BTC', 'ETH', 'SOL']; } catch { return ['BTC', 'ETH', 'SOL']; }
  });
  const [showStarred, setShowStarred] = useState(false);
  const [detail, setDetail] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    let timer;

    const load = async () => {
      try {
        const response = await fetch('/api/market-snapshot-page?page=0&limit=500', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`KriptoAman market snapshot HTTP ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload?.data) || payload.data.length === 0) throw new Error('KriptoAman market snapshot is empty');

        const next = {};
        for (const row of payload.data) {
          const symbol = String(row?.symbol || '').toUpperCase();
          if (!symbol || next[symbol]) continue;
          next[symbol] = {
            name: row?.name || symbol,
            price: Number.isFinite(Number(row?.current_price)) ? Number(row.current_price) : null,
            change24h: Number.isFinite(Number(row?.price_change_percentage_24h)) ? Number(row.price_change_percentage_24h) : null,
            marketCap: Number.isFinite(Number(row?.market_cap)) ? Number(row.market_cap) : null,
            high24h: Number.isFinite(Number(row?.high_24h)) ? Number(row.high_24h) : null,
            low24h: Number.isFinite(Number(row?.low_24h)) ? Number(row.low_24h) : null,
            sparkline: Array.isArray(row?.sparkline_in_7d?.price) ? row.sparkline_in_7d.price : [],
          };
        }

        if (!alive) return;
        setLivePrices(next);
        setSource(payload?.source || 'KriptoAman Market Database');
        setCapturedAt(Number(payload?.capturedAt) || null);
        setStatus('live');
      } catch {
        if (alive) setStatus(previous => previous === 'live' ? 'stale' : 'unavailable');
      } finally {
        if (alive && autoRefresh) timer = window.setTimeout(load, REFRESH_MS);
      }
    };

    load();
    return () => { alive = false; window.clearTimeout(timer); };
  }, [autoRefresh, refreshKey]);

  const toggleStar = useCallback((id) => {
    setStarred(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      try { localStorage.setItem(STARRED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const filtered = ALL_COINS.filter(c => {
    const matchSearch = !search || c.id.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Semua' || c.cat === category;
    const matchStar = !showStarred || starred.includes(c.id);
    return matchSearch && matchCat && matchStar;
  });

  const moverPool = useMemo(
    () => ALL_COINS.filter(c => Number.isFinite(Number(livePrices[c.id]?.change24h))),
    [livePrices],
  );
  const topGainers = [...moverPool].sort((a, b) => livePrices[b.id].change24h - livePrices[a.id].change24h).slice(0, 3);
  const topLosers = [...moverPool].sort((a, b) => livePrices[a.id].change24h - livePrices[b.id].change24h).slice(0, 3);

  const freshAge = capturedAt ? Math.max(0, Date.now() - capturedAt) : null;
  const fresh = status === 'live' && freshAge != null && freshAge < 30 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-md space-y-4 p-4 pb-10">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600"><Activity className="h-4 w-4 text-white" /></div>
            <div>
              <h1 className="font-bold text-white">Crypto Price Tracker</h1>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${fresh ? 'animate-pulse bg-green-400' : status === 'unavailable' ? 'bg-red-400' : 'bg-amber-400'}`} />
                {fresh ? 'KriptoAman snapshot live' : status === 'loading' ? 'Connecting' : status === 'stale' ? 'Last verified snapshot' : 'Data unavailable'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCompare(true)} className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-medium text-purple-400">
              <GitCompare className="h-3 w-3" /> Bandingkan
            </button>
            <button onClick={() => autoRefresh ? setAutoRefresh(false) : (setAutoRefresh(true), setRefreshKey(v => v + 1))} className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium ${autoRefresh ? 'border-green-500/30 bg-green-500/20 text-green-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
              <RefreshCw className="h-3 w-3" />{autoRefresh ? 'Auto' : 'Pause'}
            </button>
          </div>
        </div>

        {status === 'unavailable' && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
            KriptoAman Market Database belum tersedia. Tidak ada harga atau grafik sintetis yang ditampilkan sebagai pengganti.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3">
            <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-green-400"><TrendingUp className="h-3.5 w-3.5" /> Top Gainers</div>
            {topGainers.length ? topGainers.map(c => (
              <div key={c.id} className="mb-1 flex items-center justify-between"><span className="text-xs font-semibold text-white">{c.id}</span><span className="text-xs font-bold text-green-400">+{livePrices[c.id].change24h.toFixed(2)}%</span></div>
            )) : <p className="text-[10px] text-slate-500">Belum tersedia</p>}
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-red-400"><TrendingDown className="h-3.5 w-3.5" /> Top Losers</div>
            {topLosers.length ? topLosers.map(c => (
              <div key={c.id} className="mb-1 flex items-center justify-between"><span className="text-xs font-semibold text-white">{c.id}</span><span className="text-xs font-bold text-red-400">{livePrices[c.id].change24h.toFixed(2)}%</span></div>
            )) : <p className="text-[10px] text-slate-500">Belum tersedia</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari aset kripto atau jaringan..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
        </div>

        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          <button onClick={() => setShowStarred(v => !v)} className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl border px-2.5 py-1.5 text-xs font-medium ${showStarred ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
            <Star className="h-3 w-3" /> Favorit
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`shrink-0 whitespace-nowrap rounded-xl border px-2.5 py-1.5 text-xs font-medium ${category === cat ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>{cat}</button>
          ))}
        </div>

        {starred.length > 0 && !showStarred && !search && category === 'Semua' && (
          <div className="overflow-hidden rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2 border-b border-yellow-500/10 px-3 py-2"><Star className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" /><span className="text-xs font-semibold text-yellow-400">Favorit Saya ({starred.length})</span></div>
            {ALL_COINS.filter(c => starred.includes(c.id)).map((coin, i) => (
              <CoinRow key={coin.id} coin={coin} liveData={livePrices[coin.id]} rank={i + 1} starred onStar={toggleStar} onClick={() => setDetail(coin)} />
            ))}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-900/60">
          <div className="flex items-center gap-3 border-b border-slate-800 px-3 py-2"><span className="w-6" /><span className="w-5" /><span className="w-8" /><span className="flex-1 text-xs text-slate-600">Nama</span><span className="hidden w-16 text-center text-xs text-slate-600 sm:block">History</span><span className="min-w-[80px] text-right text-xs text-slate-600">Harga</span></div>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">Tidak ada aset kripto ditemukan.</div>
          ) : filtered.map((coin, i) => (
            <CoinRow key={coin.id} coin={coin} liveData={livePrices[coin.id]} rank={i + 1} starred={starred.includes(coin.id)} onStar={toggleStar} onClick={() => setDetail(coin)} />
          ))}
        </div>

        <p className="text-center text-xs leading-5 text-slate-600">
          Crypto-only · data UI melalui KriptoAman Market Database{source ? ` · source snapshot: ${source}` : ''}{capturedAt ? ` · ${new Date(capturedAt).toLocaleString('id-ID')}` : ''}. Tidak ada harga, perubahan, atau grafik sintetis.
        </p>
      </div>

      {detail && <CoinDetail coin={detail} liveData={livePrices[detail.id]} onClose={() => setDetail(null)} />}
      {showCompare && <CoinCompare allCoins={ALL_COINS} livePrices={livePrices} onClose={() => setShowCompare(false)} />}
    </div>
  );
}

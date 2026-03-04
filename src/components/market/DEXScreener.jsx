import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, Zap, Star, Copy, ExternalLink, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';

const CHAINS = [
  { id: 'all', label: '🌐 Semua' },
  { id: 'ethereum', label: '⟠ ETH' },
  { id: 'bsc', label: '⬡ BNB' },
  { id: 'solana', label: '◎ SOL' },
  { id: 'base', label: '🔵 Base' },
  { id: 'arbitrum', label: '🔷 ARB' },
  { id: 'polygon', label: '🟣 MATIC' },
  { id: 'avalanche', label: '🔺 AVAX' },
  { id: 'optimism', label: '🔴 OP' },
  { id: 'fantom', label: '👻 FTM' },
  { id: 'cronos', label: '🟡 CRO' },
  { id: 'sui', label: '🌊 SUI' },
  { id: 'aptos', label: '🅰️ APT' },
  { id: 'ton', label: '💎 TON' },
  { id: 'near', label: '🟩 NEAR' },
  { id: 'tron', label: '🔴 TRX' },
];

const FILTERS = [
  { id: 'trending', label: '🔥 Trending', desc: 'Gainers terkuat 24 jam' },
  { id: 'meme', label: '🐸 Meme Coin', desc: 'PEPE, WIF, BONK, SHIB dll' },
  { id: 'gainers', label: '📈 Potential Up', desc: 'Naik kuat, volume oke' },
  { id: 'new', label: '⭐ Baru Listed', desc: 'Pair baru < 72 jam' },
  { id: 'volume', label: '💰 Volume Tinggi', desc: 'Likuiditas & volume besar' },
  { id: 'lowcap', label: '💎 Low Cap Gem', desc: 'FDV kecil, potensi 10x' },
];

const SCORE_REASONS = {
  highVol: '🔥 Volume tinggi',
  newPair: '⭐ Pair baru',
  priceUp: '📈 Harga naik kuat',
  highTx: '💱 Banyak transaksi',
  goodLiq: '💧 Likuiditas bagus',
  lowMcap: '💎 Market cap kecil',
};

function scorePair(pair) {
  let score = 0;
  const reasons = [];
  const h24 = pair.priceChange?.h24 || 0;
  const vol = pair.volume?.h24 || 0;
  const liq = pair.liquidity?.usd || 0;
  const txns = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
  const age = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 3600000 : 9999; // hours

  if (vol > 500000) { score += 25; reasons.push('highVol'); }
  else if (vol > 100000) { score += 15; }
  if (h24 > 20) { score += 25; reasons.push('priceUp'); }
  else if (h24 > 5) { score += 10; }
  if (txns > 1000) { score += 20; reasons.push('highTx'); }
  else if (txns > 300) { score += 10; }
  if (liq > 100000) { score += 15; reasons.push('goodLiq'); }
  if (age < 24) { score += 20; reasons.push('newPair'); }
  const fdv = pair.fdv || 0;
  if (fdv > 0 && fdv < 10000000) { score += 10; reasons.push('lowMcap'); }

  return { score: Math.min(score, 99), reasons };
}

function fmt(n) {
  if (!n) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(p) {
  if (!p) return '—';
  const n = parseFloat(p);
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(3)}`;
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 rounded-md bg-slate-700/60 text-slate-400 hover:text-white transition-colors" title="Copy">
      {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : score >= 45 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : 'bg-slate-700/60 text-slate-400 border-slate-600/40';
  return (
    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${color}`}>
      {score}pts
    </div>
  );
}

function PairCard({ pair }) {
  const [expanded, setExpanded] = useState(false);
  const { score, reasons } = scorePair(pair);
  const h1 = pair.priceChange?.h1 || 0;
  const h24 = pair.priceChange?.h24 || 0;
  const h6 = pair.priceChange?.h6 || 0;
  const chain = pair.chainId || '';
  const dexUrl = pair.url || `https://dexscreener.com/${chain}/${pair.pairAddress}`;
  const pairCode = `${pair.baseToken?.symbol}/${pair.quoteToken?.symbol}`;
  const age = pair.pairCreatedAt ? Math.floor((Date.now() - pair.pairCreatedAt) / 3600000) : null;
  const buys = pair.txns?.h24?.buys || 0;
  const sells = pair.txns?.h24?.sells || 0;
  const buyPct = buys + sells > 0 ? Math.round((buys / (buys + sells)) * 100) : 50;

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl overflow-hidden hover:border-slate-600/60 transition-all">
      <div className="p-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white font-bold text-sm">{pairCode}</span>
              <span className="text-[9px] bg-slate-700/80 text-slate-400 px-1.5 py-0.5 rounded-full uppercase">{chain}</span>
              <span className="text-[9px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full uppercase">{pair.dexId}</span>
              {age !== null && age < 24 && (
                <span className="text-[9px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">New {age}h</span>
              )}
            </div>
            <div className="text-slate-400 text-[10px] mt-0.5 truncate">{pair.baseToken?.name}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-white font-bold text-sm">{fmtPrice(pair.priceUsd)}</div>
            <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${h24 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {h24 >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {h24 >= 0 ? '+' : ''}{h24.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <div className="bg-slate-900/60 rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-slate-500 uppercase">Vol 24h</div>
            <div className="text-[11px] text-slate-200 font-semibold">{fmt(pair.volume?.h24)}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-slate-500 uppercase">Liquidity</div>
            <div className="text-[11px] text-slate-200 font-semibold">{fmt(pair.liquidity?.usd)}</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-slate-500 uppercase">FDV</div>
            <div className="text-[11px] text-slate-200 font-semibold">{fmt(pair.fdv)}</div>
          </div>
        </div>

        {/* Score & reasons */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <ScoreBadge score={score} />
          {reasons.slice(0, 3).map(r => (
            <span key={r} className="text-[9px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded-full">{SCORE_REASONS[r]}</span>
          ))}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-700/40 px-3 py-3 space-y-3">
          {/* Pair address */}
          <div>
            <div className="text-[9px] text-slate-500 uppercase mb-1">Kode Pair Address</div>
            <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg px-3 py-2">
              <code className="text-blue-300 text-[10px] font-mono flex-1 break-all">{pair.pairAddress}</code>
              <CopyBtn text={pair.pairAddress} />
            </div>
          </div>

          {/* Token address */}
          <div>
            <div className="text-[9px] text-slate-500 uppercase mb-1">Token Contract ({pair.baseToken?.symbol})</div>
            <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg px-3 py-2">
              <code className="text-green-300 text-[10px] font-mono flex-1 break-all">{pair.baseToken?.address}</code>
              <CopyBtn text={pair.baseToken?.address} />
            </div>
          </div>

          {/* Price changes */}
          <div>
            <div className="text-[9px] text-slate-500 uppercase mb-1.5">Perubahan Harga</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[['1H', h1], ['6H', h6], ['24H', h24]].map(([label, val]) => (
                <div key={label} className="bg-slate-900/60 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-slate-500">{label}</div>
                  <div className={`text-xs font-bold ${val >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buy/Sell pressure */}
          <div>
            <div className="text-[9px] text-slate-500 uppercase mb-1">Buy/Sell Pressure 24H</div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-[10px] font-semibold">{buys} buys</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${buyPct}%` }} />
              </div>
              <span className="text-red-400 text-[10px] font-semibold">{sells} sells</span>
            </div>
            <div className="text-center text-[9px] text-slate-500 mt-0.5">{buyPct}% tekanan beli</div>
          </div>

          {/* Action */}
          <a href={dexUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-semibold hover:bg-blue-600/30 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
            Buka di DexScreener
          </a>
        </div>
      )}
    </div>
  );
}

// ── Fetch Logic ──────────────────────────────────────────────────────────────
async function fetchTrending() {
  const res = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
  if (!res.ok) throw new Error('gagal');
  const data = await res.json();
  const tokenList = Array.isArray(data) ? data.slice(0, 30) : [];
  // Fetch details for each token
  const ids = tokenList.map(t => `${t.chainId}/${t.tokenAddress}`).join(',');
  const detailRes = await fetch(`https://api.dexscreener.com/tokens/v1/${ids}`);
  if (!detailRes.ok) throw new Error('gagal detail');
  const details = await detailRes.json();
  return Array.isArray(details) ? details : [];
}

// Popular tokens to scan across all chains
const SCAN_TOKENS = ['PEPE', 'SHIB', 'DOGE', 'WIF', 'BONK', 'FLOKI', 'MEME', 'WOJAK', 'TURBO', 'MOG'];
const STABLE_QUOTES = ['USDT', 'USDC', 'WETH', 'WBNB', 'SOL'];

async function searchPairs(query) {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.pairs || [];
}

async function fetchGainers(chain) {
  // Fetch from multiple token queries in parallel for wider coverage
  const queries = chain === 'all'
    ? ['USDT', 'USDC', 'WETH', 'WBNB', 'SOL', 'PEPE', 'WIF', 'BONK']
    : ['USDT', 'USDC', 'WETH'];
  const results = await Promise.all(queries.map(q => searchPairs(q)));
  const allPairs = results.flat();
  // Deduplicate by pairAddress
  const seen = new Set();
  const unique = allPairs.filter(p => {
    if (seen.has(p.pairAddress)) return false;
    seen.add(p.pairAddress);
    return true;
  });
  const filtered = chain === 'all' ? unique : unique.filter(p => p.chainId === chain);
  return filtered
    .filter(p => (p.priceChange?.h24 || 0) > 5 && (p.volume?.h24 || 0) > 30000)
    .sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0))
    .slice(0, 50);
}

async function fetchByChainSearch(query, chain) {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('gagal');
  const data = await res.json();
  const pairs = data.pairs || [];
  if (chain === 'all') return pairs.slice(0, 50);
  return pairs.filter(p => p.chainId === chain).slice(0, 50);
}

async function fetchNewPairs(chain) {
  const queries = ['new', 'launch', 'PEPE', 'MEME', 'AI', 'inu'];
  const results = await Promise.all(queries.map(q => searchPairs(q)));
  const allPairs = results.flat();
  const seen = new Set();
  const unique = allPairs.filter(p => {
    if (seen.has(p.pairAddress)) return false;
    seen.add(p.pairAddress);
    return true;
  });
  const now = Date.now();
  const filtered = unique.filter(p => {
    const age = p.pairCreatedAt ? (now - p.pairCreatedAt) / 3600000 : 9999;
    return age < 72 && (p.volume?.h24 || 0) > 5000;
  });
  const chainFiltered = chain === 'all' ? filtered : filtered.filter(p => p.chainId === chain);
  return chainFiltered.sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0)).slice(0, 50);
}

async function fetchVolume(chain) {
  const queries = ['USDT', 'USDC', 'WETH', 'WBNB', 'BTC', 'ETH', 'SOL'];
  const results = await Promise.all(queries.map(q => searchPairs(q)));
  const allPairs = results.flat();
  const seen = new Set();
  const unique = allPairs.filter(p => {
    if (seen.has(p.pairAddress)) return false;
    seen.add(p.pairAddress);
    return true;
  });
  const filtered = chain === 'all' ? unique : unique.filter(p => p.chainId === chain);
  return filtered
    .filter(p => (p.volume?.h24 || 0) > 10000)
    .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
    .slice(0, 50);
}

async function fetchTrendingMeme(chain) {
  const queries = SCAN_TOKENS;
  const results = await Promise.all(queries.map(q => searchPairs(q)));
  const allPairs = results.flat();
  const seen = new Set();
  const unique = allPairs.filter(p => {
    if (seen.has(p.pairAddress)) return false;
    seen.add(p.pairAddress);
    return true;
  });
  const filtered = chain === 'all' ? unique : unique.filter(p => p.chainId === chain);
  return filtered
    .filter(p => (p.volume?.h24 || 0) > 5000)
    .sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0))
    .slice(0, 50);
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function DEXScreener() {
  const [chain, setChain] = useState('all');
  const [filter, setFilter] = useState('trending');
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let results = [];
      if (searchQuery) {
        results = await fetchByChainSearch(searchQuery, chain);
      } else if (filter === 'trending' || filter === 'gainers') {
        results = await fetchGainers(chain);
      } else if (filter === 'meme') {
        results = await fetchTrendingMeme(chain);
      } else if (filter === 'new') {
        results = await fetchNewPairs(chain);
      } else if (filter === 'volume') {
        results = await fetchVolume(chain);
      } else if (filter === 'lowcap') {
        const base = await fetchGainers(chain);
        results = base.filter(p => {
          const fdv = p.fdv || 0;
          return fdv > 0 && fdv < 5000000;
        }).sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0));
      }
      // Sort by score
      results = results.map(p => ({ ...p, _score: scorePair(p).score }))
        .sort((a, b) => b._score - a._score);
      setPairs(results);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Gagal memuat data DEX. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [filter, chain, searchQuery]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  const topPairs = pairs.slice(0, 3);
  const rest = pairs.slice(3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">DEX Screener</h2>
            <p className="text-slate-500 text-[10px]">Koin potensial naik + kode pair</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-slate-600 text-[10px]">{lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          <button onClick={loadData} disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari koin / pair (mis: PEPE, DOGE)"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button type="submit" className="px-3 py-2 bg-blue-600 rounded-xl text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
          Cari
        </button>
        {searchQuery && (
          <button type="button" onClick={() => { setSearch(''); setSearchQuery(''); }}
            className="px-2 py-2 bg-slate-700 rounded-xl text-slate-400 text-xs hover:text-white">
            ✕
          </button>
        )}
      </form>

      {/* Chain Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CHAINS.map(c => (
          <button key={c.id} onClick={() => setChain(c.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              chain === c.id
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-white'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Mode Filter */}
      <div className="grid grid-cols-3 gap-1.5">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-2.5 rounded-xl text-left border transition-all ${
              filter === f.id
                ? 'bg-orange-500/15 border-orange-500/40 text-white'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-slate-300'
            }`}>
            <div className="text-xs font-bold">{f.label}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{f.desc}</div>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : pairs.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          Tidak ada pair ditemukan. Coba filter lain.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 spotlight */}
          {topPairs.length > 0 && !searchQuery && (
            <div className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold">TOP 3 PALING POTENSIAL</span>
              </div>
              <div className="space-y-1.5">
                {topPairs.map((pair, i) => {
                  const h24 = pair.priceChange?.h24 || 0;
                  const { score } = scorePair(pair);
                  return (
                    <div key={pair.pairAddress} className="flex items-center gap-2 bg-slate-900/60 rounded-lg px-3 py-2">
                      <span className="text-yellow-400 font-black text-sm w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-bold">{pair.baseToken?.symbol}/{pair.quoteToken?.symbol}</div>
                        <div className="text-slate-500 text-[9px] truncate">{pair.chainId} · {pair.dexId}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-bold ${h24 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {h24 >= 0 ? '+' : ''}{h24.toFixed(2)}%
                        </div>
                        <ScoreBadge score={score} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All pairs */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-slate-500" />
              <span className="text-slate-500 text-[10px]">{pairs.length} pair ditemukan · Tap untuk lihat kode pair</span>
            </div>
            {pairs.map(pair => (
              <PairCard key={`${pair.pairAddress}-${pair.chainId}`} pair={pair} />
            ))}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Data real-time dari DexScreener. Skor potensial bukan rekomendasi investasi. Selalu DYOR (Do Your Own Research) sebelum membeli. Crypto sangat berisiko tinggi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Trash2, Filter, Coins, Lock, PiggyBank,
  ExternalLink, RefreshCw, X, ChevronDown, TrendingUp,
  AlertTriangle, CheckCircle2, ArrowUpDown, TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddTokenModal from '../components/wallet/AddTokenModal';
import {
  loadCustomTokens, removeCustomToken, EVM_CHAINS
} from '../components/wallet/customTokens';
import { useTokenMarketData, useCryptoPrices } from '../components/wallet/useMarketData';

// ── Storage keys ──────────────────────────────────────────────────────────────
const STAKING_KEY = 'wallet_staking_positions_v2';
const SAVINGS_KEY = 'usdt_savings_positions';
const ASSET_CATEGORIES = {
  crypto: { label: 'Cryptocurrency', icon: '₿', color: '#3b82f6' },
  stocks: { label: 'Saham', icon: '📈', color: '#8b5cf6' },
  gold: { label: 'Emas', icon: '🏆', color: '#f59e0b' },
  bonds: { label: 'Obligasi', icon: '📊', color: '#10b981' },
  forex: { label: 'Forex', icon: '💱', color: '#06b6d4' },
  defi: { label: 'DeFi Yield', icon: '🌾', color: '#ec4899' },
};

function loadStaking() { try { return JSON.parse(localStorage.getItem(STAKING_KEY)) || []; } catch { return []; } }
function saveStaking(d) { localStorage.setItem(STAKING_KEY, JSON.stringify(d)); }
function loadSavings() { try { return JSON.parse(localStorage.getItem(SAVINGS_KEY)) || []; } catch { return []; } }
function saveSavings(d) { localStorage.setItem(SAVINGS_KEY, JSON.stringify(d)); }

// ── APY helpers ───────────────────────────────────────────────────────────────
const SAVINGS_APY = {
  aave: 5.82, compound: 4.91, curve: 7.24, yearn: 8.15,
  beefy: 9.38, marinade: 7.92, kamino: 11.4, save: 6.15,
};

function stakingReward(pos) {
  const days = Math.max(1, (Date.now() - new Date(pos.stakedAt).getTime()) / 86400000);
  return pos.amount * pos.apy * (1 - (pos.fee || 0) / 100) / 100 / 365 * days;
}

function savingsReward(pos) {
  const apy = SAVINGS_APY[pos.protocol?.id] || pos.protocol?.apy || 0;
  const days = Math.max(1, (Date.now() - new Date(pos.date).getTime()) / 86400000);
  return pos.amount * apy / 100 / 365 * days;
}

// ── Pill filter button ────────────────────────────────────────────────────────
function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${active ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
      {children}
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, count, color = 'text-slate-400' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-white font-semibold text-sm">{title}</span>
      {count !== undefined && (
        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  );
}

// ── Category Badge ────────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const cat = ASSET_CATEGORIES[category] || ASSET_CATEGORIES.crypto;
  return (
    <span className="text-[10px] px-2 py-1 rounded-full font-medium border" style={{ 
      background: cat.color + '22', 
      color: cat.color, 
      borderColor: cat.color + '44' 
    }}>
      {cat.icon} {cat.label}
    </span>
  );
}

// ── Token Row ─────────────────────────────────────────────────────────────────
function TokenRow({ token, onRemove, cryptoPrices = {} }) {
  const CHAIN_COLORS = {
    ETH: '#627EEA', BNB: '#F0B90B', MATIC: '#8247E5',
    ARB: '#28A0F0', OP: '#FF0420', BASE: '#0052FF',
    AVAX: '#E84142', FTM: '#1969FF',
  };
  const color = CHAIN_COLORS[token.chain] || '#94a3b8';
  const category = token.category || 'crypto';
  
  const { data: marketData } = useTokenMarketData(token.contract);
  const price = marketData?.price || cryptoPrices[token.symbol]?.price || 0;
  const change24h = marketData?.change24h || cryptoPrices[token.symbol]?.change24h || 0;
  const marketCap = marketData?.marketCap;
  
  const tokenValue = (token.balance || 0) * price;
  const isPositive = change24h >= 0;

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 group">
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
        style={{ background: color + '22', color }}>
        {token.symbol?.slice(0, 2) || '??'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-white text-sm font-semibold truncate">{token.symbol}</span>
          <CategoryBadge category={category} />
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: color + '22', color }}>{token.chain}</span>
          <p className="text-slate-500 text-xs truncate">{token.name}</p>
        </div>
        {price > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
            <div className={`flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(change24h).toFixed(2)}%</span>
            </div>
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-white text-sm font-bold">{(token.balance || 0).toFixed(4)}</p>
        {tokenValue > 0 && (
          <p className="text-slate-400 text-xs">${tokenValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        )}
        {marketCap && (
          <p className="text-slate-600 text-[10px]">Cap: ${(marketCap / 1e9).toFixed(2)}B</p>
        )}
      </div>
      <button onClick={() => onRemove(token.id)}
        className="ml-1 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Staking Row ───────────────────────────────────────────────────────────────
function StakingRow({ pos, onRemove }) {
  const COIN_COLORS = { ETH: '#627EEA', SOL: '#9945FF', BNB: '#F0B90B' };
  const COIN_ICONS  = { ETH: 'Ξ', SOL: '◎', BNB: 'B' };
  const color = COIN_COLORS[pos.coin] || '#94a3b8';
  const netApy = pos.apy * (1 - (pos.fee || 0) / 100);
  const reward = stakingReward(pos);
  const days = Math.max(1, Math.floor((Date.now() - new Date(pos.stakedAt).getTime()) / 86400000));

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 group">
      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base shrink-0"
        style={{ background: color + '33', color }}>
        {COIN_ICONS[pos.coin]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-white text-sm font-semibold">{pos.providerName}</span>
          <CategoryBadge category="defi" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: color + '22', color }}>{pos.coin}</span>
          <span className="text-slate-500 text-xs">{netApy.toFixed(2)}% net APY</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white text-sm font-bold">{pos.amount.toFixed(4)}</p>
        <p className="text-green-400 text-xs">+{reward.toFixed(6)}</p>
      </div>
      <button onClick={() => onRemove(pos.id)}
        className="ml-1 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Savings Row ───────────────────────────────────────────────────────────────
function SavingsRow({ pos, onRemove }) {
  const proto = pos.protocol || {};
  const apy = SAVINGS_APY[proto.id] || proto.apy || 0;
  const reward = savingsReward(pos);
  const days = Math.max(1, Math.floor((Date.now() - new Date(pos.date).getTime()) / 86400000));

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: (proto.color || '#22c55e') + '22', border: `1px solid ${proto.color || '#22c55e'}44` }}>
        {proto.logo || '💰'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-sm font-semibold">{proto.name || 'Unknown'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium border border-green-500/20">
            {proto.network || 'DeFi'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-slate-500 text-xs">{apy.toFixed(2)}% APY</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-slate-500 text-xs">{days}h aktif</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white text-sm font-bold">${pos.amount.toFixed(2)}</p>
        <p className="text-green-400 text-xs">+${reward.toFixed(4)}</p>
      </div>
      <button onClick={() => onRemove(pos.id)}
        className="ml-1 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="py-8 flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
        <Icon className="w-6 h-6 text-slate-600" />
      </div>
      <p className="text-slate-400 text-sm font-medium">{text}</p>
      {sub && <p className="text-slate-600 text-xs">{sub}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AssetManager() {
  const [tokens, setTokens]       = useState([]);
  const [staking, setStaking]     = useState([]);
  const [savings, setSavings]     = useState([]);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [chainFilter, setChainFilter]   = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [networkFilter, setNetworkFilter] = useState('all');
  const [apySort, setApySort]     = useState('none'); // none | asc | desc
  const [showAddToken, setShowAddToken] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, id, label }
  const [sortByValue, setSortByValue] = useState('none'); // none | asc | desc
  
  const { prices: cryptoPrices } = useCryptoPrices();

  const reload = () => {
    setTokens(loadCustomTokens());
    setStaking(loadStaking());
    setSavings(loadSavings());
  };

  useEffect(() => { reload(); }, []);

  // ── Filter & Search ────────────────────────────────────────────────────────
  const filteredTokens = useMemo(() => {
    let list = tokens;
    if (chainFilter !== 'all') list = list.filter(t => t.chain === chainFilter);
    if (categoryFilter !== 'all') list = list.filter(t => (t.category || 'crypto') === categoryFilter);
    if (search) list = list.filter(t =>
      t.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.contract?.toLowerCase().includes(search.toLowerCase())
    );
    if (sortByValue !== 'none') {
      list = [...list].sort((a, b) => sortByValue === 'desc' ? (b.balance || 0) - (a.balance || 0) : (a.balance || 0) - (b.balance || 0));
    }
    return list;
  }, [tokens, chainFilter, categoryFilter, search, sortByValue]);

  const filteredStaking = useMemo(() => {
    let list = staking;
    if (networkFilter !== 'all') list = list.filter(p => p.coin === networkFilter);
    if (search) list = list.filter(p =>
      p.providerName?.toLowerCase().includes(search.toLowerCase()) ||
      p.coin?.toLowerCase().includes(search.toLowerCase())
    );
    if (apySort !== 'none') {
      list = [...list].sort((a, b) => apySort === 'desc' ? b.apy - a.apy : a.apy - b.apy);
    }
    return list;
  }, [staking, networkFilter, search, apySort]);

  const filteredSavings = useMemo(() => {
    let list = savings;
    if (networkFilter !== 'all') list = list.filter(p => p.protocol?.network === networkFilter || p.coin === networkFilter);
    if (search) list = list.filter(p =>
      p.protocol?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.protocol?.network?.toLowerCase().includes(search.toLowerCase())
    );
    if (apySort !== 'none') {
      list = [...list].sort((a, b) => {
        const apyA = SAVINGS_APY[a.protocol?.id] || a.protocol?.apy || 0;
        const apyB = SAVINGS_APY[b.protocol?.id] || b.protocol?.apy || 0;
        return apySort === 'desc' ? apyB - apyA : apyA - apyB;
      });
    }
    return list;
  }, [savings, networkFilter, search, apySort]);

  // ── Summaries ─────────────────────────────────────────────────────────────
  const totalStakingReward = staking.reduce((s, p) => s + stakingReward(p), 0);
  const totalSavingsDeposit = savings.reduce((s, p) => s + p.amount, 0);
  const totalSavingsReward = savings.reduce((s, p) => s + savingsReward(p), 0);
  
  // Calculate total token value
  const totalTokenValue = filteredTokens.reduce((sum, token) => {
    const price = cryptoPrices[token.symbol]?.price || 0;
    return sum + ((token.balance || 0) * price);
  }, 0);

  // ── Delete handlers ────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'token') {
      removeCustomToken(deleteConfirm.id);
      setTokens(loadCustomTokens());
    } else if (deleteConfirm.type === 'staking') {
      const updated = staking.filter(p => p.id !== deleteConfirm.id);
      saveStaking(updated); setStaking(updated);
    } else if (deleteConfirm.type === 'savings') {
      const updated = savings.filter(p => p.id !== deleteConfirm.id);
      saveSavings(updated); setSavings(updated);
    }
    setDeleteConfirm(null);
  };

  const TABS = [
    { id: 'all',     label: 'Semua' },
    { id: 'tokens',  label: `Token (${tokens.length})` },
    { id: 'staking', label: `Staking (${staking.length})` },
    { id: 'savings', label: `Savings (${savings.length})` },
  ];

  const DEFI_NETWORKS = ['all', 'ETH', 'SOL', 'BNB', 'Ethereum', 'Solana', 'BNB Chain', 'Multi-chain'];

  const showTokens  = activeTab === 'all' || activeTab === 'tokens';
  const showStaking = activeTab === 'all' || activeTab === 'staking';
  const showSavings = activeTab === 'all' || activeTab === 'savings';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md mx-auto p-4 pb-24 space-y-4">

        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">Manajemen Aset</h1>
            <p className="text-slate-500 text-xs mt-0.5">Token kustom & posisi DeFi</p>
          </div>
          <button onClick={reload} className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
            <Coins className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{tokens.length}</p>
            <p className="text-slate-500 text-[10px]">Token Kustom</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
            <Lock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{staking.length}</p>
            <p className="text-slate-500 text-[10px]">Staking Aktif</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
            <PiggyBank className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-white font-bold text-lg">{savings.length}</p>
            <p className="text-slate-500 text-[10px]">Savings Aktif</p>
          </div>
        </div>

        {/* Passive Income Bar */}
        {(staking.length > 0 || savings.length > 0) && (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-slate-300 text-xs">Total Reward Terakrual</span>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold text-sm">+${totalSavingsReward.toFixed(4)} USDT</p>
              <p className="text-slate-500 text-[10px]">{staking.length + savings.length} posisi aktif</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, simbol, protokol, atau kontrak..."
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/60 border border-slate-700/40 rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="space-y-2">
          {(showTokens && activeTab !== 'staking' && activeTab !== 'savings') && (
            <div className="space-y-1.5">
              <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">Filter Kategori Aset</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <Pill active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>Semua</Pill>
                {Object.entries(ASSET_CATEGORIES).map(([key, cat]) => (
                  <Pill key={key} active={categoryFilter === key} onClick={() => setCategoryFilter(key)}>
                    {cat.icon} {cat.label}
                  </Pill>
                ))}
              </div>
            </div>
          )}
          {(showTokens && activeTab !== 'staking' && activeTab !== 'savings') && (
            <div className="space-y-1.5">
              <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">Filter Blockchain</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <Pill active={chainFilter === 'all'} onClick={() => setChainFilter('all')}>Semua</Pill>
                {EVM_CHAINS.map(c => (
                  <Pill key={c} active={chainFilter === c} onClick={() => setChainFilter(c)}>{c}</Pill>
                ))}
              </div>
            </div>
          )}

          {(showStaking || showSavings) && activeTab !== 'tokens' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
                {['all', 'ETH', 'SOL', 'BNB', 'Ethereum', 'Solana', 'BNB Chain', 'Multi-chain'].map(n => (
                  <Pill key={n} active={networkFilter === n} onClick={() => setNetworkFilter(n)}>
                    {n === 'all' ? 'Semua' : n}
                  </Pill>
                ))}
              </div>
              <button
                onClick={() => setApySort(s => s === 'desc' ? 'asc' : s === 'asc' ? 'none' : 'desc')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all shrink-0 ${apySort !== 'none' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <ArrowUpDown className="w-3 h-3" />
                APY {apySort === 'desc' ? '↓' : apySort === 'asc' ? '↑' : ''}
              </button>
            </div>
          )}
          {(showTokens && activeTab !== 'staking' && activeTab !== 'savings') && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setSortByValue(s => s === 'desc' ? 'asc' : s === 'asc' ? 'none' : 'desc')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${sortByValue !== 'none' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <ArrowUpDown className="w-3 h-3" />
                Nilai {sortByValue === 'desc' ? '↓' : sortByValue === 'asc' ? '↑' : ''}
              </button>
            </div>
          )}
        </div>

        {/* ── Custom Tokens Section ─────────────────────────────────────────── */}
        {showTokens && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader icon={Coins} title="Token Kustom" count={filteredTokens.length} color="text-blue-400" />
              <Button onClick={() => setShowAddToken(true)} size="sm"
                className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1">
                <Plus className="w-3 h-3" /> Tambah
              </Button>
            </div>
            
            {/* Token Value Summary */}
            {filteredTokens.length > 0 && totalTokenValue > 0 && (
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-500/20 rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300 text-xs">Total Nilai Aset</span>
                </div>
                <p className="text-blue-400 font-bold text-sm">${totalTokenValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              </div>
            )}

            {filteredTokens.length === 0 ? (
              <EmptyState icon={Coins}
                text={tokens.length === 0 ? 'Belum ada token kustom' : 'Tidak ada token yang cocok'}
                sub={tokens.length === 0 ? 'Tambah token ERC-20 / BEP-20 kustom' : 'Coba ubah filter atau kata kunci'}
              />
            ) : (
              <div className="space-y-2">
                {filteredTokens.map(token => (
                  <TokenRow key={token.id} token={token} cryptoPrices={cryptoPrices}
                    onRemove={id => setDeleteConfirm({ type: 'token', id, label: token.symbol })} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Staking Section ───────────────────────────────────────────────── */}
        {showStaking && (
          <div>
            <SectionHeader icon={Lock} title="Posisi Staking" count={filteredStaking.length} color="text-purple-400" />

            {filteredStaking.length === 0 ? (
              <EmptyState icon={Lock}
                text={staking.length === 0 ? 'Belum ada posisi staking' : 'Tidak ada yang cocok'}
                sub={staking.length === 0 ? 'Buka tab Wallet untuk mulai staking ETH/SOL/BNB' : 'Coba ubah filter jaringan'}
              />
            ) : (
              <div className="space-y-2">
                {filteredStaking.map(pos => (
                  <StakingRow key={pos.id} pos={pos}
                    onRemove={id => setDeleteConfirm({ type: 'staking', id, label: `${pos.providerName} (${pos.coin})` })} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Savings Section ───────────────────────────────────────────────── */}
        {showSavings && (
          <div>
            <SectionHeader icon={PiggyBank} title="Posisi DeFi Savings" count={filteredSavings.length} color="text-green-400" />

            {filteredSavings.length === 0 ? (
              <EmptyState icon={PiggyBank}
                text={savings.length === 0 ? 'Belum ada posisi savings' : 'Tidak ada yang cocok'}
                sub={savings.length === 0 ? 'Buka halaman DEX & Savings untuk deposit USDT' : 'Coba ubah filter jaringan'}
              />
            ) : (
              <div className="space-y-2">
                {filteredSavings.map(pos => (
                  <SavingsRow key={pos.id} pos={pos}
                    onRemove={id => setDeleteConfirm({ type: 'savings', id, label: pos.protocol?.name })} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add Token Modal */}
      {showAddToken && (
        <AddTokenModal
          addresses={{}}
          onClose={() => setShowAddToken(false)}
          onAdded={() => { setTokens(loadCustomTokens()); setShowAddToken(false); }}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Hapus posisi ini?</p>
                <p className="text-slate-400 text-xs mt-0.5 break-all">{deleteConfirm.label}</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs">Aksi ini tidak bisa dibatalkan. Posisi akan dihapus dari daftar lokal.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">Batal</Button>
              <Button onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs">Hapus</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { Search, X, BarChart3, Zap, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Search component untuk aset di portfolio
 * Bisa filter by: name, type, value, network
 */
export default function AssetSearch({ assets = [], onFilterChange }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [sortBy, setSortBy] = useState('value');

  const filtered = useMemo(() => {
    let result = assets;

    // Filter by search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(a =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.network.toLowerCase().includes(q)
      );
    }

    // Filter by type
    if (type !== 'all') {
      result = result.filter(a => a.type === type);
    }

    // Sort
    if (sortBy === 'value') {
      result.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.symbol.localeCompare(b.symbol));
    } else if (sortBy === 'change') {
      result.sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
    }

    return result;
  }, [assets, query, type, sortBy]);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <Input
          type="text"
          placeholder="Cari aset..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); onFilterChange?.({ query: e.target.value, type, sortBy }); }}
          className="pl-9 pr-8 bg-slate-800 border-slate-700 text-white"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onFilterChange?.({ query: '', type, sortBy }); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters & Sort */}
      <div className="flex gap-2 flex-wrap">
        {/* Type Filter */}
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {['all', 'crypto', 'stablecoin', 'defi'].map(t => (
            <button
              key={t}
              onClick={() => { setType(t); onFilterChange?.({ query, type: t, sortBy }); }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                type === t
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); onFilterChange?.({ query, type, sortBy: e.target.value }); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs font-semibold text-white cursor-pointer hover:bg-slate-700 transition-colors"
        >
          <option value="value">Sort by Value</option>
          <option value="name">Sort by Name</option>
          <option value="change">Sort by 24h Change</option>
        </select>
      </div>

      {/* Results Info */}
      <p className="text-slate-400 text-xs">
        Menampilkan {filtered.length} aset dari {assets.length}
      </p>

      {/* Results */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm">Tidak ada aset yang sesuai</p>
          </div>
        ) : (
          filtered.map(asset => (
            <AssetCard key={`${asset.symbol}-${asset.network}`} asset={asset} />
          ))
        )}
      </div>
    </div>
  );
}

function AssetCard({ asset }) {
  const isPositive = (asset.change24h || 0) >= 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{asset.icon || '🪙'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{asset.symbol}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">{asset.network}</span>
              {asset.type === 'stablecoin' && <Lock className="w-3 h-3 text-blue-400" />}
              {asset.type === 'defi' && <Zap className="w-3 h-3 text-yellow-400" />}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="text-right">
          <p className="text-white font-semibold text-sm">${asset.valueUsd?.toLocaleString() || 0}</p>
          <p className={`text-xs mt-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{asset.change24h?.toFixed(2) || 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
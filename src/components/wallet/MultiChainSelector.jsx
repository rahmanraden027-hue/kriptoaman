import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { NETWORKS_LIST, COINS_LIST, getCoinsForNetwork } from './multiChainConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NetworkSelector({ selected, onChange, label = 'Network' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = NETWORKS_LIST.filter(n =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const selectedNet = NETWORKS_LIST.find(n => n.key === selected);

  return (
    <div className="relative w-full">
      <label className="text-slate-400 text-xs font-bold block mb-2">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center justify-between text-white text-sm hover:bg-slate-700 transition-colors"
      >
        <span>{selectedNet ? `${selectedNet.name} (${selectedNet.symbol})` : 'Select network'}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 space-y-2">
          <Input
            placeholder="Search networks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-slate-400 text-xs p-2">No networks found</p>
            ) : (
              filtered.map(net => (
                <button
                  key={net.key}
                  onClick={() => {
                    onChange(net.key);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                    selected === net.key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{net.name}</span>
                    <span className="text-[10px] text-slate-400">{net.symbol}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{net.category}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CoinSelector({ selected, onChange, network = null, label = 'Coin' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const availableCoins = network
    ? getCoinsForNetwork(network).map(symbol => COINS_LIST.find(c => c.symbol === symbol))
    : COINS_LIST;

  const filtered = availableCoins.filter(c =>
    c && (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
    )
  );

  const selectedCoin = COINS_LIST.find(c => c.symbol === selected);

  return (
    <div className="relative w-full">
      <label className="text-slate-400 text-xs font-bold block mb-2">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center justify-between text-white text-sm hover:bg-slate-700 transition-colors"
      >
        <span>{selectedCoin ? `${selectedCoin.icon} ${selectedCoin.symbol}` : 'Select coin'}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 space-y-2">
          <Input
            placeholder="Search coins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-slate-400 text-xs p-2">No coins found</p>
            ) : (
              filtered.map(coin => (
                <button
                  key={coin.symbol}
                  onClick={() => {
                    onChange(coin.symbol);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                    selected === coin.symbol
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-between">
                    <span>{coin.icon} {coin.symbol}</span>
                    <span className="text-[10px] text-slate-500">{coin.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
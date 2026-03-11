import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, TrendingUp, Clock, Send, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { COINS_LIST, NETWORKS_LIST } from './multiChainConfig';
import { Input } from '@/components/ui/input';

function SearchResultItem({ item, type, onClick }) {
  const typeConfig = {
    coin: { icon: '🪙', label: 'Coin', color: 'text-blue-400' },
    network: { icon: '🌐', label: 'Network', color: 'text-purple-400' },
    transaction: { icon: '📊', label: 'Transaction', color: 'text-green-400' },
    address: { icon: '📍', label: 'Address', color: 'text-indigo-400' },
  };

  const config = typeConfig[type] || {};

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">{item.name || item.symbol}</p>
          <p className={`text-xs ${config.color}`}>{config.label}</p>
        </div>
        {type === 'coin' && item.networks && (
          <span className="text-xs text-slate-400">{item.networks.length} networks</span>
        )}
        {type === 'transaction' && item.amount && (
          <span className="text-xs text-slate-300 font-mono">{item.amount}</span>
        )}
      </div>
    </button>
  );
}

export default function WalletSearch({ 
  onSelectCoin, 
  onSelectNetwork, 
  onSelectTransaction,
  transactions = [],
  autoFocus = false 
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('wallet_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return {
        coins: COINS_LIST.slice(0, 5),
        networks: NETWORKS_LIST.slice(0, 5),
        transactions: transactions.slice(0, 5),
      };
    }

    const q = query.toLowerCase();
    return {
      coins: COINS_LIST.filter(c =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
      ),
      networks: NETWORKS_LIST.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.symbol.toLowerCase().includes(q)
      ),
      transactions: transactions.filter(t =>
        (t.coin && t.coin.toLowerCase().includes(q)) ||
        (t.toAddress && t.toAddress.toLowerCase().includes(q)) ||
        (t.hash && t.hash.toLowerCase().includes(q))
      ),
    };
  }, [query, transactions]);

  const handleCoinSelect = (coin) => {
    saveSearch(`Coin: ${coin.symbol}`);
    onSelectCoin?.(coin);
    setOpen(false);
    setQuery('');
  };

  const handleNetworkSelect = (network) => {
    saveSearch(`Network: ${network.symbol}`);
    onSelectNetwork?.(network);
    setOpen(false);
    setQuery('');
  };

  const handleTransactionSelect = (tx) => {
    saveSearch(`Tx: ${tx.hash?.slice(0, 8)}`);
    onSelectTransaction?.(tx);
    setOpen(false);
    setQuery('');
  };

  const saveSearch = (search) => {
    const searches = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(searches);
    localStorage.setItem('wallet_searches', JSON.stringify(searches));
  };

  const hasResults = results.coins.length > 0 || results.networks.length > 0 || results.transactions.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <Input
          autoFocus={autoFocus}
          type="text"
          placeholder="Cari coins, networks, transaksi..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="pl-9 pr-8 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-96 overflow-y-auto">
          {!query && recentSearches.length > 0 && (
            <div className="p-3 space-y-2 border-b border-slate-700">
              <p className="text-slate-400 text-xs font-bold px-1 uppercase">Recent Searches</p>
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(search.split(': ')[1] || search);
                    setOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 rounded transition-colors flex items-center gap-2"
                >
                  <Clock className="w-3 h-3 text-slate-500" />
                  {search}
                </button>
              ))}
            </div>
          )}

          {hasResults ? (
            <div className="p-2 space-y-3">
              {/* Coins Section */}
              {results.coins.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-bold px-2 py-1 uppercase">Coins</p>
                  <div className="space-y-1">
                    {results.coins.map(coin => (
                      <SearchResultItem
                        key={coin.symbol}
                        item={coin}
                        type="coin"
                        onClick={() => handleCoinSelect(coin)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Networks Section */}
              {results.networks.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-bold px-2 py-1 uppercase">Networks</p>
                  <div className="space-y-1">
                    {results.networks.map(network => (
                      <SearchResultItem
                        key={network.key}
                        item={network}
                        type="network"
                        onClick={() => handleNetworkSelect(network)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions Section */}
              {results.transactions.length > 0 && (
                <div>
                  <p className="text-slate-400 text-xs font-bold px-2 py-1 uppercase">Transactions</p>
                  <div className="space-y-1">
                    {results.transactions.map(tx => (
                      <button
                        key={tx.hash}
                        onClick={() => handleTransactionSelect(tx)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {tx.type === 'send' ? (
                            <Send className="w-4 h-4 text-red-400" />
                          ) : tx.type === 'receive' ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                          )}
                          <div className="flex-1">
                            <p className="text-white text-sm font-semibold">{tx.coin}</p>
                            <p className="text-xs text-slate-400 font-mono">{tx.hash?.slice(0, 12)}...</p>
                          </div>
                          <p className="text-xs text-slate-300">{tx.amount}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm">Tidak ada hasil untuk "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook untuk manage wallet search state
 */
export function useWalletSearch() {
  const [selectedCoin, setSelectedCoin] = React.useState(null);
  const [selectedNetwork, setSelectedNetwork] = React.useState(null);
  const [selectedTransaction, setSelectedTransaction] = React.useState(null);

  return {
    selectedCoin,
    selectedNetwork,
    selectedTransaction,
    selectCoin: setSelectedCoin,
    selectNetwork: setSelectedNetwork,
    selectTransaction: setSelectedTransaction,
    clear: () => {
      setSelectedCoin(null);
      setSelectedNetwork(null);
      setSelectedTransaction(null);
    }
  };
}
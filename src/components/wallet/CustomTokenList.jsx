import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, RefreshCw, ArrowDownLeft, ArrowUpRight, ExternalLink, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import { loadCustomTokens, removeCustomToken, fetchTokenBalance, fetchTokenTransactions } from './customTokens';
import AddTokenModal from './AddTokenModal';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const CHAIN_COLORS = {
  ETH: '#627EEA', BNB: '#F0B90B', MATIC: '#8247E5', ARB: '#28A0F0',
  OP: '#FF0420', BASE: '#0052FF', AVAX: '#E84142', FTM: '#1969FF',
};

function TokenTxItem({ tx, token }) {
  const [expanded, setExpanded] = useState(false);
  const isReceived = tx.type === 'received';
  const amt = Math.abs(tx.amount).toFixed(6);
  const dateStr = tx.date ? (() => {
    try { return format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: idLocale }); }
    catch { return tx.date; }
  })() : '';

  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl overflow-hidden">
      <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-700/20 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isReceived ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {isReceived ? <ArrowDownLeft className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">{isReceived ? 'Diterima' : 'Dikirim'}</span>
            <span className={`text-sm font-bold ${isReceived ? 'text-green-400' : 'text-red-400'}`}>
              {isReceived ? '+' : '-'}{amt} {token.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-slate-500 text-xs">{dateStr}</span>
            {expanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-slate-700/40 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500 text-xs">{isReceived ? 'Dari' : 'Ke'}</span>
            <span className="text-slate-300 text-xs font-mono break-all text-right max-w-[60%]">{tx.counterparty || '—'}</span>
          </div>
          <a href={`${tx.explorerTx || ''}${tx.hash}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg py-1.5 transition-colors">
            <ExternalLink className="w-3 h-3" /> Lihat di Explorer
          </a>
        </div>
      )}
    </div>
  );
}

function TokenCard({ token, walletAddress, onRemove }) {
  const [balance, setBalance] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTxs, setShowTxs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const [bal, transactions] = await Promise.all([
      fetchTokenBalance(token.chain, token.contract, walletAddress, token.decimals).catch(() => 0),
      fetchTokenTransactions(token.chain, token.contract, walletAddress).catch(() => []),
    ]);
    setBalance(bal);
    setTxs(transactions);
    setLoading(false);
    setRefreshing(false);
  }, [token, walletAddress]);

  useEffect(() => { load(); }, [load]);

  const chainColor = CHAIN_COLORS[token.chain] || '#6366f1';

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden">
      {/* Token Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
          style={{ background: chainColor }}>
          {token.symbol?.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">{token.symbol}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
              style={{ background: chainColor + '88' }}>
              {token.chain}
            </span>
          </div>
          <p className="text-slate-500 text-xs truncate">{token.name}</p>
        </div>
        <div className="text-right">
          {loading ? (
            <div className="h-5 w-20 bg-slate-700 rounded animate-pulse" />
          ) : (
            <p className="text-white font-semibold text-sm">{balance?.toFixed(4)} {token.symbol}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button onClick={() => setShowTxs(s => !s)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors flex-1 justify-center">
          {showTxs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showTxs ? 'Sembunyikan' : 'Riwayat'}
        </button>
        <button onClick={load} disabled={refreshing}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={() => onRemove(token.id)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Transactions */}
      {showTxs && (
        <div className="border-t border-slate-700/30 p-3 space-y-2">
          {txs.length === 0 ? (
            <p className="text-slate-600 text-xs text-center py-4">Belum ada transaksi</p>
          ) : (
            txs.map(tx => <TokenTxItem key={tx.hash} tx={tx} token={token} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomTokenList({ addresses }) {
  const [tokens, setTokens] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { setTokens(loadCustomTokens()); }, []);

  const handleRemove = (id) => {
    const updated = removeCustomToken(id);
    setTokens(updated);
  };

  const handleTokenAdded = (updated) => {
    setTokens(updated);
    setShowAdd(false);
  };

  // Get wallet address for a given chain
  const getAddress = (chain) => {
    const evmChains = ['ETH', 'BNB', 'MATIC', 'ARB', 'OP', 'BASE', 'AVAX', 'FTM'];
    if (evmChains.includes(chain)) return addresses?.ETH?.address || '';
    return '';
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-purple-400" />
          <span className="text-white font-semibold text-sm">Token Kustom</span>
          {tokens.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-full">{tokens.length}</span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}
          className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1">
          <Plus className="w-3 h-3" /> Tambah Token
        </Button>
      </div>

      {/* Token Cards */}
      {tokens.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-700/50 rounded-2xl">
          <Coins className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Belum ada token kustom</p>
          <p className="text-slate-600 text-xs mt-1">Tambahkan token ERC-20, BEP-20, dll.</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-purple-400 text-xs hover:underline">
            + Tambah token pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map(token => (
            <TokenCard
              key={token.id}
              token={token}
              walletAddress={getAddress(token.chain)}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddTokenModal onClose={() => setShowAdd(false)} onTokenAdded={handleTokenAdded} />
      )}
    </div>
  );
}
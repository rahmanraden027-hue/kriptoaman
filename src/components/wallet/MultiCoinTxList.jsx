import React, { useState, useEffect } from 'react';
import { getTransactionsByCoin, formatAmount, COINS } from './multiCoinApi';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, RefreshCw, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const REQUIRED_CONFIRMATIONS = { BTC: 6, ETH: 12, LTC: 6 };

function formatFee(coinId, rawFee) {
  if (!rawFee) return null;
  const decimals = COINS[coinId]?.decimals || 8;
  return (rawFee / Math.pow(10, decimals)).toFixed(decimals === 18 ? 8 : 8);
}

function ConfirmationBar({ confirmations, required }) {
  const pct = Math.min((confirmations / required) * 100, 100);
  const isConfirmed = confirmations >= required;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">Konfirmasi</span>
        <span className={isConfirmed ? 'text-green-400' : 'text-yellow-400'}>
          {Math.min(confirmations, required)}/{required}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isConfirmed ? 'bg-green-400' : 'bg-yellow-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TxItem({ tx, coinId, coin }) {
  const [expanded, setExpanded] = useState(false);
  const isReceived = tx.type === 'received';
  const displayAmt = formatAmount(coinId, Math.abs(tx.amount));
  const required = REQUIRED_CONFIRMATIONS[coinId] || 6;
  const isConfirmed = tx.confirmations >= required;
  const isPending = tx.confirmations === 0;
  const feeDisplay = formatFee(coinId, tx.fee);
  const dateStr = tx.date ? (() => {
    try { return format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: idLocale }); }
    catch { return tx.date; }
  })() : '';

  return (
    <div
      className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-colors ${
        isPending ? 'border-yellow-500/30' : isConfirmed ? 'border-slate-700/30' : 'border-orange-500/20'
      }`}
    >
      {/* Main row */}
      <button
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-700/20 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isReceived ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {isReceived
            ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
            : <ArrowUpRight className="w-4 h-4 text-red-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">{isReceived ? 'Diterima' : 'Dikirim'}</span>
            <span className={`text-sm font-bold ${isReceived ? 'text-green-400' : 'text-red-400'}`}>
              {isReceived ? '+' : '-'}{displayAmt} {coin.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-slate-500 text-xs">{dateStr || 'Tanggal tidak tersedia'}</span>
            <div className="flex items-center gap-1.5">
              {isPending && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse">
                  pending
                </span>
              )}
              {!isPending && !isConfirmed && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                  {tx.confirmations}/{required}
                </span>
              )}
              {isConfirmed && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                  terkonfirmasi
                </span>
              )}
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-700/40 pt-2">
          {/* Counterparty */}
          <div className="flex justify-between items-start gap-2">
            <span className="text-slate-500 text-xs shrink-0">{isReceived ? 'Dari' : 'Ke'}</span>
            <span className="text-slate-300 text-xs font-mono text-right break-all">
              {tx.counterparty || '—'}
            </span>
          </div>

          {/* TX Hash */}
          <div className="flex justify-between items-start gap-2">
            <span className="text-slate-500 text-xs shrink-0">Hash</span>
            <span className="text-slate-400 text-xs font-mono text-right truncate max-w-[180px]">
              {tx.hash}
            </span>
          </div>

          {/* Fee */}
          {feeDisplay && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs">Biaya jaringan</span>
              <span className="text-slate-300 text-xs font-semibold">
                {feeDisplay} {coin.symbol}
                {coinId === 'ETH' && tx.gasUsed && (
                  <span className="text-slate-600 ml-1">({tx.gasUsed.toLocaleString()} gas)</span>
                )}
              </span>
            </div>
          )}

          {/* Confirmation bar (only if not fully confirmed) */}
          {!isPending && !isConfirmed && (
            <ConfirmationBar confirmations={tx.confirmations} required={required} />
          )}

          {/* Explorer links */}
          <div className="flex gap-2 pt-1">
            <a
              href={`${coin.explorerTx}${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg py-1.5 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Lihat Transaksi
            </a>
            {tx.counterparty && (
              <a
                href={`${coin.explorerAddr}${tx.counterparty}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg py-1.5 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Lihat Alamat
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MultiCoinTxList({ coinId, address }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const data = await getTransactionsByCoin(coinId, address).catch(() => []);
    setTxs(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [coinId, address]);

  const coin = COINS[coinId];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">Riwayat Transaksi</h2>
        <button onClick={load} disabled={refreshing} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {txs.map(tx => (
            <TxItem key={tx.hash} tx={tx} coinId={coinId} coin={coin} />
          ))}
        </div>
      )}
    </div>
  );
}
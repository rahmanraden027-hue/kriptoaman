import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { getBalance, formatAmount, COINS } from './multiCoinApi';
import useRealtimePrices from './useRealtimePrices';
import { truncateAddress } from './walletUtils';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Copy, Check, LogOut, BarChart2, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import CoinSelector from './CoinSelector';

const COIN_ICONS = { BTC: '₿', ETH: 'Ξ', LTC: 'Ł', BNB: 'B', SOL: '◎', DOGE: 'Ð', MATIC: 'M' };

export default function MultiCoinDashboard({ addresses, onSend, onReceive, onTrade, onSwap, onLogout, activeCoin, onCoinChange }) {
  const [balances, setBalances] = useState({});
  const prices = useRealtimePrices();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const balanceResults = await Promise.all(
      Object.keys(COINS).map(coin =>
        addresses[coin]
          ? getBalance(coin, addresses[coin].address).catch(() => null).then(b => ({ coin, b }))
          : Promise.resolve({ coin, b: null })
      )
    );
    const bals = {};
    balanceResults.forEach(({ coin, b }) => { bals[coin] = b; });
    setBalances(bals);
    setLoading(false);
    setRefreshing(false);
  }, [addresses]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCopy = () => {
    const addr = addresses[activeCoin]?.address;
    if (addr) { navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const coin = COINS[activeCoin];
  const address = addresses[activeCoin]?.address || '';
  const bal = balances[activeCoin];
  const priceInfo = prices[activeCoin];
  const rawBalance = bal?.balance || 0;
  const displayAmount = formatAmount(activeCoin, rawBalance);
  const usdValue = priceInfo?.price ? (parseFloat(displayAmount) * priceInfo.price) : null;
  const change24h = priceInfo?.change24h;

  return (
    <div className="space-y-4">
      <CoinSelector activeCoin={activeCoin} onChange={onCoinChange} />

      {/* Balance Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${coin.color}cc, ${coin.color}88)` }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-base">
                {COIN_ICONS[activeCoin]}
              </div>
              <span className="text-white/80 text-sm font-medium">{coin.name}</span>
            </div>
            <button onClick={fetchAll} disabled={refreshing} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="h-10 w-48 bg-white/20 rounded-lg animate-pulse" />
          ) : (
            <>
              <div className="text-4xl font-bold mb-1">
                {displayAmount} {coin.symbol}
              </div>
              {usdValue !== null && (
                <div className="text-white/70 text-sm">
                  ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </div>
              )}
              {bal?.unconfirmed > 0 && (
                <div className="text-white/60 text-xs mt-1">
                  + {formatAmount(activeCoin, bal.unconfirmed)} {coin.symbol} pending
                </div>
              )}
            </>
          )}


        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button onClick={onReceive} variant="outline" className="h-14 flex-col gap-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">
          <ArrowDownLeft className="w-5 h-5 text-green-400" />
          <span className="text-xs">Terima</span>
        </Button>
        <Button onClick={onSend} className="h-14 flex-col gap-1 text-white border-0" style={{ background: coin.color }}>
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-xs">Kirim</span>
        </Button>
        <Button onClick={onSwap} variant="outline" className="h-14 flex-col gap-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">
          <ArrowLeftRight className="w-5 h-5 text-purple-400" />
          <span className="text-xs">Swap</span>
        </Button>
        <Button onClick={onTrade} variant="outline" className="h-14 flex-col gap-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <span className="text-xs">Trade</span>
        </Button>
      </div>

      {/* Price Summary */}
      <div className="space-y-2">
        {Object.values(COINS).map(c => {
          const p = prices[c.id];
          if (!p?.price) return null;
          const chg = p.change24h;
          return (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: c.color }}>
                  {COIN_ICONS[c.id]}
                </div>
                <span className="text-slate-300 text-sm">{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {chg !== undefined && (
                  <span className={`text-xs flex items-center gap-0.5 ${chg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {chg >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(chg).toFixed(1)}%
                  </span>
                )}
                <span className="text-white font-semibold text-sm">${p.price.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-400 text-sm transition-colors">
        <LogOut className="w-3.5 h-3.5" />
        Kunci Wallet
      </button>
    </div>
  );
}
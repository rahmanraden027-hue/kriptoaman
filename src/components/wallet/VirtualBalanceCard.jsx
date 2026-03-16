import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Clock, CreditCard } from 'lucide-react';
import IDRTopupModal from './IDRTopupModal';

const COIN_INFO = {
  USDT: { label: 'USDT', color: '#26A17B', icon: '₮' },
  SOL:  { label: 'Solana', color: '#9945FF', icon: '◎' },
  ETH:  { label: 'Ethereum', color: '#627EEA', icon: 'Ξ' },
  BTC:  { label: 'Bitcoin', color: '#F7931A', icon: '₿' },
  IDR:  { label: 'Saldo IDR', color: '#22C55E', icon: 'Rp' },
};

// CoinGecko IDs for price lookup
const COINGECKO_IDS = {
  SOL: 'solana',
  ETH: 'ethereum',
  BTC: 'bitcoin',
  USDT: 'tether',
};

export default function VirtualBalanceCard({ userEmail, onDeposit, onWithdraw }) {
  const [balances, setBalances] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [showTopup, setShowTopup] = useState(false);

  const loadPrices = async () => {
    try {
      const ids = Object.values(COINGECKO_IDS).join(',');
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
      const data = await res.json();
      const p = {};
      Object.entries(COINGECKO_IDS).forEach(([coin, id]) => {
        if (data[id]) p[coin] = data[id].usd;
      });
      setPrices(p);
    } catch (_) {}
  };

  const load = async () => {
    setLoading(true);
    const [bals, reqs] = await Promise.all([
      base44.entities.UserBalance.filter({ userEmail }),
      base44.entities.DepositRequest.filter({ userEmail, status: 'pending' }),
      loadPrices(),
    ]);
    setBalances(bals.filter(b => b.amount > 0));
    setPendingCount(reqs.length);
    setLoading(false);
  };

  useEffect(() => {
    if (userEmail) load();
  }, [userEmail]);

  return (
    <>
    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-blue-500/15">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-400" />
          <span className="text-white font-bold text-sm">Saldo Platform</span>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <Clock className="w-2.5 h-2.5" /> {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-slate-400 hover:text-white transition-colors p-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowTopup(true)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 hover:text-white transition-all">
              <CreditCard className="w-3 h-3" /> Top-up IDR
            </button>
            <button onClick={onDeposit}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 hover:text-white transition-all">
              <ArrowDownToLine className="w-3 h-3" /> Deposit
            </button>
            {onWithdraw && (
              <button onClick={onWithdraw}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:text-white transition-all">
                <ArrowUpFromLine className="w-3 h-3" /> Tarik
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="px-4 py-3">
        {loading ? (
          <p className="text-slate-500 text-xs text-center py-2">Memuat saldo...</p>
        ) : balances.length > 0 ? (
          <div className="space-y-2.5">
            {balances.map(b => {
              const info = COIN_INFO[b.coin] || { label: b.coin, color: '#6B7280', icon: '●' };
              return (
                <div key={b.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: info.color }}>
                      {info.icon}
                    </span>
                    <span className="text-slate-300 text-sm">{info.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">
                      {b.amount.toLocaleString('en-US', {
                        maximumFractionDigits: b.coin === 'USDT' || b.coin === 'IDR' ? 2 : 6,
                      })} {b.coin}
                    </div>
                    {prices[b.coin] && b.coin !== 'IDR' && (
                      <div className="text-slate-500 text-[10px]">
                        ≈ ${(b.amount * prices[b.coin]).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-3 space-y-1">
            <p className="text-slate-500 text-xs">Belum ada saldo platform.</p>
            <button onClick={onDeposit} className="text-blue-400 text-xs hover:text-blue-300 underline underline-offset-2">
              Deposit sekarang →
            </button>
          </div>
        )}
      </div>
    </div>

    {showTopup && (
      <IDRTopupModal onClose={() => { setShowTopup(false); load(); }} />
    )}
    </>
  );
}
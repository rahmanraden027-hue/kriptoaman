import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getAddressInfo, getBtcPrice } from './bitcoinApi';
import { satoshiToBtc, truncateAddress } from './walletUtils';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Copy, Check, LogOut, BarChart2 } from 'lucide-react';

export default function Dashboard({ wallet, onSend, onReceive, onLogout, onTrade }) {
  const [balance, setBalance] = useState(null);
  const [btcPrice, setBtcPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    const [info, price] = await Promise.all([
      getAddressInfo(wallet.address).catch(() => null),
      getBtcPrice(),
    ]);
    if (info) {
      setBalance({
        confirmed: info.balance || 0,
        unconfirmed: info.unconfirmed_balance || 0,
        total: (info.balance || 0) + (info.unconfirmed_balance || 0),
      });
    }
    setBtcPrice(price);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, [wallet.address]);

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalBtc = balance ? parseFloat(satoshiToBtc(balance.total)) : 0;
  const usdValue = btcPrice ? (totalBtc * btcPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-orange-100 text-sm font-medium">Total Balance</span>
            <button onClick={fetchData} disabled={refreshing} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {loading ? (
            <div className="h-10 w-48 bg-white/20 rounded-lg animate-pulse" />
          ) : (
            <>
              <div className="text-4xl font-bold mb-1">
                {totalBtc.toFixed(8)} BTC
              </div>
              {usdValue && (
                <div className="text-orange-100 text-sm">≈ ${usdValue} USD</div>
              )}
              {balance?.unconfirmed > 0 && (
                <div className="text-orange-200 text-xs mt-1">
                  + {satoshiToBtc(balance.unconfirmed)} BTC pending
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2 mt-4 bg-black/20 rounded-xl px-3 py-2 w-fit">
            <span className="text-orange-100 text-sm font-mono">{truncateAddress(wallet.address, 10)}</span>
            <button onClick={handleCopy} className="text-orange-100 hover:text-white transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onReceive} variant="outline" className="h-14 flex-col gap-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">
          <ArrowDownLeft className="w-5 h-5 text-green-400" />
          <span className="text-sm">Terima</span>
        </Button>
        <Button onClick={onSend} className="h-14 flex-col gap-1 bg-orange-500 hover:bg-orange-600 text-white">
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-sm">Kirim</span>
        </Button>
      </div>

      {btcPrice && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">₿</span>
            </div>
            <span className="text-slate-300 text-sm">Bitcoin</span>
          </div>
          <span className="text-white font-semibold">${btcPrice.toLocaleString()}</span>
        </div>
      )}

      <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-400 text-sm transition-colors">
        <LogOut className="w-3.5 h-3.5" />
        Kunci Wallet
      </button>
    </div>
  );
}
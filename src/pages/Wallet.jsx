import React, { useState, useEffect } from 'react';
import { loadWallet } from '../components/wallet/walletUtils';
import CreateWallet from '../components/wallet/CreateWallet';
import UnlockWallet from '../components/wallet/UnlockWallet';
import Dashboard from '../components/wallet/Dashboard';
import ReceiveModal from '../components/wallet/ReceiveModal';
import SendModal from '../components/wallet/SendModal';
import TradeModal from '../components/wallet/TradeModal';
import TransactionList from '../components/wallet/TransactionList';
import NotificationCenter, { useNotifications } from '../components/wallet/NotificationCenter';

export default function Wallet() {
  const [walletData, setWalletData] = useState(null);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [balance, setBalance] = useState(0);

  const { notifications, unread, markAllRead, dismiss, addNotif } = useNotifications(
    walletData?.address
  );

  useEffect(() => {
    const stored = loadWallet();
    setWalletData(stored);
  }, []);

  const isLocked = walletData && !sessionPassword;
  const isCreating = !walletData;

  if (isCreating) {
    return <CreateWallet onWalletCreated={(w) => setWalletData(w)} />;
  }

  if (isLocked) {
    return (
      <UnlockWallet
        wallet={walletData}
        onUnlocked={(pwd) => setSessionPassword(pwd)}
        onReset={() => setWalletData(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md mx-auto p-4 pb-8 space-y-6">
        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">₿</span>
            </div>
            <span className="text-white font-semibold">Bitcoin Wallet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-green-400 text-xs">Mainnet</span>
            </div>
            <NotificationCenter
              notifications={notifications}
              unread={unread}
              onMarkRead={markAllRead}
              onDismiss={dismiss}
            />
          </div>
        </div>

        <Dashboard
          wallet={walletData}
          onSend={() => setShowSend(true)}
          onReceive={() => setShowReceive(true)}
          onTrade={() => setShowTrade(true)}
          onLogout={() => setSessionPassword(null)}
        />

        <TransactionList key={refreshKey} address={walletData.address} />
      </div>

      {showReceive && (
        <ReceiveModal address={walletData.address} onClose={() => setShowReceive(false)} />
      )}

      {showSend && (
        <SendModal
          wallet={walletData}
          sessionPassword={sessionPassword}
          onClose={() => setShowSend(false)}
          onSuccess={() => {
            setShowSend(false);
            addNotif({ type: 'sent', icon: 'out', title: 'Transaksi terkirim', body: 'Bitcoin Anda sedang disiarkan ke jaringan' });
            setTimeout(() => setRefreshKey(k => k + 1), 2000);
          }}
        />
      )}

      {showTrade && (
        <TradeModal
          wallet={walletData}
          balanceSatoshi={balance}
          onClose={() => setShowTrade(false)}
          onTradeComplete={(trade) => {
            setShowTrade(false);
            addNotif({
              type: 'trade',
              icon: 'trade',
              title: `Order ${trade.type === 'buy' ? 'beli' : 'jual'} berhasil`,
              body: `${trade.btc.toFixed(6)} BTC ≈ $${trade.usd.toFixed(2)}`,
            });
          }}
        />
      )}
    </div>
  );
}
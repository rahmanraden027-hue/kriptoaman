import React, { useState, useEffect } from 'react';
import { loadWallet } from '../components/wallet/walletUtils';
import CreateWallet from '../components/wallet/CreateWallet';
import UnlockWallet from '../components/wallet/UnlockWallet';
import Dashboard from '../components/wallet/Dashboard';
import ReceiveModal from '../components/wallet/ReceiveModal';
import SendModal from '../components/wallet/SendModal';
import TransactionList from '../components/wallet/TransactionList';

export default function Wallet() {
  const [walletData, setWalletData] = useState(null);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const stored = loadWallet();
    setWalletData(stored);
  }, []);

  const isLocked = walletData && !sessionPassword;
  const isCreating = !walletData;
  const isUnlocked = walletData && sessionPassword;

  if (isCreating) {
    return (
      <CreateWallet
        onWalletCreated={(w) => {
          setWalletData(w);
        }}
      />
    );
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
          <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span className="text-green-400 text-xs">Mainnet</span>
          </div>
        </div>

        <Dashboard
          wallet={walletData}
          onSend={() => setShowSend(true)}
          onReceive={() => setShowReceive(true)}
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
            setTimeout(() => setRefreshKey(k => k + 1), 2000);
          }}
        />
      )}
    </div>
  );
}
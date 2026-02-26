import React, { useState, useEffect } from 'react';
import { loadWallet, decryptData } from '../components/wallet/walletUtils';
import { deriveAllAddresses } from '../components/wallet/multiCoinWallet';
import CreateWallet from '../components/wallet/CreateWallet';
import UnlockWallet from '../components/wallet/UnlockWallet';
import MultiCoinDashboard from '../components/wallet/MultiCoinDashboard';
import MultiCoinTxList from '../components/wallet/MultiCoinTxList';
import ReceiveModal from '../components/wallet/ReceiveModal';
import SendModal from '../components/wallet/SendModal';
import TradeModal from '../components/wallet/TradeModal';
import NotificationCenter, { useNotifications } from '../components/wallet/NotificationCenter';
import DexSwapModal from '../components/wallet/DexSwapModal';
import DexTradeHistory from '../components/wallet/DexTradeHistory';

export default function Wallet() {
  const [walletData, setWalletData] = useState(null);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [addresses, setAddresses] = useState(null); // { BTC, ETH, LTC }
  const [activeCoin, setActiveCoin] = useState('BTC');
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [showDex, setShowDex] = useState(false);
  const [dexRefreshKey, setDexRefreshKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const btcAddress = addresses?.BTC?.address || walletData?.address;
  const { notifications, unread, markAllRead, dismiss, addNotif } = useNotifications(btcAddress);

  useEffect(() => {
    const stored = loadWallet();
    setWalletData(stored);
  }, []);

  // When unlocked, derive multi-coin addresses if not already stored
  useEffect(() => {
    if (!walletData || !sessionPassword) return;
    if (walletData.addresses) {
      setAddresses(walletData.addresses);
      return;
    }
    // Legacy wallet: derive addresses from mnemonic
    const mnemonic = decryptData(walletData.encryptedMnemonic, sessionPassword);
    if (!mnemonic) return;
    deriveAllAddresses(mnemonic)
      .then(addrs => setAddresses(addrs))
      .catch(() => setAddresses({ BTC: { address: walletData.address, publicKey: walletData.publicKey } }));
  }, [walletData, sessionPassword]);

  const isLocked = walletData && !sessionPassword;
  const isCreating = !walletData;
  const activeAddress = addresses?.[activeCoin]?.address || '';

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
            <span className="text-white font-semibold">Crypto Wallet</span>
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

        <MultiCoinDashboard
          addresses={addresses || { BTC: { address: walletData?.address } }}
          activeCoin={activeCoin}
          onCoinChange={setActiveCoin}
          onSend={() => setShowSend(true)}
          onReceive={() => setShowReceive(true)}
          onTrade={() => setShowTrade(true)}
          onLogout={() => setSessionPassword(null)}
        />

        {/* DEX Swap Button */}
        <button
          onClick={() => setShowDex(true)}
          className="w-full py-3 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 hover:text-violet-200 transition-all text-sm font-medium flex items-center justify-center gap-2"
        >
          <span>🔀</span> DEX Swap — Uniswap · THORChain · 1inch
        </button>

        <DexTradeHistory key={dexRefreshKey} />

        <MultiCoinTxList key={`${activeCoin}-${refreshKey}`} coinId={activeCoin} address={activeAddress} />
      </div>

      {showReceive && activeAddress && (
        <ReceiveModal address={activeAddress} onClose={() => setShowReceive(false)} />
      )}

      {showSend && activeCoin === 'BTC' && (
        <SendModal
          wallet={walletData}
          sessionPassword={sessionPassword}
          onClose={() => setShowSend(false)}
          onSuccess={() => {
            setShowSend(false);
            addNotif({ type: 'sent', icon: 'out', title: 'Transaksi BTC terkirim', body: 'Sedang disiarkan ke jaringan Bitcoin' });
            setTimeout(() => setRefreshKey(k => k + 1), 2000);
          }}
        />
      )}

      {showSend && activeCoin !== 'BTC' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowSend(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center space-y-3" onClick={e => e.stopPropagation()}>
            <div className="text-4xl">🚧</div>
            <h3 className="text-white font-semibold">Segera Hadir</h3>
            <p className="text-slate-400 text-sm">Pengiriman {activeCoin} sedang dalam pengembangan. BTC sudah sepenuhnya didukung.</p>
            <button onClick={() => setShowSend(false)} className="mt-2 text-orange-400 text-sm hover:underline">Tutup</button>
          </div>
        </div>
      )}

      {showDex && (
        <DexSwapModal
          activeCoin={activeCoin}
          onClose={() => setShowDex(false)}
          onSwapComplete={() => setDexRefreshKey(k => k + 1)}
        />
      )}

      {showTrade && (
        <TradeModal
          wallet={walletData}
          balanceSatoshi={0}
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
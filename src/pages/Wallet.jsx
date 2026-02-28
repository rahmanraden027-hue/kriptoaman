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
import SwapModal from '../components/wallet/SwapModal';
import NotificationCenter, { useNotifications } from '../components/wallet/NotificationCenter';
import PortfolioChart from '../components/wallet/PortfolioChart';
import OnboardingGuide from '../components/wallet/OnboardingGuide';
import WalletConnectPanel from '../components/wallet/WalletConnectPanel';
import { HelpCircle, Zap } from 'lucide-react';

const ONBOARDING_KEY = 'dex_onboarding_done';

export default function Wallet() {
  const [walletData, setWalletData] = useState(null);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [activeCoin, setActiveCoin] = useState('BTC');
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const btcAddress = addresses?.BTC?.address || walletData?.address;
  const { notifications, unread, markAllRead, dismiss, addNotif, pushEnabled, enablePush } = useNotifications(btcAddress);

  useEffect(() => {
    const stored = loadWallet();
    setWalletData(stored);
  }, []);

  useEffect(() => {
    if (!walletData || !sessionPassword) return;
    // Show onboarding for new users
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
      localStorage.setItem(ONBOARDING_KEY, '1');
    }
    if (walletData.addresses) {
      setAddresses(walletData.addresses);
      return;
    }
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
      <div className="max-w-md mx-auto p-4 pb-8 space-y-5">

        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base">DEX Wallet</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-[10px] font-medium">Mainnet · Live</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowOnboarding(true)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors" title="Panduan">
              <HelpCircle className="w-4 h-4" />
            </button>
            <NotificationCenter
              notifications={notifications}
              unread={unread}
              onMarkRead={markAllRead}
              onDismiss={dismiss}
              pushEnabled={pushEnabled}
              onEnablePush={enablePush}
            />
          </div>
        </div>

        {/* WalletConnect */}
        <WalletConnectPanel />

        {/* Quick tip banner for new sessions */}
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <span className="text-blue-400 text-xs">💡</span>
          <span className="text-blue-300 text-xs">Tap koin untuk ganti aset aktif · Swap = tukar antar koin · Trade = simulasi order</span>
        </div>

        {/* Multi-Coin Dashboard */}
        <MultiCoinDashboard
          addresses={addresses || { BTC: { address: walletData?.address } }}
          activeCoin={activeCoin}
          onCoinChange={setActiveCoin}
          onSend={() => setShowSend(true)}
          onReceive={() => setShowReceive(true)}
          onTrade={() => setShowTrade(true)}
          onSwap={() => setShowSwap(true)}
          onLogout={() => setSessionPassword(null)}
        />

        {/* Portfolio Chart */}
        <PortfolioChart addresses={addresses || { BTC: { address: walletData?.address } }} />

        {/* Transaction History */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
          <MultiCoinTxList key={`${activeCoin}-${refreshKey}`} coinId={activeCoin} address={activeAddress} />
        </div>

      </div>

      {/* Modals */}
      {showOnboarding && <OnboardingGuide onClose={() => setShowOnboarding(false)} />}

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

      {showSwap && (
        <SwapModal addresses={addresses} onClose={() => setShowSwap(false)} />
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
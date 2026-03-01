import React, { useState, useEffect } from 'react';
import { loadWallet, decryptData } from '../components/wallet/walletUtils';
import { deriveAllAddresses } from '../components/wallet/multiCoinWallet';
import CreateWallet from '../components/wallet/CreateWallet';
import UnlockWallet from '../components/wallet/UnlockWallet';
import MultiCoinDashboard from '../components/wallet/MultiCoinDashboard';
import MultiCoinTxList from '../components/wallet/MultiCoinTxList';
import ReceiveModal from '../components/wallet/ReceiveModal';
import SendModal from '../components/wallet/SendModal';
import UniversalSendModal from '../components/wallet/UniversalSendModal';
import TradeModal from '../components/wallet/TradeModal';
import SwapModal from '../components/wallet/SwapModal';
import NotificationCenter, { useNotifications } from '../components/wallet/NotificationCenter';
import PortfolioChart from '../components/wallet/PortfolioChart';
import OnboardingGuide from '../components/wallet/OnboardingGuide';
import WalletConnectPanel from '../components/wallet/WalletConnectPanel';
import CustomTokenList from '../components/wallet/CustomTokenList';
import StakingPanel from '../components/wallet/StakingPanel';
import PassiveIncomeWidget from '../components/wallet/PassiveIncomeWidget';
import PortfolioAnalytics from '../components/wallet/PortfolioAnalytics';
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/>
                <path d="M9 8.5C9 8.5 9 7 11 7C13 7 14.5 8 14.5 10C14.5 12 12.5 12.5 12 13C11.5 13.5 11.5 14.5 11.5 14.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="11.5" cy="17" r="1" fill="white"/>
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-base tracking-wide">COINVAULT</span>
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

        {/* Portfolio Analytics Dashboard */}
        <PortfolioAnalytics />

        {/* Portfolio Chart */}
        <PortfolioChart addresses={addresses || { BTC: { address: walletData?.address } }} />

        {/* Transaction History */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
          <MultiCoinTxList key={`${activeCoin}-${refreshKey}`} coinId={activeCoin} address={activeAddress} />
        </div>

        {/* Custom ERC-20 / BEP-20 Tokens */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
          <CustomTokenList addresses={addresses} />
        </div>

      </div>

      {/* Modals */}
      {showOnboarding && <OnboardingGuide onClose={() => setShowOnboarding(false)} />}

      {showReceive && activeAddress && (
        <ReceiveModal address={activeAddress} onClose={() => setShowReceive(false)} />
      )}

      {showSend && (
        <UniversalSendModal
          wallet={walletData}
          sessionPassword={sessionPassword}
          activeCoin={activeCoin}
          addresses={addresses}
          onClose={() => setShowSend(false)}
          onSuccess={() => {
            setShowSend(false);
            addNotif({ type: 'sent', icon: 'out', title: `Transaksi ${activeCoin} terkirim`, body: `Sedang disiarkan ke jaringan ${activeCoin}` });
            setTimeout(() => setRefreshKey(k => k + 1), 2000);
          }}
        />
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
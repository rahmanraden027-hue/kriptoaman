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
import CrossChainBridge from '../components/wallet/CrossChainBridge';
import InlineSwapWidget from '../components/wallet/InlineSwapWidget';
import DetailedTxHistory from '../components/wallet/DetailedTxHistory';
import WalletPersonalization, { usePersonalization } from '../components/wallet/WalletPersonalization';
import BankDepositWithdrawModal from '../components/wallet/BankDepositWithdrawModal';
import { HelpCircle, ArrowRight, Settings2, User, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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
  const [showBridge, setShowBridge] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { prefs, toggleSection, toggleCoin, moveSectionUp, moveSectionDown, update, reset } = usePersonalization();

  // Helper: is a section visible?
  const sec = (id) => (prefs.sections.find(s => s.id === id)?.visible !== false);

  // Light theme classes
  const isLight = prefs.theme === 'light';
  const bg = isLight
    ? 'min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100'
    : 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950';
  const cardBg = isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-800/30 border-slate-700/30';
  const textMain = isLight ? 'text-slate-900' : 'text-white';

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
    <div className={bg}>
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
              <span className={`font-bold text-base tracking-wide ${textMain}`}>COINVAULT</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-[10px] font-medium">Mainnet · Live</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPersonalize(true)}
              className={`p-1.5 rounded-lg border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
              title="Personalisasi">
              <Settings2 className="w-4 h-4" />
            </button>
            <button onClick={() => setShowOnboarding(true)}
              className={`p-1.5 rounded-lg border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
              title="Panduan">
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

        {/* User Identity Card */}
        {currentUser && (
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700/40'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {currentUser.full_name
                  ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : <User className="w-4 h-4" />}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${textMain}`}>{currentUser.full_name || 'Pengguna'}</p>
              <p className="text-slate-500 text-[10px] truncate">{currentUser.email}</p>
            </div>
            <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full capitalize shrink-0">{currentUser.role || 'user'}</span>
          </div>
        )}

        {/* WalletConnect */}
        <WalletConnectPanel />

        {/* Bank Deposit/Withdraw Banner */}
        <button onClick={() => setShowBankModal(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl hover:bg-green-500/15 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-green-300 text-sm font-semibold">Deposit & Withdraw IDR</p>
              <p className="text-green-600 text-[10px]">Tautkan rekening bank · Beli & jual kripto</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-green-500" />
        </button>

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

        {/* Sections rendered in user-defined order */}
        {prefs.sections.map(section => {
          if (!section.visible) return null;
          switch (section.id) {
            case 'passive':
              return <PassiveIncomeWidget key="passive" />;
            case 'analytics':
              return <PortfolioAnalytics key="analytics" />;
            case 'chart':
              return <PortfolioChart key="chart" addresses={addresses || { BTC: { address: walletData?.address } }} />;
            case 'swap':
              return (
                <div key="swap" className={`border rounded-2xl p-4 ${cardBg}`}>
                  <InlineSwapWidget />
                </div>
              );
            case 'bridge':
              return (
                <button key="bridge" onClick={() => setShowBridge(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl hover:bg-cyan-500/15 transition-colors">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-300 text-sm font-semibold">Cross-Chain Bridge</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">EVM</span>
                  </div>
                  <span className="text-slate-500 text-xs">ETH ↔ BNB ↔ Polygon…</span>
                </button>
              );
            case 'txhistory':
              return (
                <div key="txhistory" className={`border rounded-2xl p-4 ${cardBg}`}>
                  <DetailedTxHistory coinId={activeCoin} address={activeAddress} key={`${activeCoin}-${refreshKey}`} />
                </div>
              );
            case 'staking':
              return (
                <div key="staking" className={`border rounded-2xl p-4 ${cardBg}`}>
                  <StakingPanel addresses={addresses} />
                </div>
              );
            case 'tokens':
              return (
                <div key="tokens" className={`border rounded-2xl p-4 ${cardBg}`}>
                  <CustomTokenList addresses={addresses} />
                </div>
              );
            default:
              return null;
          }
        })}

      </div>

      {/* Modals */}
      {showPersonalize && (
        <WalletPersonalization
          prefs={prefs}
          onClose={() => setShowPersonalize(false)}
          onToggleSection={toggleSection}
          onToggleCoin={toggleCoin}
          onMoveSectionUp={moveSectionUp}
          onMoveSectionDown={moveSectionDown}
          onSortChange={(mode) => update({ coinSortMode: mode })}
          onThemeChange={(theme) => update({ theme })}
          onReset={reset}
        />
      )}

      {showBankModal && <BankDepositWithdrawModal onClose={() => setShowBankModal(false)} />}

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

      {showBridge && (
        <CrossChainBridge onClose={() => setShowBridge(false)} />
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
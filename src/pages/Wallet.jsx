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
import DepositModal from '../components/wallet/DepositModal';
import VirtualBalanceCard from '../components/wallet/VirtualBalanceCard';
import WithdrawalModal from '../components/wallet/WithdrawalModal';
import AllReceiveAddressesModal from '../components/wallet/AllReceiveAddressesModal';
import SupportChat from '../components/support/SupportChat';
import Web3StatusBar from '../components/web3/Web3StatusBar';
import OnchainSendModal from '../components/web3/OnchainSendModal';
import AdminBalanceDisplay from '../components/wallet/AdminBalanceDisplay';
import AdminBalancePublic from '../components/wallet/AdminBalancePublic';
import AdminBalanceDetail from '../components/wallet/AdminBalanceDetail';
import AdminTransactionHistory from '../components/wallet/AdminTransactionHistory';
import UserWalletManagement from '../components/wallet/UserWalletManagement';
import ComprehensiveTransactionHistory from '../components/wallet/ComprehensiveTransactionHistory';
import { HelpCircle, ArrowRight, Settings2, User, Building2, MessageCircle } from 'lucide-react';
import WalletProfileCard from '../components/wallet/WalletProfileCard';
import MarketOverviewWidget from '../components/market/MarketOverviewWidget';
import AdvancedPriceChart from '../components/charting/AdvancedPriceChart';
import { Analytics } from '../components/analytics/mixpanel';
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
  const [showSupport, setShowSupport] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [showPriceChart, setShowPriceChart] = useState(false);
  const [showOnchainSend, setShowOnchainSend] = useState(false);
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
    // Auto-unlock jika session password tersimpan
    const savedPwd = sessionStorage.getItem('ka_session_pwd');
    if (savedPwd) setSessionPassword(savedPwd);
    // Auto-unlock untuk admin
    base44.auth.me().then(u => {
      if (u?.role === 'admin') {
        setSessionPassword('admin_bypass');
      }
    }).catch(() => {});
  }, []);

    // Track wallet unlock
    const handleWalletUnlocked = (pwd) => {
    setSessionPassword(pwd);
    sessionStorage.setItem('ka_session_pwd', pwd);
    Analytics.walletUnlocked();
    };

    // Track wallet created
    const handleWalletCreated = (w) => {
    setWalletData(w);
    Analytics.walletCreated();
    };

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
    // Admin bypass - skip decrypt, gunakan address langsung
    if (sessionPassword === 'admin_bypass') {
      setAddresses({ BTC: { address: walletData.address, publicKey: walletData.publicKey } });
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
    return <CreateWallet onWalletCreated={handleWalletCreated} />;
  }

  if (isLocked) {
    return (
      <UnlockWallet
        wallet={walletData}
        onUnlocked={handleWalletUnlocked}
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
            {/* KriptoAman Shield Logo */}
            <div className="relative w-10 h-11 flex items-center justify-center animate-ka-glow">
              <style>{`
                @keyframes ka-glow {
                  0%, 100% { filter: drop-shadow(0 0 4px rgba(0,212,255,0.5)); }
                  50% { filter: drop-shadow(0 0 10px rgba(0,212,255,0.8)); }
                }
                .animate-ka-glow { animation: ka-glow 2.8s ease-in-out infinite; }
              `}</style>
              <svg width="24" height="28" viewBox="0 0 48 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="wallet_shield" x1="24" y1="1" x2="24" y2="51">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="60%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                  <linearGradient id="wallet_coin" x1="16" y1="16" x2="32" y2="32">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <path d="M24 1L3 9V25C3 36.5 12.5 46.5 24 50C35.5 46.5 45 36.5 45 25V9L24 1Z" fill="url(#wallet_shield)" />
                <path d="M24 4.5L6 11.5V25C6 34.8 14.2 43.5 24 46.8C33.8 43.5 42 34.8 42 25V11.5L24 4.5Z" fill="#0c2340" />
                <circle cx="24" cy="22" r="7.5" fill="url(#wallet_coin)" />
                <text x="24" y="26.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="#7c2d12">₿</text>
              </svg>
            </div>
            <div>
              <span className={`font-bold text-base tracking-wide ${textMain}`}>KriptoAman</span>
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
            <button onClick={() => setShowSupport(true)}
              className={`p-1.5 rounded-lg border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
              title="Bantuan / Support"
              onClick={() => { setShowSupport(true); Analytics.supportChatOpened(); }}>
              <MessageCircle className="w-4 h-4" />
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
          <WalletProfileCard
            user={currentUser}
            address={activeAddress || btcAddress}
            coin={activeCoin}
            isLight={isLight}
          />
        )}

        {/* Web3 Wallet Status */}
        <Web3StatusBar />

        {/* Onchain Send Button */}
        <button onClick={() => setShowOnchainSend(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl hover:bg-violet-500/15 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="text-left">
              <p className="text-violet-300 text-sm font-semibold">Kirim Onchain (Web3)</p>
              <p className="text-violet-600 text-[10px]">ETH / BNB / MATIC / ARB langsung ke blockchain</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* Virtual Balance */}
        <VirtualBalanceCard
          userEmail={currentUser?.email}
          onDeposit={() => setShowDeposit(true)}
          onWithdraw={() => setShowWithdrawal(true)}
        />

        {/* WalletConnect */}
        <WalletConnectPanel />

        {/* Bank Deposit/Withdraw Banner */}
        <button onClick={() => { setShowBankModal(true); Analytics.bankModalOpened(); }}
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

        {/* All Receive Addresses Button */}
        {addresses && Object.keys(addresses).length > 0 && (
          <button
            onClick={() => setShowAllAddresses(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/15 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-indigo-300 text-sm font-semibold">Terbitkan Alamat Penerima</p>
                <p className="text-indigo-600 text-[10px]">Lihat semua alamat terima untuk setiap koin</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Admin Balance Display - untuk admin */}
         {currentUser?.balances && (
           <>
             <AdminBalanceDisplay balances={currentUser.balances} />
             <AdminTransactionHistory />
           </>
         )}

         {/* Admin Balance Public - untuk semua pengguna */}
         <AdminBalancePublic />

         {/* Admin Balance Detail - pie chart & breakdown */}
         <AdminBalanceDetail />

         {/* User Wallet Management - user's own test assets */}
         <UserWalletManagement />

         {/* Comprehensive Transaction History */}
         <ComprehensiveTransactionHistory />

        {/* Advanced Price Chart */}
        {showPriceChart ? (
          <AdvancedPriceChart
            coinId={activeCoin}
            coinName={activeCoin}
            onClose={() => setShowPriceChart(false)}
          />
        ) : (
          <button
            onClick={() => setShowPriceChart(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl hover:bg-blue-500/15 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              </div>
              <div className="text-left">
                <p className="text-blue-300 text-sm font-semibold">Chart Harga {activeCoin}</p>
                <p className="text-blue-600 text-[10px]">Candlestick & Line · 1H / 24H / 7D / 1M / 1Y</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {/* Market Overview: gainers, new listings, volume */}
        <MarketOverviewWidget />

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

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} userEmail={currentUser?.email} />}
      {showWithdrawal && <WithdrawalModal onClose={() => setShowWithdrawal(false)} userEmail={currentUser?.email} />}

      {showOnchainSend && <OnchainSendModal onClose={() => setShowOnchainSend(false)} />}
      {showBankModal && <BankDepositWithdrawModal onClose={() => setShowBankModal(false)} />}

      {showSupport && <SupportChat user={currentUser} onClose={() => setShowSupport(false)} />}

      {showAllAddresses && addresses && (
        <AllReceiveAddressesModal addresses={addresses} onClose={() => setShowAllAddresses(false)} />
      )}

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
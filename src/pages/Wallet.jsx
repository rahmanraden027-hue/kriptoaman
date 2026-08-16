import React, { useState, useEffect } from 'react';
import { loadWallet, decryptData } from '../components/wallet/walletUtils';
import { deriveAllAddresses } from '../components/wallet/multiCoinWallet';
import CreateWallet from '../components/wallet/CreateWallet';
import UnlockWallet from '../components/wallet/UnlockWallet';
import MultiCoinDashboard from '../components/wallet/MultiCoinDashboard';
import ReceiveModal from '../components/wallet/ReceiveModal';
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
import BappebtiTrustBadge from '../components/home/BappebtiTrustBadge';
import Web3StatusBar from '../components/web3/Web3StatusBar';
import OnchainSendModal from '../components/web3/OnchainSendModal';
import AdminBalanceDisplay from '../components/wallet/AdminBalanceDisplay';
import AdminBalancePublic from '../components/wallet/AdminBalancePublic';
import AdminBalanceDetail from '../components/wallet/AdminBalanceDetail';
import AdminTransactionHistory from '../components/wallet/AdminTransactionHistory';
import UserWalletManagement from '../components/wallet/UserWalletManagement';
import ComprehensiveTransactionHistory from '../components/wallet/ComprehensiveTransactionHistory';
import { HelpCircle, ArrowRight, Settings2, Building2, MessageCircle, Wifi, BarChart3 } from 'lucide-react';
import WalletProfileCard from '../components/wallet/WalletProfileCard';
import MarketOverviewWidget from '../components/market/MarketOverviewWidget';
import AdvancedPriceChart from '../components/charting/AdvancedPriceChart';
import { Analytics } from '../components/analytics/mixpanel';
import { base44 } from '@/api/base44Client';
import KAMTokenCard from '../components/wallet/KAMTokenCard';
import KYCWalletGate from '../components/kyc/KYCWalletGate';
import CEXPanel from '../components/wallet/CEXPanel';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/LanguageContext';

const ONBOARDING_KEY = 'dex_onboarding_done';
const STORE_RELEASE_MODE = true;

function StoreSafeWallet({ user }) {
  const { language } = useLanguage();
  const [connectedAddressCount, setConnectedAddressCount] = useState(0);
  const en = language === 'en';
  return (
    <div
      className="ka-bg min-h-screen text-white"
      style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto max-w-2xl space-y-5 px-4 sm:px-6 pt-5">
        <header className="flex items-center justify-between gap-3">
          <KriptoAmanLogo size={42} showText textSize="text-sm" />
          <span className="shrink-0 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold text-blue-300">{en ? 'WATCH-ONLY MODE' : 'MODE PEMANTAUAN'}</span>
        </header>

        <WalletProfileCard user={user} address="" coin="" />

        <section className="ka-surface overflow-hidden p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10">
              <Wifi className="h-5 w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold">{en ? 'Watch-only portfolio' : 'Portofolio dalam mode pemantauan'}</h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{en ? 'The public version monitors asset information. Sending, swapping, deposits, withdrawals, and CEX connections are not enabled.' : 'Versi publik digunakan untuk memantau informasi aset. Pengiriman, pertukaran, deposit, penarikan, dan koneksi CEX belum diaktifkan.'}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('Market')} className="ka-surface ka-surface-hover flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <span className="text-sm font-semibold">{en ? 'Watch Markets' : 'Pantau Pasar'}</span>
          </Link>
          <Link to={createPageUrl('SecurityHub')} className="ka-surface ka-surface-hover flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
            <Settings2 className="h-6 w-6 text-amber-400" />
            <span className="text-sm font-semibold">{en ? 'Security Center' : 'Pusat Keamanan'}</span>
          </Link>
        </div>

        <WalletConnectPanel onConnectionCountChange={setConnectedAddressCount} />

        <KAMTokenCard userBalance={user?.kamBalance || 0} />

        <section className="grid gap-3 sm:grid-cols-3" aria-label={en ? 'Monitoring status' : 'Status pemantauan'}>
          {[
            [en ? 'Connected addresses' : 'Alamat terhubung', String(connectedAddressCount), connectedAddressCount ? (en ? 'Public wallet connection active' : 'Koneksi dompet publik aktif') : (en ? 'Connect a public wallet when available' : 'Hubungkan dompet publik saat tersedia')],
            [en ? 'Recent activity' : 'Aktivitas terbaru', '—', en ? 'No monitored transactions' : 'Belum ada transaksi yang dipantau'],
            [en ? 'Network status' : 'Status jaringan', en ? 'Online' : 'Daring', en ? 'Market data service is active' : 'Layanan data pasar aktif'],
          ].map(([label, value, description]) => (
            <div key={label} className="ka-surface p-4">
              <p className="text-xs font-semibold text-slate-400">{label}</p>
              <p className="mt-2 text-lg font-extrabold text-white">{value}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
            </div>
          ))}
        </section>

        <p className="px-2 text-center text-xs leading-relaxed text-slate-500">{en ? 'KriptoAman never asks for a seed phrase or private key. Never send assets to an address that has not been published through an official channel.' : 'KriptoAman tidak meminta seed phrase atau private key. Jangan mengirim aset ke alamat yang belum diumumkan melalui kanal resmi.'}</p>
      </div>
    </div>
  );
}

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
  const sec = (id) => (prefs.sections.find(s => s.id === id)?.visible !== false);
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
    const savedPwd = sessionStorage.getItem('ka_session_pwd');
    if (savedPwd) setSessionPassword(savedPwd);
    base44.auth.me().then(u => {
      if (u?.role === 'admin') {
        setSessionPassword('admin_bypass');
      }
    }).catch(() => {});
  }, []);

  const handleWalletUnlocked = (pwd) => {
    setSessionPassword(pwd);
    sessionStorage.setItem('ka_session_pwd', pwd);
    Analytics.walletUnlocked();
  };

  const handleWalletCreated = (w) => {
    setWalletData(w);
    Analytics.walletCreated();
  };

  useEffect(() => {
    if (!walletData || !sessionPassword) return;
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
      localStorage.setItem(ONBOARDING_KEY, '1');
    }
    if (walletData.addresses) {
      setAddresses(walletData.addresses);
      return;
    }
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

  if (STORE_RELEASE_MODE) {
    return <StoreSafeWallet user={currentUser} />;
  }

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
        {/* Legacy full wallet UI remains intentionally unreachable while STORE_RELEASE_MODE is true. */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-11 flex items-center justify-center animate-ka-glow" />
            <div>
              <h1 className={`font-bold ${textMain}`}>KriptoAman Wallet</h1>
              <p className="text-xs text-slate-400">Wallet mode</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

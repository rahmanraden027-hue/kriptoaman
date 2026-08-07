import React, { useState, useEffect } from 'react';
import { loadWallet, decryptData } from '../components/wallet/walletUtils';
import { deriveAllAddresses } from '../components/wallet/multiCoinWallet';
import CreateWallet from '../components/wallet/CreateWallet';
import UnlockWallet from '../components/wallet/UnlockWallet';
import ReceiveModal from '../components/wallet/ReceiveModal';
import UniversalSendModal from '../components/wallet/UniversalSendModal';
import SwapModal from '../components/wallet/SwapModal';
import ChainHistoryModal from '../components/wallet/ChainHistoryModal';
import BackupRecoveryModal from '../components/wallet/BackupRecoveryModal';
import { CHAINS, chainAddress, fetchBalance } from '../components/wallet/multiChainBalance';
import useLivePrices from '../components/market/useLivePrices';
import { base44 } from '@/api/base44Client';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, RefreshCw, History, ShieldAlert, Repeat, Copy, Check } from 'lucide-react';

function ActionBtn({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 py-2 rounded-lg bg-ka-card border border-ka-card-border ka-muted hover:text-ka-emerald hover:border-ka-emerald/30 transition tap-reset">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  );
}

export default function MultiChainWallet() {
  const [walletData, setWalletData] = useState(null);
  const [sessionPassword, setSessionPassword] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [balances, setBalances] = useState({});
  const [loadingBal, setLoadingBal] = useState(true);
  const [active, setActive] = useState(null);
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [copied, setCopied] = useState('');

  const { prices, idrRate } = useLivePrices();

  useEffect(() => {
    const stored = loadWallet();
    setWalletData(stored);
    const savedPwd = sessionStorage.getItem('ka_session_pwd');
    if (savedPwd) setSessionPassword(savedPwd);
    base44.auth.me().then((u) => { if (u?.role === 'admin') setSessionPassword('admin_bypass'); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!walletData || !sessionPassword) return;
    if (walletData.addresses) { setAddresses(walletData.addresses); return; }
    if (sessionPassword === 'admin_bypass') { setAddresses({ BTC: { address: walletData.address } }); return; }
    const mnemonic = decryptData(walletData.encryptedMnemonic, sessionPassword);
    if (!mnemonic) return;
    deriveAllAddresses(mnemonic)
      .then((addrs) => setAddresses(addrs))
      .catch(() => setAddresses({ BTC: { address: walletData.address } }));
  }, [walletData, sessionPassword]);

  const loadBalances = async () => {
    if (!addresses) return;
    setLoadingBal(true);
    const entries = await Promise.all(CHAINS.map(async (c) => {
      const addr = chainAddress(c, addresses);
      return [c.key, await fetchBalance(c, addr)];
    }));
    setBalances(Object.fromEntries(entries));
    setLoadingBal(false);
  };

  useEffect(() => { if (addresses) loadBalances(); }, [addresses]);

  if (!walletData) return <CreateWallet onWalletCreated={(w) => setWalletData(w)} />;
  if (!sessionPassword) {
    return (
      <UnlockWallet
        wallet={walletData}
        onUnlocked={(pwd) => { setSessionPassword(pwd); sessionStorage.setItem('ka_session_pwd', pwd); }}
        onReset={() => setWalletData(null)}
      />
    );
  }

  const priceOf = (c) => prices[c.priceKey]?.price || 0;
  const usdOf = (c) => (balances[c.key] || 0) * priceOf(c);
  const totalUSD = CHAINS.reduce((s, c) => s + usdOf(c), 0);

  const copyAddr = (addr, key) => {
    navigator.clipboard?.writeText(addr);
    setCopied(key);
    setTimeout(() => setCopied(''), 1200);
  };

  const openModal = (which, chain) => {
    setActive(chain.key);
    if (which === 'receive') setShowReceive(true);
    if (which === 'send') setShowSend(true);
    if (which === 'swap') setShowSwap(true);
    if (which === 'history') setShowHistory(true);
    if (which === 'backup') setShowBackup(true);
  };

  const activeChain = active ? CHAINS.find((c) => c.key === active) : null;
  const activeAddr = activeChain ? chainAddress(activeChain, addresses) : '';
  const activeSendCoin = activeChain?.priceKey || 'BTC';

  return (
    <div className="ka-bg min-h-screen text-white pb-28">
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-ka-emerald/15 border border-ka-emerald/30 flex items-center justify-center">
              <WalletIcon className="w-5 h-5 text-ka-emerald" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">Multi-Chain Wallet</h1>
              <p className="ka-muted text-[10px]">8 jaringan · self-custody</p>
            </div>
          </div>
          <button onClick={loadBalances} className="ka-muted hover:text-ka-emerald tap-reset" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loadingBal ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Total */}
        <div className="ka-surface ka-emerald-glow p-5 ka-fade-up">
          <p className="ka-muted text-[11px] font-semibold uppercase tracking-wider">Total Nilai Wallet</p>
          <h2 className="text-3xl font-extrabold ka-num mt-1">${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</h2>
          <p className="ka-muted text-[11px] mt-0.5 ka-num">≈ Rp {(totalUSD * (idrRate || 0)).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => openModal('receive', CHAINS[0])}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ka-emerald/15 border border-ka-emerald/30 text-ka-emerald text-xs font-bold tap-reset">
              <ArrowDownLeft className="w-3.5 h-3.5" /> Receive
            </button>
            <button onClick={() => openModal('send', CHAINS[0])}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ka-card border border-ka-card-border text-white text-xs font-bold tap-reset">
              <ArrowUpRight className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </div>

        {/* Chain grid */}
        <div className="space-y-2.5">
          {CHAINS.map((c, idx) => {
            const addr = chainAddress(c, addresses);
            const bal = balances[c.key] ?? 0;
            const usd = bal * priceOf(c);
            return (
              <div key={c.key} className="ka-surface p-3.5 ka-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[10px] text-black shrink-0" style={{ background: c.color }}>
                    {c.symbol.slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-bold">{c.name}</p>
                      <p className="text-white text-sm font-bold ka-num">${usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={() => copyAddr(addr, c.key)} className="ka-muted text-[10px] font-mono truncate max-w-[150px] hover:text-ka-emerald transition flex items-center gap-1 tap-reset">
                        {addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : '—'}
                        {copied === c.key ? <Check className="w-3 h-3 text-ka-emerald" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <p className="ka-muted text-[10px] ka-num">{bal.toFixed(6)} {c.symbol}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-3">
                  <ActionBtn icon={ArrowDownLeft} label="Receive" onClick={() => openModal('receive', c)} />
                  <ActionBtn icon={ArrowUpRight} label="Send" onClick={() => openModal('send', c)} />
                  <ActionBtn icon={Repeat} label="Swap" onClick={() => openModal('swap', c)} />
                  <ActionBtn icon={History} label="History" onClick={() => openModal('history', c)} />
                  <ActionBtn icon={ShieldAlert} label="Backup" onClick={() => openModal('backup', c)} />
                </div>
              </div>
            );
          })}
        </div>

        <p className="ka-muted text-[10px] text-center leading-relaxed pt-1">
          Saldo diambil langsung dari node publik. KriptoAman tidak menyimpan private key Anda.
        </p>
      </div>

      {/* Modals */}
      {showReceive && activeAddr && <ReceiveModal address={activeAddr} onClose={() => setShowReceive(false)} />}
      {showSend && (
        <UniversalSendModal
          wallet={walletData}
          sessionPassword={sessionPassword}
          activeCoin={activeSendCoin}
          addresses={addresses}
          onClose={() => setShowSend(false)}
          onSuccess={() => setShowSend(false)}
        />
      )}
      {showSwap && <SwapModal addresses={addresses} onClose={() => setShowSwap(false)} />}
      {showHistory && activeChain && <ChainHistoryModal chain={activeChain} address={activeAddr} onClose={() => setShowHistory(false)} />}
      {showBackup && <BackupRecoveryModal wallet={walletData} sessionPassword={sessionPassword} onClose={() => setShowBackup(false)} />}
    </div>
  );
}
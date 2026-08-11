import React, { useState } from 'react';
import { useWeb3, SUPPORTED_CHAINS } from './Web3Provider';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MOBILE_WALLETS = [
  { name: 'MetaMask', url: 'https://metamask.app.link/dapp/kriptoaman.com/Web3Wallet' },
  { name: 'Trust Wallet', url: 'https://link.trustwallet.com/open_url?coin_id=60&url=https%3A%2F%2Fkriptoaman.com%2FWeb3Wallet' },
  { name: 'Coinbase Wallet', url: 'https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Fkriptoaman.com%2FWeb3Wallet' },
  { name: 'Phantom', url: 'https://phantom.app/ul/browse/https%3A%2F%2Fkriptoaman.com%2FWeb3Wallet' },
];

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function WalletConnectButton({ compact = false }) {
  const { account, chainId, balance, connecting, isConnected, currentChain,
          connectWallet, disconnectWallet, switchChain, refreshBalance, availableWallets } = useWeb3();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isConnected) {
    return (
      <div className="relative">
        <Button
          onClick={() => availableWallets.length === 1 ? connectWallet(availableWallets[0]) : setOpen(!open)}
          disabled={connecting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 h-auto flex items-center gap-1.5"
        >
          <Wallet className="w-3.5 h-3.5" />
          {connecting ? 'Menghubungkan...' : 'Hubungkan Wallet'}
        </Button>

        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
            <p className="text-sm font-bold text-white">Pilih dompet</p>
            <p className="mt-1 text-xs text-slate-400">KriptoAman tidak pernah meminta seed phrase atau private key.</p>
            <div className="mt-3 space-y-2">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.info.uuid}
                  onClick={() => { connectWallet(wallet); setOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3 text-left text-sm text-white hover:border-indigo-500"
                >
                  {wallet.info.icon ? <img src={wallet.info.icon} alt="" className="h-7 w-7 rounded-lg" /> : <Wallet className="h-6 w-6 text-indigo-400" />}
                  {wallet.info.name}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-500">Buka di aplikasi dompet</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MOBILE_WALLETS.map((wallet) => (
                <a key={wallet.name} href={wallet.url} className="rounded-xl border border-slate-700 bg-slate-800 px-2 py-2 text-center text-xs text-slate-200 hover:border-indigo-500">
                  {wallet.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 hover:bg-slate-700 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white text-xs font-mono">{shortAddr(account)}</span>
        {currentChain && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: currentChain.color + '22', color: currentChain.color }}>
            {currentChain.name}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4">
          {/* Balance */}
          <div className="bg-slate-800 rounded-xl p-3 mb-3">
            <div className="text-slate-400 text-xs mb-1">Saldo Onchain</div>
            <div className="text-white font-bold text-lg">
              {parseFloat(balance).toFixed(6)} {currentChain?.symbol || 'ETH'}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-slate-400 text-xs font-mono">{shortAddr(account)}</span>
              <button onClick={copy} className="text-slate-400 hover:text-white">
                {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <a href={`${currentChain?.explorer}/address/${account}`} target="_blank" rel="noreferrer"
                className="text-slate-400 hover:text-white">
                <ExternalLink className="w-3 h-3" />
              </a>
              <button onClick={() => { refreshBalance(); }} className="text-slate-400 hover:text-white ml-auto">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Switch chain */}
          <div className="mb-3">
            <div className="text-slate-400 text-xs mb-2">Ganti Network</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => (
                <button
                  key={id}
                  onClick={() => switchChain(Number(id))}
                  className={`text-xs px-2 py-1.5 rounded-lg border transition-all ${
                    chainId === Number(id)
                      ? 'border-indigo-500 bg-indigo-500/20 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {chain.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { disconnectWallet(); setOpen(false); }}
            className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 text-sm py-2 border border-red-900/40 rounded-xl hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Putuskan Wallet
          </button>
        </div>
      )}
    </div>
  );
}
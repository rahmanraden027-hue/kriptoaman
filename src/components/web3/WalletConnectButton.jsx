import React, { useState } from 'react';
import { useWeb3, SUPPORTED_CHAINS } from './Web3Provider';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function WalletConnectButton({ compact = false }) {
  const { account, chainId, balance, connecting, isConnected, currentChain,
          connectWallet, disconnectWallet, switchChain, refreshBalance } = useWeb3();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={connecting}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 h-auto flex items-center gap-1.5"
      >
        <Wallet className="w-3.5 h-3.5" />
        {connecting ? 'Menghubungkan...' : 'Hubungkan Wallet'}
      </Button>
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
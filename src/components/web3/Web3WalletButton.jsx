import React, { useState } from 'react';
import { useWeb3, SUPPORTED_CHAINS } from './Web3Provider';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, RefreshCw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function Web3WalletButton() {
  const { account, chainId, balance, connecting, connectWallet, disconnectWallet, switchChain, currentChain, refreshBalance, isConnected } = useWeb3();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={connecting}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
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
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white hover:bg-slate-700 transition-all"
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="font-mono">{shortAddr(account)}</span>
        {currentChain && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: currentChain.color + '33', color: currentChain.color }}>
            {currentChain.name}
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3">
          {/* Balance */}
          <div className="bg-slate-800 rounded-xl p-3">
            <p className="text-slate-400 text-[10px] uppercase mb-1">Saldo Onchain</p>
            <p className="text-white font-bold text-lg">{parseFloat(balance).toFixed(6)} <span className="text-slate-400 text-sm">{currentChain?.symbol || 'ETH'}</span></p>
            <button onClick={() => { refreshBalance(); }} className="text-blue-400 text-[10px] flex items-center gap-1 mt-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2">
            <p className="text-slate-400 text-[11px] font-mono flex-1 truncate">{account}</p>
            <button onClick={copyAddress} className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <a href={`${currentChain?.explorer}/address/${account}`} target="_blank" rel="noreferrer"
              className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          {copied && <p className="text-green-400 text-[10px]">Alamat disalin!</p>}

          {/* Switch Chain */}
          <div>
            <p className="text-slate-400 text-[10px] uppercase mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> Ganti Jaringan</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => (
                <button
                  key={id}
                  onClick={() => switchChain(Number(id))}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${chainId === Number(id) ? 'border-blue-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                  style={chainId === Number(id) ? { background: chain.color + '22', color: chain.color } : {}}
                >
                  {chain.name}
                </button>
              ))}
            </div>
          </div>

          {/* Disconnect */}
          <button onClick={() => { disconnectWallet(); setOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-2 bg-red-900/40 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-900/60 transition-all">
            <LogOut className="w-3.5 h-3.5" /> Putuskan Wallet
          </button>
        </div>
      )}
    </div>
  );
}
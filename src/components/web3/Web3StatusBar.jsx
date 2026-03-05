import React from 'react';
import { useWeb3 } from './Web3Provider';
import Web3WalletButton from './Web3WalletButton';
import { Shield, Wifi, WifiOff } from 'lucide-react';

export default function Web3StatusBar() {
  const { isConnected, account, chainId, currentChain } = useWeb3();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
        {isConnected ? (
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-xs font-semibold">Web3 Terhubung</span>
            {currentChain && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: currentChain.color + '22', color: currentChain.color }}>
                {currentChain.name}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 text-xs">Wallet tidak terhubung</span>
          </div>
        )}
      </div>
      <Web3WalletButton />
    </div>
  );
}
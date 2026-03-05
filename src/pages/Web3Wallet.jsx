import React, { useState } from 'react';
import { useWeb3 } from '../components/web3/Web3Provider';
import WalletConnectButton from '../components/web3/WalletConnectButton';
import OnchainBalanceCard from '../components/web3/OnchainBalanceCard';
import Web3SendModal from '../components/web3/Web3SendModal';
import Web3DEXSwap from '../components/web3/Web3DEXSwap';
import Web3NFTGallery from '../components/web3/Web3NFTGallery';
import Web3TxHistory from '../components/web3/Web3TxHistory';
import { Wallet, Send, Zap, Grid3X3, Clock, Shield, Copy, CheckCircle } from 'lucide-react';

const TABS = [
  { id: 'balance', label: 'Saldo', icon: Wallet },
  { id: 'send', label: 'Kirim', icon: Send },
  { id: 'swap', label: 'DEX Swap', icon: Zap },
  { id: 'nft', label: 'NFT', icon: Grid3X3 },
  { id: 'history', label: 'Riwayat', icon: Clock },
];

export default function Web3WalletPage() {
  const { account, isConnected, connecting, connectWallet, chainId, currentChain, balance } = useWeb3();
  const [activeTab, setActiveTab] = useState('balance');
  const [showSend, setShowSend] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 pt-4 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-bold text-xl">Web3 Wallet</h1>
            <p className="text-slate-400 text-xs">Blockchain · DeFi · NFT</p>
          </div>
          <WalletConnectButton />
        </div>

        {!isConnected ? (
          /* Connect Screen */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-white font-bold text-2xl mb-3">Hubungkan Wallet Web3</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
              Hubungkan MetaMask atau wallet browser lainnya untuk akses DeFi, NFT, dan transaksi onchain langsung.
            </p>
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors text-sm"
            >
              {connecting ? 'Menghubungkan...' : '🦊 Hubungkan MetaMask'}
            </button>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { icon: '🔐', label: 'Non-Custodial', sub: 'Kunci privat tetap di wallet kamu' },
                { icon: '⚡', label: 'DeFi Native', sub: 'Swap langsung di DEX' },
                { icon: '🎨', label: 'NFT Support', sub: 'Lihat koleksi NFT kamu' },
              ].map(f => (
                <div key={f.label} className="bg-slate-800/50 rounded-2xl p-3">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="text-white text-xs font-bold">{f.label}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Account Card */}
            <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs font-semibold">Terhubung</span>
                  {currentChain && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: currentChain.color + '33', color: currentChain.color }}>
                      {currentChain.name}
                    </span>
                  )}
                </div>
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-white font-bold text-2xl mb-1">
                {parseFloat(balance).toFixed(6)} <span className="text-slate-300 text-base">{currentChain?.symbol || 'ETH'}</span>
              </div>
              <button onClick={copy} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-mono transition-colors">
                {account?.slice(0, 12)}...{account?.slice(-6)}
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Kirim', icon: Send, action: () => setShowSend(true), color: 'text-blue-400' },
                { label: 'Swap', icon: Zap, action: () => setActiveTab('swap'), color: 'text-yellow-400' },
                { label: 'NFT', icon: Grid3X3, action: () => setActiveTab('nft'), color: 'text-purple-400' },
                { label: 'Riwayat', icon: Clock, action: () => setActiveTab('history'), color: 'text-green-400' },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action}
                  className="bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 flex flex-col items-center gap-1 hover:bg-slate-700/60 transition-colors">
                  <btn.icon className={`w-5 h-5 ${btn.color}`} />
                  <span className="text-slate-300 text-[10px]">{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 mb-4 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'balance' && <OnchainBalanceCard />}
            {activeTab === 'send' && (
              <div className="text-center py-8">
                <Send className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-4">Kirim token langsung ke blockchain</p>
                <button onClick={() => setShowSend(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                  Buka Form Kirim
                </button>
              </div>
            )}
            {activeTab === 'swap' && <Web3DEXSwap />}
            {activeTab === 'nft' && <Web3NFTGallery />}
            {activeTab === 'history' && <Web3TxHistory />}
          </>
        )}
      </div>

      {showSend && <Web3SendModal onClose={() => setShowSend(false)} />}
    </div>
  );
}
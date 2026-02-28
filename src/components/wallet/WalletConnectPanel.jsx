import React, { useState, useEffect } from 'react';
import { Wallet, Unplug, Copy, Check, ChevronDown, ExternalLink, RefreshCw, X, Zap } from 'lucide-react';
import WalletTxHistory from './WalletTxHistory';

// Supported wallets list (visual only — simulates WalletConnect modal)
const WALLETS = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', color: '#F6851B' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', color: '#8B5CF6' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🟦', color: '#0052FF' },
  { id: 'trust', name: 'Trust Wallet', icon: '🛡️', color: '#3375BB' },
  { id: 'ledger', name: 'Ledger Live', icon: '🔒', color: '#000000' },
  { id: 'argent', name: 'Argent', icon: '🐍', color: '#FF875B' },
];

const STORAGE_KEY = 'wc_connected_wallet';

function generateAddress() {
  const hex = () => Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
  return `0x${hex()}${hex()}${hex()}${hex()}${hex()}`.slice(0, 42);
}

function shortenAddr(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function loadConnected() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function saveConnected(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function clearConnected() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── WalletConnect Picker Modal ────────────────────────────────────────────────
function WalletPickerModal({ onConnect, onClose }) {
  const [connecting, setConnecting] = useState(null);

  const handleSelect = async (wallet) => {
    setConnecting(wallet.id);
    await new Promise(r => setTimeout(r, 1400));
    const addr = generateAddress();
    const ethBal = (0.05 + Math.random() * 4.5).toFixed(4);
    const usdtBal = (50 + Math.random() * 4950).toFixed(2);
    const usdcBal = (10 + Math.random() * 1500).toFixed(2);
    onConnect({ wallet, address: addr, balances: { ETH: ethBal, USDT: usdtBal, USDC: usdcBal }, chain: 'Ethereum', chainId: 1 });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Hubungkan Wallet</div>
              <div className="text-slate-500 text-xs">Pilih penyedia wallet Anda</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wallet list */}
        <div className="p-4 grid grid-cols-2 gap-2.5 pb-8">
          {WALLETS.map(w => (
            <button key={w.id} onClick={() => handleSelect(w)} disabled={!!connecting}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50
                         hover:bg-slate-700/80 hover:border-slate-600 transition-all text-left disabled:opacity-50">
              {connecting === w.id ? (
                <RefreshCw className="w-7 h-7 animate-spin text-blue-400 shrink-0" />
              ) : (
                <span className="text-2xl shrink-0">{w.icon}</span>
              )}
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold truncate">{w.name}</div>
                {connecting === w.id && <div className="text-blue-400 text-xs">Menghubungkan...</div>}
              </div>
            </button>
          ))}
        </div>

        <div className="px-5 pb-5 text-center">
          <p className="text-slate-600 text-xs">Dengan menghubungkan wallet, Anda menyetujui Syarat Layanan kami</p>
        </div>
      </div>
    </div>
  );
}

// ── Connected Wallet Badge (compact) ─────────────────────────────────────────
export function WalletConnectBadge({ onOpen }) {
  const conn = loadConnected();
  if (!conn) return null;
  return (
    <button onClick={onOpen}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all">
      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      {shortenAddr(conn.address)}
      <ChevronDown className="w-3 h-3 opacity-60" />
    </button>
  );
}

// ── Main WalletConnect Panel ──────────────────────────────────────────────────
export default function WalletConnectPanel({ onConnectionChange }) {
  const [connected, setConnected] = useState(loadConnected);
  const [showPicker, setShowPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleConnect = (data) => {
    saveConnected(data);
    setConnected(data);
    setShowPicker(false);
    onConnectionChange?.(data);
  };

  const handleDisconnect = () => {
    clearConnected();
    setConnected(null);
    setShowDetails(false);
    onConnectionChange?.(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(connected.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    const updated = {
      ...connected,
      balances: {
        ETH: (parseFloat(connected.balances.ETH) * (1 + (Math.random() - 0.5) * 0.01)).toFixed(4),
        USDT: (parseFloat(connected.balances.USDT) * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
        USDC: (parseFloat(connected.balances.USDC) * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
      }
    };
    saveConnected(updated);
    setConnected(updated);
    setRefreshing(false);
  };

  // Not connected
  if (!connected) {
    return (
      <>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">WalletConnect</div>
              <div className="text-slate-500 text-xs">Hubungkan wallet eksternal Anda</div>
            </div>
          </div>
          <button onClick={() => setShowPicker(true)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
            <Wallet className="w-4 h-4" /> Hubungkan Wallet
          </button>
        </div>

        {showPicker && <WalletPickerModal onConnect={handleConnect} onClose={() => setShowPicker(false)} />}
      </>
    );
  }

  // Connected
  return (
    <>
      <div className="bg-slate-800/50 border border-green-500/20 rounded-2xl overflow-hidden">
        {/* Header bar */}
        <button onClick={() => setShowDetails(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{connected.wallet.icon}</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white text-sm font-semibold">{connected.wallet.name}</span>
              </div>
              <div className="text-slate-400 text-xs font-mono">{shortenAddr(connected.address)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-white text-xs font-bold">{connected.balances.ETH} ETH</div>
              <div className="text-slate-400 text-[10px]">{connected.chain}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expanded detail */}
        {showDetails && (
          <div className="border-t border-slate-700/40 px-4 py-3 space-y-3">
            {/* Address row */}
            <div className="flex items-center justify-between bg-slate-900/60 rounded-xl px-3 py-2">
              <span className="text-slate-400 text-xs font-mono">{connected.address}</span>
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a href={`https://etherscan.io/address/${connected.address}`} target="_blank" rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Token balances */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Token</span>
                <button onClick={handleRefresh} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
              {[
                { symbol: 'ETH', balance: connected.balances.ETH, color: '#627EEA', icon: 'Ξ', usd: (parseFloat(connected.balances.ETH) * 3420).toFixed(2) },
                { symbol: 'USDT', balance: connected.balances.USDT, color: '#26A17B', icon: '₮', usd: connected.balances.USDT },
                { symbol: 'USDC', balance: connected.balances.USDC, color: '#2775CA', icon: '$', usd: connected.balances.USDC },
              ].map(t => (
                <div key={t.symbol} className="flex items-center gap-2.5 bg-slate-900/40 rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: t.color }}>
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-bold">{t.balance} <span className="text-slate-400 text-xs font-normal">{t.symbol}</span></div>
                  </div>
                  <div className="text-slate-400 text-xs">≈ ${parseFloat(t.usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                </div>
              ))}
            </div>

            {/* Chain + disconnect */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/50 border border-slate-600/40">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-slate-300 text-xs">{connected.chain} · Chain {connected.chainId}</span>
              </div>
              <button onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-medium transition-all">
                <Unplug className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {showPicker && <WalletPickerModal onConnect={handleConnect} onClose={() => setShowPicker(false)} />}
    </>
  );
}
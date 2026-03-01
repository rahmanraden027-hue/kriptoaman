import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet, Unplug, Copy, Check, ChevronDown, ExternalLink,
  RefreshCw, X, Zap, QrCode, Smartphone, Shield, ArrowLeftRight,
  Globe, ChevronRight, AlertCircle, CheckCircle2
} from 'lucide-react';

const WALLETS = [
  { id: 'metamask',  name: 'MetaMask',        icon: '🦊', color: '#F6851B', deeplink: 'metamask://wc' },
  { id: 'trust',     name: 'Trust Wallet',    icon: '🛡️', color: '#3375BB', deeplink: 'trust://wc' },
  { id: 'rainbow',   name: 'Rainbow',         icon: '🌈', color: '#8B5CF6', deeplink: 'rainbow://wc' },
  { id: 'coinbase',  name: 'Coinbase Wallet', icon: '🟦', color: '#0052FF', deeplink: 'cbwallet://wc' },
  { id: 'ledger',    name: 'Ledger Live',     icon: '🔒', color: '#000000', deeplink: 'ledgerlive://wc' },
  { id: 'safe',      name: 'Safe Wallet',     icon: '🟢', color: '#12FF80', deeplink: 'safe://wc' },
];

const CHAINS = [
  { id: 1,     name: 'Ethereum',       symbol: 'ETH',   color: '#627EEA', explorer: 'https://etherscan.io' },
  { id: 56,    name: 'BNB Chain',      symbol: 'BNB',   color: '#F0B90B', explorer: 'https://bscscan.com' },
  { id: 137,   name: 'Polygon',        symbol: 'MATIC', color: '#8247E5', explorer: 'https://polygonscan.com' },
  { id: 42161, name: 'Arbitrum',       symbol: 'ETH',   color: '#12AAFF', explorer: 'https://arbiscan.io' },
  { id: 10,    name: 'Optimism',       symbol: 'ETH',   color: '#FF0420', explorer: 'https://optimistic.etherscan.io' },
  { id: 8453,  name: 'Base',           symbol: 'ETH',   color: '#0052FF', explorer: 'https://basescan.org' },
];

const STORAGE_KEY = 'wc_connected_v2';

function generateAddress() {
  return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}
function shortenAddr(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}
function generateWCUri() {
  const topic = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const sym = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `wc:${topic}@2?relay-protocol=irn&symKey=${sym}`;
}

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } }
function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function clear() { localStorage.removeItem(STORAGE_KEY); }

// ── Simple QR SVG renderer ────────────────────────────────────────────────────
function QRPlaceholder({ uri }) {
  // Visual QR-like grid (decorative, represents real WC URI)
  const seed = uri.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const size = 21;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const x = i % size, y = Math.floor(i / size);
    // Finder patterns (corners)
    const inFinder = (
      (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)
    );
    if (inFinder) {
      const borderX = x < 7 ? x : x - (size - 7);
      const borderY = y < 7 ? y : y - (size - 7);
      return (borderX === 0 || borderX === 6 || borderY === 0 || borderY === 6 ||
        (borderX >= 2 && borderX <= 4 && borderY >= 2 && borderY <= 4));
    }
    return ((seed * (i + 1) * 2654435761) >>> 0) % 3 !== 0;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white p-3 rounded-2xl shadow-lg shadow-black/30">
        <svg width={168} height={168} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
          {cells.map((filled, i) => filled && (
            <rect key={i} x={i % size} y={Math.floor(i / size)} width={1} height={1} fill="#000" />
          ))}
        </svg>
      </div>
      <div className="text-center space-y-1">
        <p className="text-white text-xs font-semibold">Scan dengan wallet mobile Anda</p>
        <p className="text-slate-500 text-[10px] font-mono break-all max-w-[220px]">{uri.slice(0, 40)}…</p>
      </div>
    </div>
  );
}

// ── Wallet Picker Modal ───────────────────────────────────────────────────────
function WalletPickerModal({ onConnect, onClose }) {
  const [tab, setTab] = useState('wallets'); // wallets | qr
  const [connecting, setConnecting] = useState(null);
  const [wcUri] = useState(generateWCUri);
  const [copied, setCopied] = useState(false);

  const handleSelect = async (wallet) => {
    setConnecting(wallet.id);
    await new Promise(r => setTimeout(r, 1600));
    const chain = CHAINS[0];
    const addr = generateAddress();
    onConnect({
      wallet,
      address: addr,
      chain: chain.name,
      chainId: chain.id,
      chainColor: chain.color,
      explorer: chain.explorer,
      balances: {
        ETH:  (0.05 + Math.random() * 4).toFixed(4),
        USDT: (50 + Math.random() * 2000).toFixed(2),
        USDC: (10 + Math.random() * 1000).toFixed(2),
      },
      connectedAt: new Date().toISOString(),
      permissions: ['eth_accounts', 'eth_sign', 'personal_sign', 'eth_sendTransaction'],
    });
  };

  const copyUri = () => {
    navigator.clipboard.writeText(wcUri).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700/70 rounded-t-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">WalletConnect v2</div>
              <div className="text-slate-500 text-xs">Hubungkan wallet mobile ke DApp</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 bg-slate-900/50">
          {[['wallets', Smartphone, 'Pilih Wallet'], ['qr', QrCode, 'QR Code']].map(([t, Icon, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {tab === 'wallets' && (
          <div className="p-4 space-y-2 pb-6">
            {/* Security note */}
            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3">
              <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-xs">CoinVault tidak pernah menyimpan private key Anda. Koneksi bersifat non-custodial dan terenkripsi end-to-end.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {WALLETS.map(w => (
                <button key={w.id} onClick={() => handleSelect(w)} disabled={!!connecting}
                  className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/50
                             hover:bg-slate-700/80 hover:border-slate-600 transition-all text-left disabled:opacity-50">
                  {connecting === w.id ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-blue-400 shrink-0" />
                  ) : (
                    <span className="text-2xl shrink-0">{w.icon}</span>
                  )}
                  <div className="min-w-0">
                    <div className="text-white text-xs font-semibold truncate">{w.name}</div>
                    {connecting === w.id
                      ? <div className="text-blue-400 text-[10px]">Menghubungkan…</div>
                      : <div className="text-slate-500 text-[10px]">WalletConnect</div>
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'qr' && (
          <div className="p-5 flex flex-col items-center gap-4 pb-8">
            <QRPlaceholder uri={wcUri} />
            <button onClick={copyUri}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors">
              {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> URI Tersalin</> : <><Copy className="w-3.5 h-3.5" /> Salin WC URI</>}
            </button>
            <p className="text-slate-600 text-[10px] text-center max-w-[240px]">
              Buka wallet mobile Anda → Scan QR atau paste URI di menu WalletConnect
            </p>
          </div>
        )}

        <div className="px-5 pb-4 text-center border-t border-slate-800 pt-3">
          <p className="text-slate-600 text-[10px]">Dengan menghubungkan, Anda menyetujui Syarat Layanan kami · WalletConnect v2.0</p>
        </div>
      </div>
    </div>
  );
}

// ── Chain Switch Modal ────────────────────────────────────────────────────────
function ChainSwitchModal({ currentChainId, onSwitch, onClose }) {
  const [switching, setSwitching] = useState(null);
  const handleSwitch = async (chain) => {
    setSwitching(chain.id);
    await new Promise(r => setTimeout(r, 900));
    onSwitch(chain);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xs p-4 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Ganti Jaringan</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {CHAINS.map(chain => (
          <button key={chain.id} onClick={() => handleSwitch(chain)} disabled={!!switching}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${chain.id === currentChainId ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800'}`}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: chain.color + '33' }}>
              {switching === chain.id
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: chain.color }} />
                : <Globe className="w-3.5 h-3.5" style={{ color: chain.color }} />
              }
            </div>
            <div className="flex-1 text-left">
              <div className="text-white text-sm font-semibold">{chain.name}</div>
              <div className="text-slate-500 text-[10px]">Chain ID: {chain.id}</div>
            </div>
            {chain.id === currentChainId && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main WalletConnect Panel ──────────────────────────────────────────────────
export default function WalletConnectPanel({ onConnectionChange }) {
  const [connected, setConnected] = useState(load);
  const [showPicker, setShowPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showChainSwitch, setShowChainSwitch] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleConnect = (data) => {
    save(data);
    setConnected(data);
    setShowPicker(false);
    setShowDetails(true);
    onConnectionChange?.(data);
  };

  const handleDisconnect = () => {
    clear();
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
        ETH:  (parseFloat(connected.balances.ETH)  * (1 + (Math.random() - 0.5) * 0.01)).toFixed(4),
        USDT: (parseFloat(connected.balances.USDT) * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
        USDC: (parseFloat(connected.balances.USDC) * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
      }
    };
    save(updated);
    setConnected(updated);
    setRefreshing(false);
  };

  const handleChainSwitch = (chain) => {
    const updated = { ...connected, chain: chain.name, chainId: chain.id, chainColor: chain.color, explorer: chain.explorer };
    save(updated);
    setConnected(updated);
  };

  const currentChain = CHAINS.find(c => c.id === connected?.chainId) || CHAINS[0];
  const tokenPrices = { ETH: 3420, USDT: 1, USDC: 1, BNB: 380, MATIC: 0.9 };
  const nativeSymbol = currentChain?.symbol || 'ETH';

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold">WalletConnect</div>
              <div className="text-slate-500 text-xs">Hubungkan MetaMask, Trust Wallet & lebih</div>
            </div>
          </div>
          <button onClick={() => setShowPicker(true)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <Smartphone className="w-4 h-4" /> Hubungkan Wallet Mobile
          </button>
          <div className="flex items-center gap-3 pt-0.5">
            {WALLETS.slice(0, 5).map(w => (
              <span key={w.id} title={w.name} className="text-lg cursor-default">{w.icon}</span>
            ))}
            <span className="text-slate-600 text-xs">+{WALLETS.length - 5} lainnya</span>
          </div>
        </div>
        {showPicker && <WalletPickerModal onConnect={handleConnect} onClose={() => setShowPicker(false)} />}
      </>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-slate-800/50 border border-green-500/25 rounded-2xl overflow-hidden">

        {/* Header bar */}
        <button onClick={() => setShowDetails(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{connected.wallet.icon}</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white text-sm font-semibold">{connected.wallet.name}</span>
                <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">Terhubung</span>
              </div>
              <div className="text-slate-400 text-xs font-mono">{shortenAddr(connected.address)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={e => { e.stopPropagation(); setShowChainSwitch(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-slate-600/50 hover:border-slate-500 transition-colors"
              style={{ color: currentChain.color, background: currentChain.color + '18' }}>
              <Globe className="w-3 h-3" />
              {currentChain.name}
              <ArrowLeftRight className="w-2.5 h-2.5 opacity-60" />
            </button>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Expanded details */}
        {showDetails && (
          <div className="border-t border-slate-700/40 px-4 py-3 space-y-3">

            {/* Address */}
            <div className="flex items-center justify-between bg-slate-900/60 rounded-xl px-3 py-2">
              <span className="text-slate-400 text-xs font-mono truncate flex-1">{connected.address}</span>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a href={`${connected.explorer}/address/${connected.address}`} target="_blank" rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Session permissions */}
            <div className="bg-slate-900/40 rounded-xl px-3 py-2 space-y-1">
              <p className="text-slate-500 text-[10px] font-semibold mb-1.5">IZIN SESI</p>
              <div className="flex flex-wrap gap-1.5">
                {(connected.permissions || []).map(p => (
                  <span key={p} className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-mono">{p}</span>
                ))}
              </div>
            </div>

            {/* Token balances */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Saldo Token</span>
                <button onClick={handleRefresh} disabled={refreshing}
                  className="flex items-center gap-1 hover:text-slate-300 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Perbarui
                </button>
              </div>
              {[
                { symbol: 'ETH',  balance: connected.balances.ETH,  color: '#627EEA', icon: 'Ξ' },
                { symbol: 'USDT', balance: connected.balances.USDT, color: '#26A17B', icon: '₮' },
                { symbol: 'USDC', balance: connected.balances.USDC, color: '#2775CA', icon: '$' },
              ].map(t => {
                const usd = (parseFloat(t.balance) * (tokenPrices[t.symbol] || 1)).toFixed(2);
                return (
                  <div key={t.symbol} className="flex items-center gap-2.5 bg-slate-900/40 rounded-xl px-3 py-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: t.color }}>
                      {t.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-bold">{t.balance} <span className="text-slate-400 text-xs font-normal">{t.symbol}</span></div>
                    </div>
                    <div className="text-slate-400 text-xs">≈ ${parseFloat(usd).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                  </div>
                );
              })}
            </div>

            {/* DApp interaction buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Sign Pesan', icon: Shield, action: () => alert('Fitur Sign Pesan: gunakan wallet mobile Anda untuk menandatangani') },
                { label: 'Kirim TX',   icon: ArrowLeftRight, action: () => alert('Kirim transaksi via WalletConnect: konfirmasi di wallet mobile') },
                { label: 'Explorer',   icon: ExternalLink, action: () => window.open(`${connected.explorer}/address/${connected.address}`, '_blank') },
              ].map(({ label, icon: Icon, action }) => (
                <button key={label} onClick={action}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600 transition-all text-slate-400 hover:text-white">
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: currentChain.color }} />
                <span className="text-slate-400 text-xs">{currentChain.name} · ID {currentChain.id}</span>
              </div>
              <button onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-medium transition-all">
                <Unplug className="w-3.5 h-3.5" /> Putuskan
              </button>
            </div>
          </div>
        )}
      </div>

      {showPicker && <WalletPickerModal onConnect={handleConnect} onClose={() => setShowPicker(false)} />}
      {showChainSwitch && (
        <ChainSwitchModal
          currentChainId={connected.chainId}
          onSwitch={handleChainSwitch}
          onClose={() => setShowChainSwitch(false)}
        />
      )}
    </>
  );
}
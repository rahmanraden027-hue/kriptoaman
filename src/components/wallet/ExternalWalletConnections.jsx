import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, PlugZap, ShieldCheck, Unplug, WalletCards } from 'lucide-react';
import { useWeb3 } from '../web3/Web3Provider';
import { useLanguage } from '@/lib/LanguageContext';

function compact(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-5)}`;
}

function phantomProvider() {
  if (typeof window === 'undefined') return null;
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

export default function ExternalWalletConnections({ onConnectionCountChange }) {
  const { language } = useLanguage();
  const en = language === 'en';
  const web3 = useWeb3();
  const [solanaAddress, setSolanaAddress] = useState('');
  const [solanaBusy, setSolanaBusy] = useState(false);
  const [solanaError, setSolanaError] = useState('');
  const phantom = useMemo(() => phantomProvider(), []);
  const evmWallets = web3?.availableWallets || [];
  const connectionCount = Number(Boolean(web3?.isConnected && web3?.account)) + Number(Boolean(solanaAddress));

  useEffect(() => {
    if (!phantom) return undefined;
    const onAccountChanged = (publicKey) => setSolanaAddress(publicKey?.toString?.() || '');
    const onDisconnect = () => setSolanaAddress('');
    phantom.on?.('accountChanged', onAccountChanged);
    phantom.on?.('disconnect', onDisconnect);
    if (phantom.isConnected && phantom.publicKey) setSolanaAddress(phantom.publicKey.toString());
    return () => {
      phantom.off?.('accountChanged', onAccountChanged);
      phantom.off?.('disconnect', onDisconnect);
    };
  }, [phantom]);

  useEffect(() => {
    onConnectionCountChange?.(connectionCount);
  }, [connectionCount, onConnectionCountChange]);

  async function connectPhantom() {
    if (!phantom) {
      const target = encodeURIComponent('https://kriptoaman.com/Wallet');
      window.location.assign(`https://phantom.app/ul/browse/${target}`);
      return;
    }
    setSolanaBusy(true);
    setSolanaError('');
    try {
      const response = await phantom.connect();
      setSolanaAddress(response.publicKey.toString());
    } catch (error) {
      setSolanaError(error?.message || (en ? 'Connection was cancelled.' : 'Koneksi dibatalkan.'));
    } finally {
      setSolanaBusy(false);
    }
  }

  async function disconnectPhantom() {
    try { await phantom?.disconnect?.(); } finally { setSolanaAddress(''); }
  }

  const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70';
  const walletConnectActive = web3?.isConnected && web3.walletType === 'WalletConnect';

  return (
    <section className="ka-surface space-y-4 p-5" aria-labelledby="external-wallet-title">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10"><WalletCards className="h-5 w-5 text-cyan-300" /></div>
        <div>
          <h2 id="external-wallet-title" className="font-bold text-white">{en ? 'Connect an external wallet' : 'Tautkan dompet eksternal'}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{en ? 'Read-only connection for a public account you control. KriptoAman never asks for a seed phrase, private key, or OTP.' : 'Koneksi read-only untuk akun publik yang Anda kuasai. KriptoAman tidak pernah meminta seed phrase, private key, atau OTP.'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          disabled={web3?.connecting}
          aria-pressed={walletConnectActive}
          aria-label={walletConnectActive ? (en ? 'Disconnect WalletConnect' : 'Putuskan WalletConnect') : (en ? 'Connect with WalletConnect' : 'Hubungkan dengan WalletConnect')}
          onClick={() => walletConnectActive ? web3.disconnectWallet() : web3.connectWalletConnect()}
          className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border border-blue-500/35 bg-blue-500/10 p-3 text-left transition hover:border-blue-400 disabled:opacity-60 ${focusClass}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3b99fc] text-lg font-black text-white">W</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">WalletConnect</span>
            <span className="block truncate text-xs text-slate-400">{walletConnectActive ? `${compact(web3.account)} · ${web3.currentChain?.name || 'EVM'}` : web3?.walletConnectConfigured ? (en ? 'Connect with a compatible WalletConnect wallet' : 'Hubungkan dengan dompet WalletConnect yang kompatibel') : (en ? 'Project ID configuration required' : 'Project ID perlu dikonfigurasi')}</span>
          </span>
          {web3?.connecting ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : walletConnectActive ? <Unplug className="h-4 w-4 text-red-400" /> : <ExternalLink className="h-4 w-4 text-blue-300" />}
        </button>

        {evmWallets.length ? evmWallets.map((wallet) => {
          const active = web3?.isConnected && web3.walletType === wallet.info?.name;
          const name = wallet.info?.name || 'EVM Wallet';
          return (
            <button
              type="button"
              key={wallet.info?.uuid || name}
              disabled={web3?.connecting}
              aria-pressed={active}
              aria-label={active ? (en ? `Disconnect ${name}` : `Putuskan ${name}`) : (en ? `Connect ${name}` : `Hubungkan ${name}`)}
              onClick={() => active ? web3.disconnectWallet() : web3.connectWallet(wallet)}
              className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/45 p-3 text-left transition hover:border-blue-500/40 disabled:opacity-60 ${focusClass}`}
            >
              {wallet.info?.icon ? <img src={wallet.info.icon} alt="" className="h-9 w-9 rounded-xl" /> : <PlugZap className="h-7 w-7 text-blue-400" />}
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">{name}</span><span className="block truncate text-xs text-slate-500">{active ? `${compact(web3.account)} · ${web3.currentChain?.name || 'EVM'}` : (en ? 'EVM-compatible public account connection' : 'Koneksi akun publik kompatibel EVM')}</span></span>
              {web3?.connecting ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : active ? <Unplug className="h-4 w-4 text-red-400" /> : <ExternalLink className="h-4 w-4 text-slate-500" />}
            </button>
          );
        }) : (
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className={`flex min-h-14 items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/45 p-3 transition hover:border-blue-500/40 ${focusClass}`}>
            <PlugZap className="h-7 w-7 text-orange-400" />
            <span className="flex-1"><span className="block text-sm font-bold text-white">MetaMask / EVM</span><span className="block text-xs text-slate-500">{en ? 'Install a compatible browser wallet' : 'Pasang dompet browser yang kompatibel'}</span></span>
            <ExternalLink className="h-4 w-4 text-slate-500" />
          </a>
        )}

        <button type="button" disabled={solanaBusy} aria-pressed={Boolean(solanaAddress)} aria-label={solanaAddress ? (en ? 'Disconnect Phantom Solana' : 'Putuskan Phantom Solana') : (en ? 'Connect Phantom Solana' : 'Hubungkan Phantom Solana')} onClick={solanaAddress ? disconnectPhantom : connectPhantom} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/45 p-3 text-left transition hover:border-violet-500/40 disabled:opacity-60 ${focusClass}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-black text-white">P</span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">Phantom · Solana</span><span className="block truncate text-xs text-slate-500">{solanaAddress ? compact(solanaAddress) : phantom ? (en ? 'Provider detected' : 'Provider terdeteksi') : (en ? 'Open in or install Phantom to connect' : 'Buka melalui atau pasang Phantom untuk terhubung')}</span></span>
          {solanaBusy ? <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> : solanaAddress ? <Unplug className="h-4 w-4 text-red-400" /> : <ExternalLink className="h-4 w-4 text-slate-500" />}
        </button>
      </div>

      {(web3?.connectionError || solanaError) && <p role="alert" className="text-xs text-red-400">{web3?.connectionError || solanaError}</p>}

      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-xs leading-relaxed text-slate-400">{en ? 'The public connection requests account access for address visibility. Transaction execution is not exposed by this surface.' : 'Koneksi publik meminta akses akun untuk visibilitas alamat. Eksekusi transaksi tidak disediakan pada halaman ini.'}</p>
      </div>

      {(web3?.isConnected || solanaAddress) && <div role="status" className="flex items-center gap-2 text-xs font-semibold text-emerald-400"><CheckCircle2 className="h-4 w-4" /> {en ? 'Wallet provider connected' : 'Provider dompet terhubung'}</div>}
    </section>
  );
}

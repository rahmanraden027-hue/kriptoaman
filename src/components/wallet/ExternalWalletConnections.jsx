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
      // Open the same Solana-aware wallet screen inside Phantom's browser.
      // Do not route to Web3Wallet because that surface is EVM-only and can
      // make Phantom's Ethereum provider look like a successful Solana link.
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

  return (
    <section className="ka-surface p-5 space-y-4" aria-labelledby="external-wallet-title">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10">
          <WalletCards className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h2 id="external-wallet-title" className="font-bold text-white">
            {en ? 'Connect an external wallet' : 'Tautkan dompet eksternal'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {en ? 'Read-only connection test for an address you control. KriptoAman never asks for a seed phrase, private key, or OTP.' : 'Uji koneksi read-only untuk alamat yang Anda kuasai. KriptoAman tidak pernah meminta seed phrase, private key, atau OTP.'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          disabled={web3?.connecting}
          onClick={() => web3?.isConnected && web3.walletType === 'WalletConnect'
            ? web3.disconnectWallet()
            : web3.connectWalletConnect()}
          className="w-full flex items-center gap-3 rounded-2xl border border-blue-500/35 bg-blue-500/10 p-3 text-left hover:border-blue-400 disabled:opacity-60"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3b99fc] text-lg font-black text-white">W</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">WalletConnect</span>
            <span className="block truncate text-xs text-slate-400">
              {web3?.isConnected && web3.walletType === 'WalletConnect'
                ? `${compact(web3.account)} · ${web3.currentChain?.name || 'EVM'}`
                : web3?.walletConnectConfigured
                  ? (en ? 'Scan QR with 600+ compatible wallets' : 'Pindai QR dengan 600+ dompet kompatibel')
                  : (en ? 'Project ID configuration required' : 'Project ID perlu dikonfigurasi')}
            </span>
          </span>
          {web3?.connecting
            ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            : web3?.isConnected && web3.walletType === 'WalletConnect'
              ? <Unplug className="h-4 w-4 text-red-400" />
              : <ExternalLink className="h-4 w-4 text-blue-300" />}
        </button>

        {evmWallets.length ? evmWallets.map((wallet) => {
          const active = web3?.isConnected && web3.walletType === wallet.info?.name;
          return (
            <button
              type="button"
              key={wallet.info?.uuid || wallet.info?.name}
              disabled={web3?.connecting}
              onClick={() => active ? web3.disconnectWallet() : web3.connectWallet(wallet)}
              className="w-full flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/45 p-3 text-left hover:border-blue-500/40 disabled:opacity-60"
            >
              {wallet.info?.icon ? <img src={wallet.info.icon} alt="" className="h-9 w-9 rounded-xl" /> : <PlugZap className="h-7 w-7 text-blue-400" />}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">{wallet.info?.name || 'EVM Wallet'}</span>
                <span className="block truncate text-xs text-slate-500">
                  {active ? `${compact(web3.account)} · ${web3.currentChain?.name || 'EVM'}` : (en ? 'Ethereum, BNB, Polygon, Base and more' : 'Ethereum, BNB, Polygon, Base, dan lainnya')}
                </span>
              </span>
              {web3?.connecting ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" /> : active ? <Unplug className="h-4 w-4 text-red-400" /> : <ExternalLink className="h-4 w-4 text-slate-500" />}
            </button>
          );
        }) : (
          <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/45 p-3 hover:border-blue-500/40">
            <PlugZap className="h-7 w-7 text-orange-400" />
            <span className="flex-1"><span className="block text-sm font-bold text-white">MetaMask / EVM</span><span className="block text-xs text-slate-500">{en ? 'Install a compatible browser wallet' : 'Pasang dompet browser yang kompatibel'}</span></span>
            <ExternalLink className="h-4 w-4 text-slate-500" />
          </a>
        )}

        <button type="button" disabled={solanaBusy} onClick={solanaAddress ? disconnectPhantom : connectPhantom} className="w-full flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/45 p-3 text-left hover:border-violet-500/40 disabled:opacity-60">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-black text-white">P</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">Phantom · Solana</span>
            <span className="block truncate text-xs text-slate-500">{solanaAddress ? compact(solanaAddress) : (phantom ? (en ? 'Provider detected' : 'Provider terdeteksi') : (en ? 'Install Phantom to test' : 'Pasang Phantom untuk menguji'))}</span>
          </span>
          {solanaBusy ? <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> : solanaAddress ? <Unplug className="h-4 w-4 text-red-400" /> : <ExternalLink className="h-4 w-4 text-slate-500" />}
        </button>
      </div>

      {(web3?.connectionError || solanaError) && <p role="alert" className="text-xs text-red-400">{web3?.connectionError || solanaError}</p>}

      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-xs leading-relaxed text-slate-400">
          {en ? 'This test requests only the public account. Signing and transactions remain disabled in the public release.' : 'Pengujian ini hanya meminta akun publik. Penandatanganan dan transaksi tetap dinonaktifkan pada rilis publik.'}
        </p>
      </div>

      {(web3?.isConnected || solanaAddress) && (
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> {en ? 'Real wallet provider connected' : 'Provider dompet nyata terhubung'}
        </div>
      )}
    </section>
  );
}

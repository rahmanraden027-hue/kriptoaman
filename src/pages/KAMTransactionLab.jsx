import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, ExternalLink, Loader2, Network, Send, ShieldCheck, WalletCards } from 'lucide-react';

const NETWORK = {
  chainId: '0x560c',
  chainIdDecimal: 22028,
  chainName: 'KriptoAman Mainnet Candidate',
  nativeCurrency: { name: 'KriptoAman', symbol: 'KAM', decimals: 18 },
  rpcUrls: ['https://rpc.kriptoaman.com'],
  blockExplorerUrls: ['https://explorer.kriptoaman.com'],
};
const MAX_TRIAL_KAM = '1';
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const HASH_RE = /^0x[a-fA-F0-9]{64}$/;

function parseKam(value) {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d{0,18})?$/.test(normalized)) throw new Error('Masukkan nominal KAM yang valid.');
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * 10n ** 18n + BigInt((fraction + '0'.repeat(18)).slice(0, 18));
}

function formatKam(hexValue) {
  const wei = BigInt(hexValue || '0x0');
  const whole = wei / 10n ** 18n;
  const fraction = (wei % 10n ** 18n).toString().padStart(18, '0').slice(0, 6).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}

function short(value) {
  return value ? `${value.slice(0, 8)}…${value.slice(-6)}` : '—';
}

export default function KAMTransactionLab() {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [balance, setBalance] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [acknowledged, setAcknowledged] = useState(false);
  const [stage, setStage] = useState('idle');
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  const walletAvailable = typeof window !== 'undefined' && Boolean(window.ethereum?.request);
  const chainReady = chainId.toLowerCase() === NETWORK.chainId;
  const validRecipient = ADDRESS_RE.test(recipient.trim());
  const amountWei = useMemo(() => {
    try { return parseKam(amount); } catch { return 0n; }
  }, [amount]);
  const amountReady = amountWei > 0n && amountWei <= parseKam(MAX_TRIAL_KAM);
  const canPreview = walletAvailable && account && chainReady && validRecipient && amountReady && recipient.toLowerCase() !== account.toLowerCase();
  const busy = stage === 'connecting' || stage === 'switching' || stage === 'sending';

  const refreshWallet = async () => {
    if (!window.ethereum?.request) return;
    const [accounts, currentChain] = await Promise.all([
      window.ethereum.request({ method: 'eth_accounts' }),
      window.ethereum.request({ method: 'eth_chainId' }),
    ]);
    const nextAccount = accounts?.[0] || '';
    setAccount(nextAccount);
    setChainId(String(currentChain || ''));
    if (nextAccount) {
      const nextBalance = await window.ethereum.request({ method: 'eth_getBalance', params: [nextAccount, 'latest'] });
      setBalance(formatKam(nextBalance));
    } else {
      setBalance(null);
    }
  };

  useEffect(() => {
    refreshWallet().catch(() => {});
    const provider = window.ethereum;
    if (!provider?.on) return undefined;
    const sync = () => refreshWallet().catch(() => {});
    provider.on('accountsChanged', sync);
    provider.on('chainChanged', sync);
    return () => {
      provider.removeListener?.('accountsChanged', sync);
      provider.removeListener?.('chainChanged', sync);
    };
  }, []);

  const connect = async () => {
    setStage('connecting');
    setMessage('');
    try {
      if (!window.ethereum?.request) throw new Error('Wallet EVM tidak terdeteksi. Buka halaman ini melalui browser MetaMask atau wallet EVM kompatibel.');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await refreshWallet();
      setMessage('Wallet terhubung. Pastikan alamat dan jaringan benar sebelum melanjutkan.');
      setStage('idle');
    } catch (error) {
      setMessage(error?.code === 4001 ? 'Permintaan koneksi dibatalkan di wallet.' : error?.message || 'Wallet belum dapat dihubungkan.');
      setStage('error');
    }
  };

  const switchNetwork = async () => {
    setStage('switching');
    setMessage('');
    try {
      if (!window.ethereum?.request) throw new Error('Wallet EVM tidak terdeteksi.');
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NETWORK.chainId }] });
      } catch (error) {
        if (error?.code !== 4902) throw error;
        await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [NETWORK] });
      }
      await refreshWallet();
      setMessage('KAM Network telah dipilih di wallet.');
      setStage('idle');
    } catch (error) {
      setMessage(error?.code === 4001 ? 'Perubahan jaringan dibatalkan di wallet.' : error?.message || 'Jaringan belum dapat dipilih.');
      setStage('error');
    }
  };

  const prepare = () => {
    setMessage('');
    setTxHash('');
    if (!canPreview) {
      setMessage('Lengkapi koneksi wallet, jaringan, alamat tujuan, dan nominal yang valid.');
      return;
    }
    setAcknowledged(false);
    setStage('preview');
  };

  const sendTrial = async () => {
    if (busy || stage !== 'preview' || !acknowledged || !canPreview) return;
    setStage('sending');
    setMessage('Menunggu konfirmasi dan tanda tangan di wallet Anda…');
    try {
      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: account, to: recipient.trim(), value: `0x${amountWei.toString(16)}` }],
      });
      if (!HASH_RE.test(String(hash))) throw new Error('Wallet tidak mengembalikan hash transaksi yang valid.');
      setTxHash(hash);
      setMessage('Transaksi telah dikirim. Status final harus diverifikasi melalui KAM Explorer.');
      setStage('submitted');
      await refreshWallet();
    } catch (error) {
      setMessage(error?.code === 4001 ? 'Transaksi dibatalkan di wallet. Tidak ada KAM yang dikirim.' : error?.message || 'Transaksi belum dapat dikirim.');
      setStage('error');
    }
  };

  const copy = async (value) => {
    await navigator.clipboard?.writeText(value);
    setMessage('Berhasil disalin.');
  };

  return (
    <main className="ka-bg min-h-screen px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="ka-command-hero overflow-hidden p-6 sm:p-8">
          <a href="/KAMNetwork" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Kembali ke KAM Network</a>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="ka-command-kicker">KAM NETWORK · TRANSACTION LAB</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Coba transaksi KAM dengan kendali penuh di wallet Anda</h1>
              <p className="mt-3 text-base leading-7 text-slate-300">Hubungkan wallet, periksa jaringan, tinjau transaksi, lalu setujui sendiri melalui MetaMask atau wallet EVM kompatibel.</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200"><ShieldCheck className="mr-2 inline h-5 w-5" /> Chain ID 22028</div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="ka-command-panel p-5"><p className="text-sm font-bold text-slate-400">Wallet</p><p className="mt-3 text-lg font-black">{account ? short(account) : 'Belum terhubung'}</p><button onClick={account ? refreshWallet : connect} disabled={busy} className="mt-4 min-h-11 w-full rounded-xl bg-sky-600 px-4 text-sm font-black hover:bg-sky-500 disabled:opacity-50">{stage === 'connecting' ? 'Menghubungkan…' : account ? 'Perbarui Wallet' : 'Hubungkan Wallet'}</button></div>
          <div className="ka-command-panel p-5"><p className="text-sm font-bold text-slate-400">Jaringan</p><p className={`mt-3 text-lg font-black ${chainReady ? 'text-emerald-300' : 'text-amber-300'}`}>{chainReady ? 'KAM Network' : chainId ? `Chain ${parseInt(chainId, 16)}` : 'Belum terdeteksi'}</p><button onClick={switchNetwork} disabled={busy || chainReady} className="mt-4 min-h-11 w-full rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 text-sm font-black text-sky-200 disabled:opacity-50">{chainReady ? 'Jaringan Sesuai' : 'Pilih KAM Network'}</button></div>
          <div className="ka-command-panel p-5"><p className="text-sm font-bold text-slate-400">Saldo tersedia</p><p className="mt-3 text-lg font-black">{balance == null ? '—' : `${balance} KAM`}</p><p className="mt-4 text-sm leading-6 text-slate-500">Dibaca langsung dari wallet pada blok terbaru.</p></div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="ka-command-panel p-5 sm:p-6">
            <div className="flex items-center gap-3"><Send className="h-6 w-6 text-sky-300" /><h2 className="text-xl font-black">Detail transaksi percobaan</h2></div>
            <label className="mt-6 block text-sm font-bold text-slate-300">Alamat tujuan</label>
            <div className="mt-2 flex gap-2"><input value={recipient} onChange={e => { setRecipient(e.target.value.trim()); setStage('idle'); }} placeholder="0x…" autoComplete="off" spellCheck="false" className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 font-mono text-sm outline-none focus:border-sky-400" /><button onClick={() => copy(recipient)} disabled={!validRecipient} aria-label="Salin alamat tujuan" className="rounded-xl border border-slate-700 px-3 text-slate-300 disabled:opacity-40"><Copy className="h-4 w-4" /></button></div>
            {recipient && !validRecipient && <p className="mt-2 text-sm text-amber-300">Alamat harus berbentuk alamat EVM 0x dengan 40 karakter heksadesimal.</p>}
            {validRecipient && account && recipient.toLowerCase() === account.toLowerCase() && <p className="mt-2 text-sm text-amber-300">Gunakan alamat tujuan yang berbeda dari alamat pengirim.</p>}

            <label className="mt-5 block text-sm font-bold text-slate-300">Jumlah KAM</label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-700 bg-slate-950/70"><input value={amount} onChange={e => { setAmount(e.target.value); setStage('idle'); }} inputMode="decimal" className="min-h-12 min-w-0 flex-1 bg-transparent px-4 text-base font-bold outline-none" /><span className="px-4 text-sm font-black text-sky-300">KAM</span></div>
            <p className="mt-2 text-sm text-slate-500">Batas keamanan percobaan: maksimal {MAX_TRIAL_KAM} KAM. Biaya jaringan ditampilkan dan dikonfirmasi oleh wallet.</p>

            <button onClick={prepare} disabled={!canPreview || busy} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 className="h-5 w-5" /> Tinjau transaksi</button>
          </div>

          <aside className="ka-command-panel p-5 sm:p-6">
            <div className="flex items-center gap-3"><Network className="h-6 w-6 text-sky-300" /><h2 className="text-xl font-black">Parameter resmi</h2></div>
            {[['Network', NETWORK.chainName], ['Chain ID', '22028 · 0x560c'], ['RPC', NETWORK.rpcUrls[0]], ['Explorer', NETWORK.blockExplorerUrls[0]]].map(([label, value]) => <div key={label} className="mt-4 border-b border-slate-800 pb-4 last:border-0"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-1 break-all text-sm font-semibold text-slate-200">{value}</p></div>)}
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100"><AlertTriangle className="mr-2 inline h-5 w-5" />Transaksi ini nyata dan tidak dapat dibatalkan setelah masuk ke jaringan.</div>
          </aside>
        </section>

        {stage === 'preview' && (
          <section className="rounded-[26px] border border-emerald-400/25 bg-emerald-500/5 p-5 sm:p-6">
            <h2 className="text-xl font-black">Konfirmasi transaksi</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Dari', short(account)], ['Ke', short(recipient)], ['Jumlah', `${amount} KAM`]].map(([label,value]) => <div key={label} className="rounded-xl bg-slate-950/60 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 font-bold">{value}</p></div>)}</div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-4"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-1 h-5 w-5" /><span className="text-sm leading-6 text-slate-300">Saya telah memeriksa alamat, jumlah, dan jaringan. Saya memahami transaksi blockchain bersifat final setelah dikonfirmasi.</span></label>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row"><button onClick={() => setStage('idle')} className="min-h-12 flex-1 rounded-xl border border-slate-700 px-5 text-sm font-black">Ubah detail</button><button onClick={sendTrial} disabled={!acknowledged || busy} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black disabled:opacity-40">{stage === 'sending' ? <Loader2 className="h-5 w-5 animate-spin" /> : <WalletCards className="h-5 w-5" />} Konfirmasi di wallet</button></div>
          </section>
        )}

        {message && <div aria-live="polite" className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm leading-6 text-sky-100">{message}</div>}
        {txHash && HASH_RE.test(txHash) && <a href={`${NETWORK.blockExplorerUrls[0]}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 text-sm font-black text-emerald-200">Verifikasi transaksi di KAM Explorer <ExternalLink className="h-5 w-5" /></a>}

        <p className="px-1 text-sm leading-6 text-slate-500">KriptoAman tidak pernah meminta seed phrase, private key, atau password wallet. Seluruh persetujuan dan tanda tangan transaksi dilakukan di dalam wallet pengguna.</p>
      </div>
    </main>
  );
}

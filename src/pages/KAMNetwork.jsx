import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Loader2, Network, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';

const NETWORK = {
  chainId: '0x560c',
  chainIdDecimal: 22028,
  chainName: 'KriptoAman Mainnet Candidate',
  nativeCurrency: { name: 'KriptoAman', symbol: 'KAM', decimals: 18 },
  rpcUrls: ['https://rpc.kriptoaman.com'],
  blockExplorerUrls: ['https://explorer.kriptoaman.com'],
};

async function rpc(method, params = []) {
  const started = performance.now();
  const response = await fetch(NETWORK.rpcUrls[0], {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload?.error?.message || `RPC HTTP ${response.status}`);
  return { result: payload.result, latency: Math.round(performance.now() - started) };
}

export default function KAMNetwork() {
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState({ state: 'checking', block: null, latency: null, checkedAt: null, message: '' });
  const [walletMessage, setWalletMessage] = useState('');

  const chainOk = useMemo(() => status.state === 'operational', [status.state]);

  const checkNetwork = async () => {
    setChecking(true);
    try {
      const chain = await rpc('eth_chainId');
      if (String(chain.result).toLowerCase() !== NETWORK.chainId) throw new Error(`Unexpected Chain ID: ${chain.result}`);
      const first = await rpc('eth_blockNumber');
      await new Promise(resolve => setTimeout(resolve, 3500));
      const second = await rpc('eth_blockNumber');
      const before = Number.parseInt(first.result, 16);
      const after = Number.parseInt(second.result, 16);
      if (!Number.isFinite(after) || after <= before) throw new Error('Block height did not advance during this probe');
      setStatus({ state: 'operational', block: after, latency: second.latency, checkedAt: new Date(), message: '' });
    } catch (error) {
      setStatus({ state: 'attention', block: null, latency: null, checkedAt: new Date(), message: error?.message || 'Network probe failed' });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => { checkNetwork(); }, []);

  const addToWallet = async () => {
    setWalletMessage('');
    if (!window.ethereum?.request) {
      setWalletMessage('Wallet EVM tidak terdeteksi. Gunakan MetaMask, Rabby, atau wallet kompatibel EVM.');
      return;
    }
    try {
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{
        chainId: NETWORK.chainId,
        chainName: NETWORK.chainName,
        nativeCurrency: NETWORK.nativeCurrency,
        rpcUrls: NETWORK.rpcUrls,
        blockExplorerUrls: NETWORK.blockExplorerUrls,
      }] });
      setWalletMessage('Jaringan KriptoAman berhasil ditambahkan atau dikonfirmasi di wallet Anda.');
    } catch (error) {
      setWalletMessage(error?.message || 'Permintaan penambahan jaringan dibatalkan.');
    }
  };

  const copy = async (value) => {
    await navigator.clipboard?.writeText(String(value));
    setWalletMessage('Disalin ke clipboard.');
  };

  return (
    <main className="ka-bg min-h-screen px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="ka-command-hero overflow-hidden p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <img src="/icons/kriptoaman-192.png" alt="KriptoAman" className="h-12 w-12 rounded-2xl object-contain" />
                <div>
                  <p className="ka-command-kicker">KRIPTOAMAN NETWORK</p>
                  <h1 className="mt-1 text-3xl font-black sm:text-4xl">KAM Network Status</h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">Transparansi jaringan, metadata wallet, RPC publik, explorer, dan pemeriksaan blok dalam satu halaman resmi.</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-200">
                <ShieldCheck className="h-4 w-4" /> mainnet-candidate-not-public
              </div>
            </div>
            <button onClick={checkNetwork} disabled={checking} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 text-sm font-black text-sky-200 hover:bg-sky-500/15 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> Periksa jaringan
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="ka-command-panel p-5">
            <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status RPC</span>{checking ? <Loader2 className="h-5 w-5 animate-spin text-slate-500" /> : chainOk ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Network className="h-5 w-5 text-amber-300" />}</div>
            <p className={`mt-3 text-xl font-black ${chainOk ? 'text-emerald-300' : status.state === 'attention' ? 'text-amber-300' : 'text-slate-300'}`}>{chainOk ? 'Operational' : status.state === 'attention' ? 'Needs attention' : 'Checking'}</p>
            <p className="mt-1 text-xs text-slate-500">{status.latency != null ? `${status.latency} ms` : 'Live probe'}</p>
          </div>
          <div className="ka-command-panel p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Latest block</p><p className="mt-3 text-xl font-black text-white">{status.block ?? '—'}</p><p className="mt-1 text-xs text-slate-500">Observed from public RPC</p></div>
          <div className="ka-command-panel p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Chain ID</p><p className="mt-3 text-xl font-black text-white">22028</p><p className="mt-1 text-xs text-slate-500">0x560c · EVM compatible</p></div>
        </section>

        {status.message && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-100">{status.message}</div>}

        <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="ka-command-panel p-5 sm:p-6">
            <div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-sky-300" /><h2 className="text-lg font-black">Add KriptoAman to Wallet</h2></div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Untuk MetaMask, Rabby, dan wallet EVM yang mendukung <code>wallet_addEthereumChain</code>.</p>
            <button onClick={addToWallet} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-sky-600 px-5 text-sm font-black text-white hover:bg-sky-500">Add to Wallet</button>
            {walletMessage && <p className="mt-3 text-xs leading-5 text-slate-400">{walletMessage}</p>}
          </div>

          <div className="ka-command-panel overflow-hidden p-0">
            {[
              ['Network', NETWORK.chainName],
              ['RPC', NETWORK.rpcUrls[0]],
              ['Chain ID', NETWORK.chainIdDecimal],
              ['Currency', 'KAM'],
            ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-800/80 px-5 py-4 last:border-b-0"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-200">{value}</p></div><button onClick={() => copy(value)} aria-label={`Copy ${label}`} className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white"><Copy className="h-4 w-4" /></button></div>)}
          </div>
        </section>

        <section className="ka-command-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-black">KriptoAman Explorer</p><p className="mt-1 text-xs text-slate-500">Lihat blok, transaksi, alamat, dan aktivitas jaringan KAM.</p></div>
          <a href={NETWORK.blockExplorerUrls[0]} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 text-xs font-black text-emerald-200"><ExternalLink className="h-4 w-4" /> Open Explorer</a>
        </section>

        <p className="px-1 text-[10px] leading-relaxed text-slate-600">Status halaman ini adalah pemeriksaan langsung terhadap endpoint publik. Label kandidat dipertahankan sampai seluruh production promotion gate selesai. Pemeriksaan browser tidak menggantikan bukti validator privat, backup/restore, protected origin, atau 24-hour readiness evidence.</p>
      </div>
    </main>
  );
}

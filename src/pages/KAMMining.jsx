import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Coins, ExternalLink, Loader2, Pickaxe, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';

const NETWORK = {
  chainId: '0x560c',
  chainIdDecimal: 22028,
  chainName: 'KriptoAman Mainnet Candidate',
  nativeCurrency: { name: 'KriptoAman', symbol: 'KAM', decimals: 18 },
  rpcUrls: ['https://rpc.kriptoaman.com'],
  blockExplorerUrls: ['https://explorer.kriptoaman.com'],
};

const CONTRACT_ADDRESS = String(import.meta.env.VITE_KAM_MINING_REWARDS_ADDRESS || '').trim();
const CONTRACT_CONFIGURED = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);

const ABI = [
  'function stake() payable',
  'function withdraw(uint256 amount)',
  'function claimReward()',
  'function stakedBalance(address account) view returns (uint256)',
  'function earned(address account) view returns (uint256)',
  'function totalStaked() view returns (uint256)',
  'function rewardRate() view returns (uint256)',
  'function periodFinish() view returns (uint256)',
  'function paused() view returns (bool)',
  'function availableRewardBalance() view returns (uint256)',
];

const fmt = (value, maximumFractionDigits = 4) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits }).format(n);
};

const shorten = (value) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '—';

export default function KAMMining() {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [stakeInput, setStakeInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [state, setState] = useState({
    walletBalance: '0',
    staked: '0',
    earned: '0',
    totalStaked: '0',
    rewardPool: '0',
    rewardRate: '0',
    periodFinish: 0,
    paused: false,
  });

  const providerAvailable = typeof window !== 'undefined' && Boolean(window.ethereum?.request);
  const onCorrectChain = String(chainId).toLowerCase() === NETWORK.chainId;

  const contractStatus = useMemo(() => {
    if (!CONTRACT_CONFIGURED) return 'Pilot contract belum dikonfigurasi';
    if (state.paused) return 'Pilot dijeda';
    return 'Pilot siap digunakan';
  }, [state.paused]);

  const ensureKamNetwork = useCallback(async () => {
    if (!window.ethereum?.request) throw new Error('Wallet EVM tidak terdeteksi.');
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: NETWORK.chainId }] });
    } catch (error) {
      if (error?.code !== 4902) throw error;
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: NETWORK.chainId,
          chainName: NETWORK.chainName,
          nativeCurrency: NETWORK.nativeCurrency,
          rpcUrls: NETWORK.rpcUrls,
          blockExplorerUrls: NETWORK.blockExplorerUrls,
        }],
      });
    }
  }, []);

  const loadState = useCallback(async (nextAccount = account) => {
    if (!providerAvailable || !nextAccount) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setChainId(`0x${network.chainId.toString(16)}`);
      const balance = await provider.getBalance(nextAccount);

      if (!CONTRACT_CONFIGURED || network.chainId !== BigInt(NETWORK.chainIdDecimal)) {
        setState(previous => ({ ...previous, walletBalance: formatEther(balance) }));
        return;
      }

      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
      const [staked, earned, totalStaked, rewardPool, rewardRate, periodFinish, paused] = await Promise.all([
        contract.stakedBalance(nextAccount),
        contract.earned(nextAccount),
        contract.totalStaked(),
        contract.availableRewardBalance(),
        contract.rewardRate(),
        contract.periodFinish(),
        contract.paused(),
      ]);

      setState({
        walletBalance: formatEther(balance),
        staked: formatEther(staked),
        earned: formatEther(earned),
        totalStaked: formatEther(totalStaked),
        rewardPool: formatEther(rewardPool),
        rewardRate: formatEther(rewardRate),
        periodFinish: Number(periodFinish),
        paused,
      });
    } catch (error) {
      setMessage(error?.shortMessage || error?.message || 'Gagal membaca status KAM Mining.');
    }
  }, [account, providerAvailable]);

  const connectWallet = async () => {
    setMessage('');
    if (!providerAvailable) {
      setMessage('MetaMask atau wallet EVM kompatibel belum terdeteksi.');
      return;
    }
    setBusy(true);
    try {
      await ensureKamNetwork();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const selected = accounts?.[0] || '';
      setAccount(selected);
      await loadState(selected);
      setMessage('Wallet terhubung ke KAM Network.');
    } catch (error) {
      setMessage(error?.shortMessage || error?.message || 'Koneksi wallet dibatalkan.');
    } finally {
      setBusy(false);
    }
  };

  const execute = async (action) => {
    if (!CONTRACT_CONFIGURED) {
      setMessage('Kontrak mining belum memiliki alamat deployment produksi. Tidak ada transaksi yang dikirim.');
      return;
    }
    if (!account) {
      await connectWallet();
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      await ensureKamNetwork();
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      let tx;
      if (action === 'stake') {
        const amount = parseEther(String(stakeInput || '0'));
        if (amount <= 0n) throw new Error('Masukkan jumlah KAM yang valid.');
        tx = await contract.stake({ value: amount });
      } else if (action === 'claim') {
        tx = await contract.claimReward();
      } else if (action === 'withdraw') {
        const amount = parseEther(state.staked || '0');
        if (amount <= 0n) throw new Error('Tidak ada stake yang dapat ditarik.');
        tx = await contract.withdraw(amount);
      }

      setMessage(`Transaksi dikirim: ${shorten(tx.hash)}. Menunggu konfirmasi…`);
      await tx.wait();
      setStakeInput('');
      await loadState(account);
      setMessage('Transaksi KAM Mining berhasil dikonfirmasi.');
    } catch (error) {
      setMessage(error?.shortMessage || error?.reason || error?.message || 'Transaksi gagal.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!providerAvailable) return undefined;
    let mounted = true;

    const hydrate = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
        if (!mounted) return;
        setChainId(currentChain || '');
        if (accounts?.[0]) {
          setAccount(accounts[0]);
          await loadState(accounts[0]);
        }
      } catch {
        // Passive wallet hydration intentionally fails silently.
      }
    };

    const onAccountsChanged = (accounts) => {
      const next = accounts?.[0] || '';
      setAccount(next);
      if (next) loadState(next);
    };
    const onChainChanged = (nextChainId) => {
      setChainId(nextChainId || '');
      if (account) loadState(account);
    };

    hydrate();
    window.ethereum.on?.('accountsChanged', onAccountsChanged);
    window.ethereum.on?.('chainChanged', onChainChanged);
    return () => {
      mounted = false;
      window.ethereum.removeListener?.('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', onChainChanged);
    };
  }, [account, loadState, providerAvailable]);

  const programEnd = state.periodFinish
    ? new Date(state.periodFinish * 1000).toLocaleString('id-ID')
    : 'Belum aktif';

  return (
    <main className="ka-bg min-h-screen px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="ka-command-hero overflow-hidden p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10"><Pickaxe className="h-6 w-6 text-sky-300" /></div>
                <div>
                  <p className="ka-command-kicker">KAM NETWORK · REWARD PILOT</p>
                  <h1 className="mt-1 text-3xl font-black sm:text-4xl">KAM Mining</h1>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Program reward berbasis staking native KAM. Sistem ini tidak menggunakan Proof-of-Work dan tidak mencetak KAM baru; reward hanya berasal dari pool KAM yang didanai terlebih dahulu.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-200"><ShieldCheck className="h-4 w-4" /> Funded rewards only</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-bold text-sky-200"><Coins className="h-4 w-4" /> Native KAM</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <button onClick={connectWallet} disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-black text-white hover:bg-sky-500 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                {account ? shorten(account) : 'Hubungkan Wallet'}
              </button>
              <button onClick={() => loadState(account)} disabled={!account || busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 text-xs font-bold text-slate-300 hover:border-slate-600 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
            </div>
          </div>
        </section>

        {!CONTRACT_CONFIGURED && (
          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">Deployment belum diaktifkan</p><p className="mt-1 text-xs text-amber-100/75">UI sudah siap, tetapi transaksi sengaja dinonaktifkan sampai alamat kontrak hasil audit/deployment dimasukkan melalui <code>VITE_KAM_MINING_REWARDS_ADDRESS</code>. Ini mencegah pengguna mengirim KAM ke alamat yang belum diverifikasi.</p></div></div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['Wallet KAM', `${fmt(state.walletBalance)} KAM`],
            ['Stake Anda', `${fmt(state.staked)} KAM`],
            ['Reward tersedia', `${fmt(state.earned)} KAM`],
            ['Total stake', `${fmt(state.totalStaked)} KAM`],
          ].map(([label, value]) => (
            <div key={label} className="ka-command-panel p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-3 text-xl font-black text-white">{value}</p></div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="ka-command-panel p-5 sm:p-6">
            <div className="flex items-center gap-3"><Pickaxe className="h-5 w-5 text-sky-300" /><h2 className="text-lg font-black">Aktifkan KAM Mining Reward</h2></div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Stake berfungsi sebagai kontribusi modal pada program reward. Principal tetap tercatat terpisah dari reward pool dan dapat ditarik kembali dari kontrak.</p>

            <label className="mt-5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Jumlah stake KAM</label>
            <div className="mt-2 flex gap-3">
              <input value={stakeInput} onChange={(event) => setStakeInput(event.target.value)} inputMode="decimal" placeholder="0.0" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 text-sm font-bold text-white outline-none focus:border-sky-500" />
              <button onClick={() => execute('stake')} disabled={busy || state.paused || !CONTRACT_CONFIGURED} className="min-h-12 rounded-2xl bg-sky-600 px-5 text-sm font-black text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50">Stake</button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button onClick={() => execute('claim')} disabled={busy || state.paused || Number(state.earned) <= 0 || !CONTRACT_CONFIGURED} className="min-h-12 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 text-sm font-black text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50">Claim Reward</button>
              <button onClick={() => execute('withdraw')} disabled={busy || Number(state.staked) <= 0 || !CONTRACT_CONFIGURED} className="min-h-12 rounded-2xl border border-slate-700 px-5 text-sm font-black text-slate-200 hover:border-slate-600 disabled:opacity-50">Tarik Semua Stake</button>
            </div>
          </div>

          <div className="ka-command-panel overflow-hidden p-0">
            {[
              ['Status', contractStatus],
              ['Network', onCorrectChain ? 'KAM · Chain ID 22028' : 'Hubungkan ke KAM Network'],
              ['Reward pool', `${fmt(state.rewardPool)} KAM`],
              ['Reward / detik', `${fmt(state.rewardRate, 8)} KAM`],
              ['Program selesai', programEnd],
              ['Contract', CONTRACT_CONFIGURED ? shorten(CONTRACT_ADDRESS) : 'Belum ditetapkan'],
            ].map(([label, value]) => <div key={label} className="border-b border-slate-800/80 px-5 py-4 last:border-b-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</p><p className="mt-1 text-sm font-semibold text-slate-200">{value}</p></div>)}
          </div>
        </section>

        {message && <section className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-xs leading-5 text-sky-100">{message}</section>}

        <section className="ka-command-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-black">Verifikasi on-chain</p><p className="mt-1 text-xs text-slate-500">Semua stake, withdraw, claim, dan funding reward dapat diverifikasi melalui KAM Explorer setelah deployment.</p></div>
          <a href={CONTRACT_CONFIGURED ? `${NETWORK.blockExplorerUrls[0]}/address/${CONTRACT_ADDRESS}` : NETWORK.blockExplorerUrls[0]} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 text-sm font-black text-sky-200"><ExternalLink className="h-4 w-4" /> Open Explorer</a>
        </section>

        <p className="px-1 text-[10px] leading-relaxed text-slate-600">KAM Mining v1 adalah program distribusi reward berbasis staking, bukan penambangan Proof-of-Work. Reward tidak dijamin sebagai hasil investasi dan hanya dapat dibayarkan dari pool KAM yang benar-benar tersedia di kontrak. Lakukan audit kontrak dan deployment bertahap sebelum aktivasi publik.</p>
      </div>
    </main>
  );
}

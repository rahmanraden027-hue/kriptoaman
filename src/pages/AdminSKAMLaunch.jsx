import { useMemo, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519';
import { CheckCircle2, CircleAlert, ExternalLink, Loader2, ShieldCheck, WalletCards } from 'lucide-react';

const APPROVED_WALLET = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const MIN_PLANNED_SOL = 0.44;
const LIQUIDITY_SOL = 0.2;
const POOL_TOKEN_AMOUNT = 1_000_000;
const TOTAL_SUPPLY = 1_000_000_000;
const WSOL_MINT = 'So11111111111111111111111111111111111111112';

function phantomProvider() {
  if (typeof window === 'undefined') return null;
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

function compact(value) {
  if (!value) return '—';
  return `${value.slice(0, 7)}…${value.slice(-6)}`;
}

export default function AdminSKAMLaunch() {
  const phantom = useMemo(() => phantomProvider(), []);
  const connection = useMemo(() => new Connection(RPC_URL, 'confirmed'), []);
  const [address, setAddress] = useState('');
  const [solBalance, setSolBalance] = useState(null);
  const [proofVerified, setProofVerified] = useState(false);
  const [metadataReady, setMetadataReady] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const addressMatches = address === APPROVED_WALLET;
  const balanceReady = typeof solBalance === 'number' && solBalance >= MIN_PLANNED_SOL;
  const launchGateReady = addressMatches && balanceReady && proofVerified && metadataReady;

  async function refreshPublicState(publicKeyText = address) {
    if (!publicKeyText) return;
    const lamports = await connection.getBalance(new PublicKey(publicKeyText), 'confirmed');
    setSolBalance(lamports / 1e9);
  }

  async function connectWallet() {
    setBusy('connect');
    setError('');
    setProofVerified(false);
    try {
      if (!phantom) throw new Error('Phantom provider tidak ditemukan. Buka halaman ini melalui browser Phantom atau ekstensi Phantom.');
      const response = await phantom.connect();
      const nextAddress = response.publicKey.toString();
      setAddress(nextAddress);
      await refreshPublicState(nextAddress);
    } catch (err) {
      setError(err?.message || 'Gagal menghubungkan Phantom.');
    } finally {
      setBusy('');
    }
  }

  async function verifyMetadata() {
    setBusy('metadata');
    setError('');
    try {
      const response = await fetch('/token/skam.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Metadata sKAM HTTP ${response.status}`);
      const metadata = await response.json();
      if (metadata?.name !== 'Solana KAM' || metadata?.symbol !== 'sKAM') throw new Error('Identitas metadata sKAM tidak cocok.');
      if (metadata?.image !== 'https://kriptoaman.com/token/skam-logo.png') throw new Error('URI logo sKAM tidak cocok dengan konfigurasi resmi.');
      const imageResponse = await fetch('/token/skam-logo.png', { method: 'HEAD', cache: 'no-store' });
      if (!imageResponse.ok) throw new Error(`Logo sKAM HTTP ${imageResponse.status}`);
      setMetadataReady(true);
    } catch (err) {
      setMetadataReady(false);
      setError(err?.message || 'Metadata/logo sKAM belum siap.');
    } finally {
      setBusy('');
    }
  }

  async function proveWalletControl() {
    setBusy('proof');
    setError('');
    setProofVerified(false);
    try {
      if (!phantom || !addressMatches) throw new Error('Hubungkan wallet operator yang disetujui terlebih dahulu.');
      if (typeof phantom.signMessage !== 'function') throw new Error('Provider Phantom ini tidak menyediakan signMessage.');
      const challenge = [
        'KriptoAman sKAM operator authorization',
        `wallet=${APPROVED_WALLET}`,
        `supply=${TOTAL_SUPPLY}`,
        `pool=${POOL_TOKEN_AMOUNT} sKAM + ${LIQUIDITY_SOL} SOL`,
        `nonce=${crypto.randomUUID()}`,
        'This signature proves wallet control only. It is NOT an on-chain transaction.',
      ].join('\n');
      const message = new TextEncoder().encode(challenge);
      const signed = await phantom.signMessage(message, 'utf8');
      const signature = signed?.signature || signed;
      const valid = ed25519.verify(signature, message, new PublicKey(address).toBytes());
      if (!valid) throw new Error('Signature wallet tidak dapat diverifikasi.');
      setProofVerified(true);
      await refreshPublicState(address);
    } catch (err) {
      setError(err?.message || 'Verifikasi kontrol wallet gagal.');
    } finally {
      setBusy('');
    }
  }

  const checks = [
    ['Alamat operator', addressMatches, address ? compact(address) : 'Belum terhubung'],
    ['Saldo minimum perencanaan', balanceReady, solBalance == null ? 'Belum dibaca' : `${solBalance.toFixed(6)} SOL`],
    ['Bukti kontrol Phantom', proofVerified, proofVerified ? 'Signature tervalidasi' : 'Belum diverifikasi'],
    ['Metadata + logo resmi', metadataReady, metadataReady ? 'Tersedia' : 'Belum diverifikasi'],
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img src="/token/skam-logo.png" alt="sKAM" className="h-24 w-24 rounded-full border border-cyan-400/20 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Admin · Solana Launch Gate</p>
              <h1 className="mt-2 text-3xl font-black">Solana KAM · sKAM</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Gate ini memverifikasi wallet, saldo, metadata, dan bukti kontrol Phantom. Halaman ini tidak membuat mint, pool, swap, atau transaksi on-chain.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total supply', '1,000,000,000 sKAM'],
            ['Canary token', '1,000,000 sKAM'],
            ['Liquidity', '0.20 SOL'],
            ['Reserve ratio', '0.0000002 SOL / sKAM'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-black text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-violet-300" /><h2 className="font-black">Phantom operator verification</h2></div>
          <p className="mt-2 break-all text-xs text-slate-500">Approved wallet: {APPROVED_WALLET}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={connectWallet} disabled={Boolean(busy)} className="min-h-11 rounded-xl bg-violet-600 px-4 text-sm font-bold hover:bg-violet-500 disabled:opacity-50">{busy === 'connect' ? 'Menghubungkan…' : 'Hubungkan Phantom'}</button>
            <button type="button" onClick={verifyMetadata} disabled={Boolean(busy)} className="min-h-11 rounded-xl border border-cyan-500/40 px-4 text-sm font-bold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50">{busy === 'metadata' ? 'Memeriksa…' : 'Verifikasi metadata/logo'}</button>
            <button type="button" onClick={proveWalletControl} disabled={Boolean(busy) || !addressMatches} className="min-h-11 rounded-xl border border-emerald-500/40 px-4 text-sm font-bold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40">{busy === 'proof' ? 'Menunggu signature…' : 'Buktikan kontrol wallet'}</button>
          </div>
          {busy && <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Proses verifikasi berjalan.</div>}
          {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="font-black">Launch checks</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {checks.map(([label, ok, detail]) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />}
                <div><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className={`rounded-3xl border p-5 ${launchGateReady ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/25 bg-amber-500/8'}`}>
          <div className="flex items-start gap-3"><ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${launchGateReady ? 'text-emerald-300' : 'text-amber-300'}`} /><div><h2 className="font-black">{launchGateReady ? 'Signing gate READY' : 'Signing gate HOLD'}</h2><p className="mt-1 text-sm leading-6 text-slate-300">{launchGateReady ? 'Identitas wallet, saldo minimum, metadata, dan bukti kontrol telah lolos. Transaksi nyata tetap membutuhkan langkah terpisah dan persetujuan wallet untuk setiap operasi.' : 'Tidak ada transaksi yang dapat dilanjutkan dari halaman ini sampai seluruh pemeriksaan di atas lolos.'}</p></div></div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-500">
          <p>Canonical WSOL: <span className="break-all text-slate-300">{WSOL_MINT}</span></p>
          <p className="mt-1">Metadata: <a className="inline-flex items-center gap-1 text-cyan-300 hover:underline" href="/token/skam.json" target="_blank" rel="noreferrer">/token/skam.json <ExternalLink className="h-3 w-3" /></a></p>
          <p className="mt-2">Security boundary: no seed phrase, private key, transaction signing, sendTransaction, mint, pool creation, or swap is implemented by this page.</p>
        </section>
      </div>
    </main>
  );
}

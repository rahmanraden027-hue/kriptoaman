import { useEffect, useMemo, useState } from 'react';
import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '../lib/solana/skamSplInstructions.js';
import { ed25519 } from '@noble/curves/ed25519';
import { CheckCircle2, CircleAlert, ExternalLink, Loader2, ShieldCheck, WalletCards } from 'lucide-react';

const APPROVED_WALLET = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const MIN_PLANNED_SOL = 0.44;
const LIQUIDITY_SOL = 0.2;
const POOL_TOKEN_AMOUNT = 1_000_000;
const TOTAL_SUPPLY = 1_000_000_000;
const MINT_DECIMALS = 9;
const TOTAL_SUPPLY_BASE_UNITS = 1_000_000_000_000_000_000n;
const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const PENDING_MINT_KEY = 'skam_pending_mint_address';
const PENDING_SIGNATURE_KEY = 'skam_pending_mint_signature';
const VERIFIED_MINT_KEY = 'skam_verified_mint_address';

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AdminSKAMLaunch() {
  const phantom = useMemo(() => phantomProvider(), []);
  const [address, setAddress] = useState('');
  const [solBalance, setSolBalance] = useState(null);
  const [proofVerified, setProofVerified] = useState(false);
  const [metadataReady, setMetadataReady] = useState(false);
  const [mintAddress, setMintAddress] = useState('');
  const [mintSignature, setMintSignature] = useState('');
  const [mintVerified, setMintVerified] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedMint = sessionStorage.getItem(VERIFIED_MINT_KEY) || sessionStorage.getItem(PENDING_MINT_KEY) || '';
    const storedSignature = sessionStorage.getItem(PENDING_SIGNATURE_KEY) || '';
    if (storedMint) setMintAddress(storedMint);
    if (storedSignature) setMintSignature(storedSignature);
    if (sessionStorage.getItem(VERIFIED_MINT_KEY)) setMintVerified(true);
  }, []);

  const addressMatches = address === APPROVED_WALLET;
  const balanceReady = typeof solBalance === 'number' && solBalance >= MIN_PLANNED_SOL;
  const launchGateReady = addressMatches && balanceReady && proofVerified && metadataReady;

  async function refreshPublicState(publicKeyText = address) {
    if (!publicKeyText || publicKeyText !== APPROVED_WALLET) {
      setSolBalance(null);
      return;
    }

    const response = await fetch('/api/solana/skam-readiness', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || `Readiness HTTP ${response.status}`);
    if (payload?.owner !== APPROVED_WALLET) throw new Error('Alamat readiness server tidak cocok dengan wallet operator.');
    if (!Number.isFinite(payload?.balanceSol) || payload.balanceSol < 0) throw new Error('Saldo Solana dari server tidak valid.');
    setSolBalance(payload.balanceSol);
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
      if (nextAddress !== APPROVED_WALLET) {
        setSolBalance(null);
        throw new Error('Wallet Phantom yang terhubung bukan wallet operator sKAM yang disetujui.');
      }
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
        `decimals=${MINT_DECIMALS}`,
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

  async function verifyMintOnChain(nextMint, nextSignature, attempts = 8) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const params = new URLSearchParams({ mint: nextMint, signature: nextSignature });
      const response = await fetch(`/api/solana/skam-mint-verify?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.verified === true) return payload;
      if (response.status !== 202) throw new Error(payload?.error || `Mint verify HTTP ${response.status}`);
      await sleep(1500);
    }
    throw new Error('Transaksi sudah dikirim tetapi verifikasi on-chain masih menunggu konfirmasi. Gunakan tombol verifikasi ulang.');
  }

  async function mintSkam() {
    setBusy('mint');
    setError('');
    try {
      if (!launchGateReady) throw new Error('Signing gate harus READY sebelum mint.');
      if (!phantom || !addressMatches) throw new Error('Phantom operator belum terhubung.');
      if (typeof phantom.signAndSendTransaction !== 'function') throw new Error('Provider Phantom ini tidak menyediakan signAndSendTransaction.');
      if (mintVerified) throw new Error('Mint sKAM sudah terverifikasi. Tidak boleh membuat mint kedua.');

      const prepResponse = await fetch('/api/solana/skam-mint-prep', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const prep = await prepResponse.json().catch(() => null);
      if (!prepResponse.ok) throw new Error(prep?.error || `Mint prep HTTP ${prepResponse.status}`);
      if (prep?.owner !== APPROVED_WALLET || prep?.decimals !== MINT_DECIMALS) throw new Error('Mint prep tidak cocok dengan kebijakan sKAM.');
      if (String(prep?.totalSupplyBaseUnits) !== TOTAL_SUPPLY_BASE_UNITS.toString()) throw new Error('Supply mint prep tidak cocok.');
      if (Number(prep?.mintSize) !== MINT_SIZE || !Number.isInteger(prep?.mintRentLamports) || prep.mintRentLamports <= 0) throw new Error('Data rent mint tidak valid.');
      if (!Number.isFinite(prep?.balanceSol) || prep.balanceSol < MIN_PLANNED_SOL) throw new Error('Saldo SOL tidak lagi memenuhi minimum launch.');

      const owner = new PublicKey(APPROVED_WALLET);
      const mintKeypair = Keypair.generate();
      const nextMint = mintKeypair.publicKey.toBase58();
      const associatedToken = getAssociatedTokenAddressSync(mintKeypair.publicKey, owner);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(PENDING_MINT_KEY, nextMint);
        sessionStorage.removeItem(PENDING_SIGNATURE_KEY);
      }
      setMintAddress(nextMint);
      setMintSignature('');

      const transaction = new Transaction({
        feePayer: owner,
        blockhash: prep.blockhash,
        lastValidBlockHeight: prep.lastValidBlockHeight,
      }).add(
        SystemProgram.createAccount({
          fromPubkey: owner,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports: prep.mintRentLamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMint2Instruction(
          mintKeypair.publicKey,
          MINT_DECIMALS,
          owner,
          owner,
        ),
        createAssociatedTokenAccountInstruction(
          owner,
          associatedToken,
          owner,
          mintKeypair.publicKey,
        ),
        createMintToCheckedInstruction(
          mintKeypair.publicKey,
          associatedToken,
          owner,
          TOTAL_SUPPLY_BASE_UNITS,
          MINT_DECIMALS,
        ),
      );

      transaction.partialSign(mintKeypair);
      const submitted = await phantom.signAndSendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      const nextSignature = typeof submitted === 'string' ? submitted : submitted?.signature;
      if (!nextSignature) throw new Error('Phantom tidak mengembalikan transaction signature.');

      setMintSignature(nextSignature);
      if (typeof window !== 'undefined') sessionStorage.setItem(PENDING_SIGNATURE_KEY, nextSignature);

      const verified = await verifyMintOnChain(nextMint, nextSignature);
      if (!verified?.verified) throw new Error('Mint belum terverifikasi.');
      setMintVerified(true);
      setSolBalance(prep.balanceSol);
      if (typeof window !== 'undefined') sessionStorage.setItem(VERIFIED_MINT_KEY, nextMint);
    } catch (err) {
      setError(err?.message || 'Transaksi mint sKAM gagal.');
    } finally {
      setBusy('');
    }
  }

  async function reverifyStoredMint() {
    setBusy('mint-verify');
    setError('');
    try {
      if (!mintAddress || !mintSignature) throw new Error('Mint address/signature belum tersedia untuk verifikasi ulang.');
      const verified = await verifyMintOnChain(mintAddress, mintSignature, 4);
      if (!verified?.verified) throw new Error('Mint belum terverifikasi.');
      setMintVerified(true);
      if (typeof window !== 'undefined') sessionStorage.setItem(VERIFIED_MINT_KEY, mintAddress);
    } catch (err) {
      setError(err?.message || 'Verifikasi ulang mint gagal.');
    } finally {
      setBusy('');
    }
  }

  const checks = [
    ['Alamat operator', addressMatches, address ? compact(address) : 'Belum terhubung'],
    ['Saldo minimum perencanaan', balanceReady, solBalance == null ? 'Belum dibaca' : `${solBalance.toFixed(6)} SOL`],
    ['Bukti kontrol Phantom', proofVerified, proofVerified ? 'Signature tervalidasi' : 'Belum diverifikasi'],
    ['Metadata source + logo', metadataReady, metadataReady ? 'Tersedia' : 'Belum diverifikasi'],
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
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Gate ini memverifikasi wallet, saldo, metadata source, dan bukti kontrol Phantom. Setelah seluruh gate lolos, mint SPL standar dapat dibuat hanya melalui persetujuan transaksi eksplisit di Phantom.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total supply', '1,000,000,000 sKAM'],
            ['Decimals', '9'],
            ['Canary token', '1,000,000 sKAM'],
            ['Liquidity', '0.20 SOL'],
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
          {busy && !busy.startsWith('mint') && <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Proses verifikasi berjalan.</div>}
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
          <div className="flex items-start gap-3"><ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${launchGateReady ? 'text-emerald-300' : 'text-amber-300'}`} /><div><h2 className="font-black">{launchGateReady ? 'Signing gate READY' : 'Signing gate HOLD'}</h2><p className="mt-1 text-sm leading-6 text-slate-300">{launchGateReady ? 'Identitas wallet, saldo minimum, metadata source, dan bukti kontrol telah lolos. Mint tetap membutuhkan konfirmasi transaksi terpisah di Phantom.' : 'Transaksi mint tidak dapat dilanjutkan sampai seluruh pemeriksaan di atas lolos.'}</p></div></div>
        </section>

        <section className="rounded-3xl border border-violet-500/25 bg-violet-500/5 p-5">
          <h2 className="font-black">Tahap 1 · Mint SPL sKAM</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Transaksi ini membuat satu mint SPL standar, membuat token account milik wallet operator, lalu mencetak tepat 1.000.000.000 sKAM dengan 9 decimals. Mint authority dan freeze authority masih tetap pada wallet operator sampai metadata on-chain selesai dan transaksi revoke terpisah diverifikasi.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={mintSkam} disabled={Boolean(busy) || !launchGateReady || mintVerified} className="min-h-11 rounded-xl bg-violet-600 px-4 text-sm font-black hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40">{busy === 'mint' ? 'Menunggu Phantom…' : mintVerified ? 'Mint sKAM terverifikasi' : 'Mint 1.000.000.000 sKAM'}</button>
            {mintAddress && mintSignature && !mintVerified && <button type="button" onClick={reverifyStoredMint} disabled={Boolean(busy)} className="min-h-11 rounded-xl border border-cyan-500/40 px-4 text-sm font-bold text-cyan-200 disabled:opacity-40">{busy === 'mint-verify' ? 'Memverifikasi…' : 'Verifikasi ulang mint'}</button>}
          </div>
          {busy?.startsWith('mint') && <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Jangan tutup halaman sampai Phantom mengembalikan hasil transaksi.</div>}
          {mintAddress && <p className="mt-4 break-all text-xs text-slate-400">Mint candidate: <span className="text-white">{mintAddress}</span></p>}
          {mintSignature && <p className="mt-2 break-all text-xs text-slate-400">Transaction: <a className="text-cyan-300 hover:underline" href={`https://solscan.io/tx/${mintSignature}`} target="_blank" rel="noreferrer">{mintSignature}</a></p>}
          {mintVerified && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">Mint sKAM terverifikasi on-chain: supply penuh berada pada wallet operator. Tahap berikutnya adalah metadata on-chain, lalu revoke mint/freeze authority.</div>}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-500">
          <p>Canonical WSOL: <span className="break-all text-slate-300">{WSOL_MINT}</span></p>
          <p className="mt-1">Metadata source: <a className="inline-flex items-center gap-1 text-cyan-300 hover:underline" href="/token/skam.json" target="_blank" rel="noreferrer">/token/skam.json <ExternalLink className="h-3 w-3" /></a></p>
          <p className="mt-2">Security boundary: seed phrase/private key Phantom tidak pernah diminta atau disimpan. Keypair mint baru hanya hidup sementara di memori untuk menandatangani pembuatan mint account; hanya mint address dan transaction signature yang boleh disimpan di sessionStorage.</p>
        </section>
      </div>
    </main>
  );
}

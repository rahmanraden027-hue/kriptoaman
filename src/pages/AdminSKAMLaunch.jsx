import { useEffect, useMemo, useState } from 'react';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519';
import { CheckCircle2, CircleAlert, ExternalLink, Loader2, ShieldCheck, WalletCards, Coins } from 'lucide-react';
import {
  SKAM_DECIMALS,
  SKAM_METADATA_URI,
  SKAM_NAME,
  SKAM_RAW_SUPPLY,
  SKAM_SUPPLY_UI,
  SKAM_SYMBOL,
  buildCreateMintTransaction,
  buildMintSupplyTransaction,
  mintRentSpace,
  verifySkamMintAccount,
} from '@/lib/skamToken2022Builder';

const APPROVED_WALLET = '5Fg4FVvyvSRLMapHdYVZzUCbhC8CWdENF77AfGPVAfpK';
const MIN_PLANNED_SOL = 0.44;
const LIQUIDITY_SOL = 0.2;
const POOL_TOKEN_AMOUNT = 1_000_000;
const TOTAL_SUPPLY = 1_000_000_000;
const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const RPC_URLS = ['https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'];
const MINT_STORAGE_KEY = 'ka_skam_mainnet_mint_v1';
const CREATE_TX_STORAGE_KEY = 'ka_skam_create_mint_tx_v1';
const SUPPLY_TX_STORAGE_KEY = 'ka_skam_supply_tx_v1';

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

function txSignature(result) {
  const value = result?.signature || result;
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) {
    // Phantom normally returns a base58 string. Reject byte-only responses rather than inventing an encoder here.
    throw new Error('Phantom mengembalikan signature byte yang tidak didukung oleh build ini.');
  }
  throw new Error('Phantom tidak mengembalikan transaction signature yang valid.');
}

async function firstWorkingConnection() {
  let lastError;
  for (const url of RPC_URLS) {
    try {
      const connection = new Connection(url, 'confirmed');
      await connection.getLatestBlockhash('confirmed');
      return connection;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Semua RPC Solana tidak tersedia.');
}

async function simulateLegacyTransaction(connection, transaction) {
  const encoded = transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'simulateTransaction',
      params: [encoded, { encoding: 'base64', commitment: 'confirmed', sigVerify: false, replaceRecentBlockhash: false }],
    }),
  });
  if (!response.ok) throw new Error(`Simulasi RPC HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.error) throw new Error(payload.error.message || 'Simulasi RPC gagal.');
  if (payload?.result?.value?.err) {
    const logs = payload?.result?.value?.logs?.slice(-5).join(' | ') || '';
    throw new Error(`Simulasi transaksi gagal: ${JSON.stringify(payload.result.value.err)}${logs ? ` · ${logs}` : ''}`);
  }
  return payload?.result?.value;
}

export default function AdminSKAMLaunch() {
  const phantom = useMemo(() => phantomProvider(), []);
  const [address, setAddress] = useState('');
  const [solBalance, setSolBalance] = useState(null);
  const [proofVerified, setProofVerified] = useState(false);
  const [metadataReady, setMetadataReady] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [createMintTx, setCreateMintTx] = useState('');
  const [supplyTx, setSupplyTx] = useState('');
  const [mintVerified, setMintVerified] = useState(false);

  useEffect(() => {
    try {
      setMintAddress(localStorage.getItem(MINT_STORAGE_KEY) || '');
      setCreateMintTx(localStorage.getItem(CREATE_TX_STORAGE_KEY) || '');
      setSupplyTx(localStorage.getItem(SUPPLY_TX_STORAGE_KEY) || '');
    } catch {
      // Public evidence persistence is optional; never persist private key material.
    }
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
      if (metadata?.name !== SKAM_NAME || metadata?.symbol !== SKAM_SYMBOL) throw new Error('Identitas metadata sKAM tidak cocok.');
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

  async function createRealMint() {
    setBusy('create-mint');
    setError('');
    setMintVerified(false);
    try {
      if (!launchGateReady) throw new Error('Signing gate belum READY.');
      if (mintAddress) throw new Error('Mint sKAM sudah tercatat di browser ini. Verifikasi mint tersebut; jangan membuat mint kedua.');
      if (!phantom?.signAndSendTransaction) throw new Error('Phantom provider tidak menyediakan signAndSendTransaction.');
      const owner = new PublicKey(address);
      const connection = await firstWorkingConnection();
      const mint = Keypair.generate();
      const rentLamports = await connection.getMinimumBalanceForRentExemption(mintRentSpace(), 'confirmed');
      const latest = await connection.getLatestBlockhash('confirmed');
      const transaction = await buildCreateMintTransaction({ owner, mint: mint.publicKey, lamports: rentLamports, blockhash: latest.blockhash });
      transaction.partialSign(mint);
      await simulateLegacyTransaction(connection, transaction);

      const result = await phantom.signAndSendTransaction(transaction);
      const signature = txSignature(result);
      await connection.confirmTransaction({ signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }, 'confirmed');
      const info = await connection.getAccountInfo(mint.publicKey, 'confirmed');
      if (!info) throw new Error('Transaksi terkonfirmasi tetapi mint account belum dapat dibaca. Jangan ulangi create; verifikasi signature terlebih dahulu.');

      const mintText = mint.publicKey.toBase58();
      setMintAddress(mintText);
      setCreateMintTx(signature);
      try {
        localStorage.setItem(MINT_STORAGE_KEY, mintText);
        localStorage.setItem(CREATE_TX_STORAGE_KEY, signature);
      } catch { /* public evidence only */ }
    } catch (err) {
      setError(err?.message || 'Pembuatan mint sKAM gagal.');
    } finally {
      setBusy('');
    }
  }

  async function mintInitialSupply() {
    setBusy('mint-supply');
    setError('');
    setMintVerified(false);
    try {
      if (!launchGateReady) throw new Error('Signing gate belum READY.');
      if (!mintAddress) throw new Error('Mint address belum tersedia.');
      if (supplyTx) throw new Error('Supply transaction sudah tercatat. Verifikasi on-chain; jangan mint ulang.');
      if (!phantom?.signAndSendTransaction) throw new Error('Phantom provider tidak menyediakan signAndSendTransaction.');
      const owner = new PublicKey(address);
      const mint = new PublicKey(mintAddress);
      const connection = await firstWorkingConnection();
      const before = await connection.getAccountInfo(mint, 'confirmed');
      if (!before) throw new Error('Mint account tidak ditemukan sebelum supply transaction.');
      const latest = await connection.getLatestBlockhash('confirmed');
      const { transaction } = buildMintSupplyTransaction({ owner, mint, blockhash: latest.blockhash });
      await simulateLegacyTransaction(connection, transaction);

      const result = await phantom.signAndSendTransaction(transaction);
      const signature = txSignature(result);
      await connection.confirmTransaction({ signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }, 'confirmed');
      setSupplyTx(signature);
      try { localStorage.setItem(SUPPLY_TX_STORAGE_KEY, signature); } catch { /* public evidence only */ }
      await verifyRealMint(mintAddress, signature);
    } catch (err) {
      setError(err?.message || 'Mint initial supply gagal.');
    } finally {
      setBusy('');
    }
  }

  async function verifyRealMint(target = mintAddress, knownSupplyTx = supplyTx) {
    setBusy('verify-mint');
    setError('');
    setMintVerified(false);
    try {
      if (!target) throw new Error('Mint address belum tersedia.');
      if (!knownSupplyTx) throw new Error('Supply transaction belum tersedia.');
      const connection = await firstWorkingConnection();
      const mint = new PublicKey(target);
      const accountInfo = await connection.getAccountInfo(mint, 'confirmed');
      verifySkamMintAccount(accountInfo, APPROVED_WALLET);
      setMintVerified(true);
      await refreshPublicState(APPROVED_WALLET);
    } catch (err) {
      setError(err?.message || 'Verifikasi mint on-chain gagal.');
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
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Admin · Solana Mainnet Launch</p>
              <h1 className="mt-2 text-3xl font-black">Solana KAM · sKAM</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Verifikasi operator dilakukan lebih dulu. Mint Token-2022 nyata tersedia sebagai dua operasi terpisah dan setiap transaksi memerlukan persetujuan eksplisit Phantom.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total supply', '1,000,000,000 sKAM'],
            ['Decimals', '9'],
            ['Canary liquidity', '1,000,000 sKAM + 0.20 SOL'],
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
          {busy && <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Proses berjalan. Tinjau prompt Phantom sebelum menyetujui.</div>}
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
          <div className="flex items-start gap-3"><ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${launchGateReady ? 'text-emerald-300' : 'text-amber-300'}`} /><div><h2 className="font-black">{launchGateReady ? 'Signing gate READY' : 'Signing gate HOLD'}</h2><p className="mt-1 text-sm leading-6 text-slate-300">{launchGateReady ? 'Identitas wallet, saldo minimum, metadata, dan bukti kontrol telah lolos. Operasi on-chain di bawah tetap memerlukan persetujuan Phantom satu per satu.' : 'Tidak ada transaksi yang dapat dilanjutkan sampai seluruh pemeriksaan di atas lolos.'}</p></div></div>
        </section>

        <section className="rounded-3xl border border-cyan-500/25 bg-slate-900/80 p-5">
          <div className="flex items-start gap-3">
            <Coins className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <div className="min-w-0 flex-1">
              <h2 className="font-black">Tahap 1 · Token-2022 sKAM mainnet</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Urutan fail-closed: simulasi → persetujuan Phantom → konfirmasi mint → persetujuan Phantom kedua untuk ATA + supply → verifikasi on-chain. Tidak ada pool atau swap pada tahap ini.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs leading-5 text-slate-400">
              <p><span className="text-slate-500">Name:</span> {SKAM_NAME}</p>
              <p><span className="text-slate-500">Symbol:</span> {SKAM_SYMBOL}</p>
              <p><span className="text-slate-500">Decimals:</span> {SKAM_DECIMALS}</p>
              <p><span className="text-slate-500">Supply:</span> {SKAM_SUPPLY_UI.toLocaleString()} sKAM</p>
              <p className="break-all"><span className="text-slate-500">Metadata:</span> {SKAM_METADATA_URI}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs leading-5 text-slate-400">
              <p><span className="text-slate-500">Mint:</span> <span className="break-all text-white">{mintAddress || 'Belum dibuat'}</span></p>
              <p><span className="text-slate-500">Create tx:</span> <span className="break-all text-white">{createMintTx || '—'}</span></p>
              <p><span className="text-slate-500">Supply tx:</span> <span className="break-all text-white">{supplyTx || '—'}</span></p>
              <p><span className="text-slate-500">Raw supply:</span> <span className="break-all text-white">{SKAM_RAW_SUPPLY.toString()}</span></p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={createRealMint} disabled={Boolean(busy) || !launchGateReady || Boolean(mintAddress)} className="min-h-12 rounded-xl bg-cyan-600 px-4 text-sm font-black hover:bg-cyan-500 disabled:opacity-40">{busy === 'create-mint' ? 'Simulasi / menunggu Phantom…' : '1. Buat mint sKAM nyata'}</button>
            <button type="button" onClick={mintInitialSupply} disabled={Boolean(busy) || !launchGateReady || !mintAddress || Boolean(supplyTx)} className="min-h-12 rounded-xl bg-emerald-600 px-4 text-sm font-black hover:bg-emerald-500 disabled:opacity-40">{busy === 'mint-supply' ? 'Simulasi / menunggu Phantom…' : '2. Mint supply 1B sKAM'}</button>
            <button type="button" onClick={() => verifyRealMint()} disabled={Boolean(busy) || !mintAddress || !supplyTx} className="min-h-12 rounded-xl border border-emerald-500/40 px-4 text-sm font-bold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-40">{busy === 'verify-mint' ? 'Memverifikasi…' : '3. Verifikasi mint on-chain'}</button>
          </div>

          {mintVerified && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-black">TOKEN-2022 MINT VERIFIED</p>
              <p className="mt-1 break-all">Mint: {mintAddress}</p>
              <p className="mt-1">Supply, decimals, mint authority, freeze authority, MetadataPointer, dan TokenMetadata cocok dengan konfigurasi sKAM.</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-slate-500">
          <p>Canonical WSOL: <span className="break-all text-slate-300">{WSOL_MINT}</span></p>
          <p className="mt-1">Metadata: <a className="inline-flex items-center gap-1 text-cyan-300 hover:underline" href="/token/skam.json" target="_blank" rel="noreferrer">/token/skam.json <ExternalLink className="h-3 w-3" /></a></p>
          <p className="mt-2">Security boundary: seed phrase/private key tidak pernah diminta atau disimpan. Mint key sementara dibuat di memori browser hanya untuk menandatangani pembuatan akun mint, lalu dibuang; semua otoritas sKAM berada pada wallet operator Phantom.</p>
          <p className="mt-1">Pool Raydium dan swap tetap terkunci sampai mint dan supply terverifikasi on-chain.</p>
        </section>
      </div>
    </main>
  );
}

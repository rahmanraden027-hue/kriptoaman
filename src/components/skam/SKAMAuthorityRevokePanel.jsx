import { useMemo, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, WalletCards } from 'lucide-react';
import {
  SKAM_MINT,
  SKAM_OPERATOR,
  buildSkamAuthorityRevocationTransaction,
  inspectSkamMintAccount,
} from '@/lib/skamAuthorityRevocationBuilder';

const RPC_URLS = ['https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'];

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
  if (typeof value !== 'string' || value.length < 32) throw new Error('Phantom tidak mengembalikan transaction signature yang valid.');
  return value;
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
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

async function simulateUnsignedTransaction(connection, transaction) {
  const serialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
  const response = await fetch(connection.rpcEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'simulateTransaction',
      params: [bytesToBase64(serialized), {
        encoding: 'base64',
        commitment: 'confirmed',
        sigVerify: false,
        replaceRecentBlockhash: false,
      }],
    }),
  });
  if (!response.ok) throw new Error(`Simulasi RPC HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.error) throw new Error(payload.error.message || 'Simulasi RPC gagal.');
  if (payload?.result?.value?.err) {
    const logs = payload?.result?.value?.logs?.slice(-8).join(' | ') || '';
    throw new Error(`Simulasi revoke gagal: ${JSON.stringify(payload.result.value.err)}${logs ? ` · ${logs}` : ''}`);
  }
  return payload?.result?.value;
}

export default function SKAMAuthorityRevokePanel() {
  const phantom = useMemo(() => phantomProvider(), []);
  const [address, setAddress] = useState('');
  const [state, setState] = useState(null);
  const [simulationOk, setSimulationOk] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');

  const addressMatches = address === SKAM_OPERATOR.toBase58();
  const alreadySecure = state?.mintAuthority === null && state?.freezeAuthority === null;
  const authorityStateSafe = state
    && (state.mintAuthority === null || state.mintAuthority === SKAM_OPERATOR.toBase58())
    && (state.freezeAuthority === null || state.freezeAuthority === SKAM_OPERATOR.toBase58());

  async function inspect(connection = null) {
    const rpc = connection || await firstWorkingConnection();
    const info = await rpc.getAccountInfo(SKAM_MINT, 'confirmed');
    const next = inspectSkamMintAccount(info);
    setState(next);
    return { rpc, state: next };
  }

  async function connectAndInspect() {
    setBusy('connect');
    setError('');
    setSimulationOk(false);
    try {
      if (!phantom) throw new Error('Phantom tidak ditemukan. Buka halaman ini melalui browser Phantom atau ekstensi Phantom.');
      const response = await phantom.connect();
      const nextAddress = response.publicKey.toString();
      setAddress(nextAddress);
      if (nextAddress !== SKAM_OPERATOR.toBase58()) {
        setState(null);
        throw new Error(`Wallet yang terhubung bukan Signer 1 sKAM. Harus ${SKAM_OPERATOR.toBase58()}.`);
      }
      await inspect();
    } catch (err) {
      setError(err?.message || 'Gagal memeriksa wallet/authority sKAM.');
    } finally {
      setBusy('');
    }
  }

  async function simulateRevocation() {
    setBusy('simulate');
    setError('');
    setSimulationOk(false);
    try {
      if (!addressMatches) throw new Error('Hubungkan Signer 1 Phantom terlebih dahulu.');
      const { rpc, state: current } = await inspect();
      if (current.mintAuthority === null && current.freezeAuthority === null) {
        setSimulationOk(true);
        return;
      }
      const latest = await rpc.getLatestBlockhash('confirmed');
      const tx = buildSkamAuthorityRevocationTransaction({
        owner: new PublicKey(address),
        blockhash: latest.blockhash,
        revokeMint: current.mintAuthority !== null,
        revokeFreeze: current.freezeAuthority !== null,
      });
      await simulateUnsignedTransaction(rpc, tx);
      setSimulationOk(true);
    } catch (err) {
      setError(err?.message || 'Simulasi revoke authority gagal.');
    } finally {
      setBusy('');
    }
  }

  async function executeRevocation() {
    setBusy('revoke');
    setError('');
    setSignature('');
    let submittedTxid = '';
    try {
      if (!phantom?.signAndSendTransaction) throw new Error('Phantom tidak menyediakan signAndSendTransaction.');
      if (!addressMatches || !authorityStateSafe || !simulationOk) {
        throw new Error('Gate keamanan belum lengkap. Hubungkan Signer 1 dan jalankan simulasi terlebih dahulu.');
      }

      const { rpc, state: current } = await inspect();
      if (current.mintAuthority === null && current.freezeAuthority === null) return;

      const revokeMint = current.mintAuthority !== null;
      const revokeFreeze = current.freezeAuthority !== null;
      const previewLatest = await rpc.getLatestBlockhash('confirmed');
      const previewTx = buildSkamAuthorityRevocationTransaction({
        owner: new PublicKey(address),
        blockhash: previewLatest.blockhash,
        revokeMint,
        revokeFreeze,
      });
      await simulateUnsignedTransaction(rpc, previewTx);

      const approved = window.confirm([
        'TINDAKAN PERMANEN · SOLANA MAINNET',
        '',
        `sKAM Mint: ${SKAM_MINT.toBase58()}`,
        `Signer: ${SKAM_OPERATOR.toBase58()}`,
        `Revoke Mint Authority: ${revokeMint ? 'YA' : 'sudah NULL'}`,
        `Revoke Freeze Authority: ${revokeFreeze ? 'YA' : 'sudah NULL'}`,
        '',
        'Setelah dicabut, authority ini tidak dapat dipulihkan.',
        'Supply sKAM tetap 1.000.000.000 dan token yang sudah ada tidak dihapus.',
        '',
        'Pilih OK hanya jika Anda memang menyetujui pencabutan permanen.',
      ].join('\n'));
      if (!approved) throw new Error('Pencabutan authority dibatalkan sebelum persetujuan Phantom.');

      // Re-read live authority state after the human confirmation, then fetch a fresh
      // blockhash immediately before opening Phantom. This keeps the signing window
      // as large as possible and prevents stale-preview blockhash expiry.
      const refreshed = await inspect(rpc);
      if (refreshed.state.mintAuthority === null && refreshed.state.freezeAuthority === null) return;

      const freshRevokeMint = refreshed.state.mintAuthority !== null;
      const freshRevokeFreeze = refreshed.state.freezeAuthority !== null;
      const freshLatest = await rpc.getLatestBlockhash('confirmed');
      const freshTx = buildSkamAuthorityRevocationTransaction({
        owner: new PublicKey(address),
        blockhash: freshLatest.blockhash,
        revokeMint: freshRevokeMint,
        revokeFreeze: freshRevokeFreeze,
      });
      await simulateUnsignedTransaction(rpc, freshTx);

      const result = await phantom.signAndSendTransaction(freshTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      submittedTxid = txSignature(result);

      try {
        await rpc.confirmTransaction({
          signature: submittedTxid,
          blockhash: freshLatest.blockhash,
          lastValidBlockHeight: freshLatest.lastValidBlockHeight,
        }, 'confirmed');
      } catch (confirmError) {
        // Confirmation RPC can time out or report blockheight expiry even when the
        // transaction landed. Never submit a second transaction before re-reading
        // the authority state from chain.
        const observed = await inspect(rpc);
        if (observed.state.mintAuthority === null && observed.state.freezeAuthority === null) {
          setSignature(submittedTxid);
          setSimulationOk(true);
          return;
        }
        throw new Error(`${confirmError?.message || 'Konfirmasi transaksi tidak selesai.'} Authority masih aktif saat dibaca ulang; transaksi tidak dianggap berhasil.`);
      }

      const verified = await inspect(rpc);
      if (verified.state.mintAuthority !== null || verified.state.freezeAuthority !== null) {
        throw new Error(`Verifikasi pascatransaksi gagal: mint=${verified.state.mintAuthority}, freeze=${verified.state.freezeAuthority}.`);
      }
      setSignature(submittedTxid);
      setSimulationOk(true);
    } catch (err) {
      if (submittedTxid) {
        try {
          const observed = await inspect();
          if (observed.state.mintAuthority === null && observed.state.freezeAuthority === null) {
            setSignature(submittedTxid);
            setSimulationOk(true);
            setError('');
            return;
          }
        } catch {
          // Preserve the original error below; the operator can safely re-inspect.
        }
        setSimulationOk(false);
        setError(`${err?.message || 'Konfirmasi transaksi tidak selesai.'} Signature: ${submittedTxid}. Tekan “Hubungkan Signer 1 & Periksa” sebelum mencoba lagi.`);
      } else {
        setError(err?.message || 'Pencabutan authority gagal atau dibatalkan.');
      }
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="mx-auto mb-5 max-w-5xl rounded-3xl border border-amber-400/25 bg-slate-900/90 p-5 text-white shadow-2xl shadow-amber-950/20 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10">
          <ShieldCheck className="h-6 w-6 text-amber-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Final Security · sKAM Mainnet</p>
          <h2 className="mt-1 text-xl font-black sm:text-2xl">Revoke Mint & Freeze Authority via Phantom</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Flow ini hanya menerima Signer 1 resmi, memeriksa mint/supply/authority live, mensimulasikan transaksi, lalu meminta satu persetujuan Phantom. Pencabutan bersifat permanen.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
          <div className="text-slate-400">Wallet</div>
          <div className="mt-1 break-all font-mono text-xs text-white">{address ? compact(address) : 'Belum terhubung'}</div>
          <div className={`mt-2 font-semibold ${addressMatches ? 'text-emerald-300' : 'text-slate-500'}`}>{addressMatches ? '✓ Signer 1 cocok' : 'Menunggu Signer 1'}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
          <div className="text-slate-400">Mint sKAM</div>
          <div className="mt-1 break-all font-mono text-xs text-white">{compact(SKAM_MINT.toBase58())}</div>
          <div className="mt-2 text-slate-300">Supply tetap 1.000.000.000 · 9 decimals</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
          <div className="text-slate-400">Mint Authority</div>
          <div className={`mt-1 font-semibold ${state?.mintAuthority === null ? 'text-emerald-300' : 'text-rose-300'}`}>{state ? (state.mintAuthority === null ? 'NULL · SECURE' : compact(state.mintAuthority)) : 'Belum diperiksa'}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
          <div className="text-slate-400">Freeze Authority</div>
          <div className={`mt-1 font-semibold ${state?.freezeAuthority === null ? 'text-emerald-300' : 'text-rose-300'}`}>{state ? (state.freezeAuthority === null ? 'NULL · SECURE' : compact(state.freezeAuthority)) : 'Belum diperiksa'}</div>
        </div>
      </div>

      {alreadySecure && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div><strong>Authority sudah aman.</strong> Mint Authority dan Freeze Authority keduanya NULL.</div>
        </div>
      )}

      {!alreadySecure && state && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>Pencabutan authority tidak menghapus supply atau saldo sKAM, tetapi setelah final tidak ada pihak yang dapat mint supply tambahan atau membekukan token account melalui dua authority tersebut.</div>
        </div>
      )}

      {error && <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}
      {signature && <div className="mt-4 break-all rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-xs text-emerald-100"><strong>Transaction:</strong> {signature}</div>}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={connectAndInspect} disabled={Boolean(busy)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-700 px-5 text-sm font-black transition hover:bg-slate-600 disabled:opacity-50">
          {busy === 'connect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
          Hubungkan Signer 1 & Periksa
        </button>
        <button type="button" onClick={simulateRevocation} disabled={Boolean(busy) || !addressMatches || alreadySecure} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-black transition hover:bg-sky-500 disabled:opacity-50">
          {busy === 'simulate' && <Loader2 className="h-4 w-4 animate-spin" />}
          Simulasikan Revoke
        </button>
        <button type="button" onClick={executeRevocation} disabled={Boolean(busy) || !simulationOk || alreadySecure} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 text-sm font-black transition hover:bg-rose-500 disabled:opacity-50">
          {busy === 'revoke' && <Loader2 className="h-4 w-4 animate-spin" />}
          Revoke Permanen via Phantom
        </button>
      </div>
    </section>
  );
}

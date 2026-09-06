import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react';

/**
 * Production security gate for the historical browser-local self-custody wallet.
 *
 * KriptoAman's public release must not create, decrypt, sign with, copy, or
 * transmit locally stored seed phrases/private keys. The supported production
 * path is the external-wallet surface (/Wallet), where signing remains disabled
 * by the public release gate until an explicit reviewed release enables it.
 *
 * This page intentionally does NOT read or delete existing localStorage wallet
 * material. A user who previously used the experimental wallet keeps control of
 * their local browser data while the unsafe production surface stays closed.
 */
export default function MultiChainWallet() {
  return (
    <div className="ka-bg min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <div className="ka-surface overflow-hidden p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10">
              <ShieldCheck className="h-7 w-7 text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Controlled Security Gate</p>
              <h1 className="mt-1 text-xl font-black sm:text-2xl">Self-custody lokal dinonaktifkan pada rilis publik</h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                KriptoAman tidak membuat, menyimpan, membaca, atau menandatangani transaksi menggunakan seed phrase/private key lokal pada permukaan produksi ini. Gunakan koneksi wallet eksternal yang menjaga private key tetap berada di wallet atau hardware wallet milik Anda.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
              <LockKeyhole className="h-5 w-5 text-sky-300" />
              <h2 className="mt-3 text-sm font-bold">Private key tetap di luar KriptoAman</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Jangan pernah mengirim seed phrase, private key, recovery code, atau file keystore melalui chat, email, formulir, atau dukungan.</p>
            </div>
            <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
              <WalletCards className="h-5 w-5 text-sky-300" />
              <h2 className="mt-3 text-sm font-bold">External-wallet first</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">MetaMask/injected wallet, WalletConnect, Phantom, dan hardware wallet adalah jalur produksi yang diprioritaskan.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-5 text-amber-100/80">
            Jika sebelumnya Anda menggunakan wallet lokal eksperimental, halaman ini tidak menghapus data browser tersebut. Jangan reset browser atau menghapus penyimpanan lokal sebelum Anda memastikan sendiri bahwa recovery phrase telah disimpan secara aman.
          </div>

          <Link
            to="/Wallet"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 text-sm font-black text-white transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            Buka Wallet Eksternal Aman
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

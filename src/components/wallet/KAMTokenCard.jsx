import React from 'react';
import { ShieldCheck, Clock3 } from 'lucide-react';
import KriptoAmanLogo from '../brand/KriptoAmanLogo';

export default function KAMTokenCard({ userBalance = 0 }) {
  return (
    <section className="space-y-3" aria-labelledby="kam-token-title">
      <div className="overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-[#0a2540] via-[#0b3a68] to-[#8a5a12] p-5 text-white shadow-xl shadow-blue-950/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#06101d]/70">
              <KriptoAmanLogo size={48} showText={false} />
            </div>
            <div>
              <h2 id="kam-token-title" className="text-xl font-bold">KAM</h2>
              <p className="text-sm text-sky-100">KriptoAman Token</p>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
            Persiapan
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-black/15 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-100">Saldo Anda</p>
            <p className="mt-1 text-2xl font-bold">{Number(userBalance || 0).toLocaleString('id-ID')} KAM</p>
          </div>
          <div className="rounded-xl bg-black/15 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-100">Harga pasar</p>
            <p className="mt-1 text-lg font-bold">Belum tersedia</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-500/20 bg-[#0b1728] p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <div>
            <p className="font-semibold text-white">Data on-chain belum dipublikasikan</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Harga, supply, volume, kontrak, dan alamat deposit akan ditampilkan setelah diverifikasi dan diumumkan melalui kanal resmi KriptoAman.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-400/8 px-3 py-2 text-xs text-amber-200">
          <Clock3 className="h-4 w-4 shrink-0" />
          Jangan mengirim aset ke alamat yang belum diumumkan resmi.
        </div>
      </div>
    </section>
  );
}

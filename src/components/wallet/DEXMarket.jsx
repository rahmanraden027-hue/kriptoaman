import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DEXMarket() {
  return (
    <section className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-left">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-white">DEX belum tersedia</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Harga, order book, riwayat perdagangan, dan eksekusi swap dinonaktifkan sampai sumber data
            serta bukti transaksi on-chain dapat diverifikasi.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-300">UNAVAILABLE</p>
        </div>
      </div>
    </section>
  );
}

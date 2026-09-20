import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function PriceTracker() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 text-white">
      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold">Pelacak harga belum tersedia</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Grafik dan perubahan harga tidak ditampilkan ketika histori pasar terverifikasi belum tersedia.
              KriptoAman tidak menggantinya dengan data simulasi.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-300">UNAVAILABLE</p>
          </div>
        </div>
      </section>
    </main>
  );
}

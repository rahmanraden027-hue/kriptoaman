import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, Info } from 'lucide-react';

export default function SecuritySection() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white">Keamanan akun terverifikasi server</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Pengaturan 2FA dan sesi perangkat dikelola oleh Pusat Keamanan. Status hanya ditampilkan setelah diverifikasi oleh API autentikasi KriptoAman.
            </p>
          </div>
        </div>
        <Link
          to="/SecurityHub"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Buka Pusat Keamanan <ExternalLink className="h-4 w-4" />
        </Link>
      </section>

      <div className="flex items-start gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
        <p className="text-xs leading-relaxed text-blue-200">
          2FA simulasi, perangkat contoh, riwayat login buatan, dan penyimpanan secret 2FA di browser telah dinonaktifkan. Penonaktifan 2FA belum ditawarkan sampai endpoint server dengan verifikasi ulang tersedia.
        </p>
      </div>
    </div>
  );
}

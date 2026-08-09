import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import KriptoAmanLogo from '@/components/brand/KriptoAmanLogo';

export default function AccountDeletion() {
  return (
    <main className="min-h-screen bg-[#06101d] px-4 py-8 text-white">
      <div className="mx-auto max-w-xl space-y-5">
        <Link to="/" className="inline-flex"><KriptoAmanLogo size={38} showText /></Link>
        <section className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">Penghapusan akun KriptoAman</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">Pengguna dapat memulai penghapusan langsung dari aplikasi: <strong>Profil → Hapus Akun</strong>. Masuk ke akun agar kami dapat memverifikasi kepemilikan.</p>
          <Link to="/Profile" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold hover:bg-red-500">Masuk dan hapus akun</Link>
          <a href="mailto:privacy@kriptoaman.com?subject=Permintaan%20penghapusan%20akun%20KriptoAman" className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 text-sm font-semibold text-slate-200 hover:bg-slate-800">Tidak dapat masuk? Hubungi privasi <ExternalLink className="h-4 w-4" /></a>
        </section>
        <section className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4"><ShieldCheck className="mb-2 h-5 w-5 text-sky-400"/><strong>Data yang dihapus</strong><p className="mt-1 text-slate-400">Profil, preferensi, sesi, dan data akun yang tidak wajib dipertahankan.</p></div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4"><Clock className="mb-2 h-5 w-5 text-amber-400"/><strong>Waktu proses</strong><p className="mt-1 text-slate-400">Permintaan diverifikasi dan diselesaikan maksimal 30 hari.</p></div>
        </section>
        <p className="text-xs leading-relaxed text-slate-500">Catatan: catatan yang diwajibkan hukum dapat disimpan selama masa retensi yang berlaku. Data transaksi pada blockchain publik tidak dapat diubah atau dihapus oleh KriptoAman.</p>
        <div className="flex gap-4 text-xs"><Link className="text-sky-400" to="/PrivacyPolicy">Kebijakan Privasi</Link><Link className="text-sky-400" to="/TermsOfService">Syarat Layanan</Link></div>
      </div>
    </main>
  );
}

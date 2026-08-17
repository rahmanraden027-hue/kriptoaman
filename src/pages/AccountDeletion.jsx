import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShieldCheck, ExternalLink } from 'lucide-react';
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
          <p className="mt-2 text-sm leading-relaxed text-slate-300">Pengguna yang dapat masuk dapat menghapus akun langsung dari aplikasi melalui <strong>Profil/Pengaturan → Hapus Akun</strong>. Penghapusan memerlukan autentikasi akun dan konfirmasi eksplisit.</p>
          <Link to="/Settings" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold hover:bg-red-500">Masuk dan hapus akun</Link>
          <a href="mailto:privacy@kriptoaman.com?subject=Permintaan%20penghapusan%20akun%20KriptoAman" className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 text-sm font-semibold text-slate-200 hover:bg-slate-800">Tidak dapat masuk? Ajukan permintaan <ExternalLink className="h-4 w-4" /></a>
        </section>

        <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5 text-sm">
          <ShieldCheck className="mb-3 h-5 w-5 text-sky-400" />
          <h2 className="font-semibold">Apa yang dihapus</h2>
          <p className="mt-2 leading-relaxed text-slate-400">Penghapusan dalam aplikasi menghapus profil akun pada sistem autentikasi, sesi login, konfigurasi 2FA, persetujuan akun, challenge autentikasi terkait email, serta catatan saldo internal yang terhubung ke akun. Build publik tidak menerima dokumen KYC baru.</p>
          <p className="mt-3 leading-relaxed text-slate-400">Jika akun lama pernah mengirim data ke layanan verifikasi/penyimpanan pihak ketiga sebelum mode watch-only diberlakukan, hubungi <strong className="text-slate-200">privacy@kriptoaman.com</strong> agar data residual yang masih berlaku dapat ditelusuri dan dihapus sesuai kewajiban yang berlaku.</p>
        </section>

        <p className="text-xs leading-relaxed text-slate-500">Data yang wajib dipertahankan karena kewajiban hukum, keamanan, pencegahan penipuan, atau penyelesaian sengketa dapat disimpan secara terbatas sesuai tujuan tersebut. Data blockchain publik yang bukan dikendalikan KriptoAman tidak dapat dihapus dari jaringan publik.</p>
        <div className="flex gap-4 text-xs"><Link className="text-sky-400" to="/PrivacyPolicy">Kebijakan Privasi</Link><Link className="text-sky-400" to="/TermsOfService">Syarat Layanan</Link></div>
      </div>
    </main>
  );
}

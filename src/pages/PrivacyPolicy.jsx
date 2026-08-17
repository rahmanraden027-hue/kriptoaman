import React from 'react';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import { ArrowLeft, Lock, Shield, Trash2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

function Section({ title, children }) {
  return <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5"><h2 className="text-white font-bold mb-3">{title}</h2><div className="text-sm leading-relaxed text-slate-300 space-y-2">{children}</div></section>;
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 pt-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Link to={createPageUrl('Settings')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"><ArrowLeft className="w-4 h-4 text-slate-300" /></Link>
          <KriptoAmanLogo size={36} showText textSize="text-base" />
        </div>

        <header className="pb-3">
          <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30"><Lock className="w-5 h-5 text-indigo-400" /></div><h1 className="text-2xl font-bold">Kebijakan Privasi</h1></div>
          <p className="text-slate-400 text-sm mt-2">PT Kripto Aman Indonesia · Terakhir diperbarui: 17 Agustus 2026</p>
          <p className="text-slate-300 text-sm mt-3">KriptoAman versi publik adalah platform pemantauan dan market intelligence. Versi publik bukan kustodian dan tidak mengeksekusi deposit, penarikan, swap, lending, staking, atau perdagangan aset.</p>
        </header>

        <Section title="1. Data yang dikumpulkan">
          <p>Untuk membuat dan mengamankan akun, kami dapat memproses alamat email, nama/profil yang Anda isi, password dalam bentuk hash satu arah, status verifikasi email, preferensi, serta metadata sesi.</p>
          <p>Untuk keamanan sesi, kami dapat memproses user-agent/browser dan sistem operasi, waktu aktivitas, alamat IP dalam bentuk hash dan tampilan tersamarkan, serta perkiraan negara/kota hanya bila disediakan oleh infrastruktur jaringan.</p>
          <p>Jika Anda mengaktifkan 2FA, secret TOTP disimpan dalam bentuk terenkripsi di server dan backup code disimpan sebagai hash. KriptoAman tidak meminta seed phrase atau private key.</p>
          <p>Alamat dompet publik yang Anda hubungkan dapat diproses untuk fungsi watch-only dan pemantauan portofolio. Build publik saat ini tidak menerima foto identitas, selfie, atau nomor identitas baru melalui halaman KYC.</p>
        </Section>

        <Section title="2. Tujuan penggunaan">
          <p>Data digunakan untuk autentikasi, keamanan akun, pemeliharaan sesi, menjalankan fitur yang diminta pengguna, menampilkan data pemantauan, dukungan, pencegahan penyalahgunaan, serta peningkatan keandalan layanan.</p>
          <p>Kami tidak menjual informasi pribadi pengguna.</p>
        </Section>

        <Section title="3. Penyedia dan transfer data">
          <p>KriptoAman menggunakan infrastruktur hosting, database, RPC/blockchain, serta penyedia data pasar yang diperlukan untuk menjalankan layanan. Permintaan jaringan ke penyedia tersebut dapat membawa metadata teknis standar seperti alamat IP sesuai cara kerja internet.</p>
          <p>Credential autentikasi, secret TOTP, seed phrase, dan private key tidak dibagikan kepada penyedia data pasar.</p>
        </Section>

        <Section title="4. Keamanan">
          <div className="flex gap-2"><Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/><p>Kontrol yang digunakan antara lain HTTPS/TLS, cookie sesi HttpOnly/Secure/SameSite, hashing password, rate limiting, OTP/token dengan masa berlaku, session registry server-side, serta enkripsi secret 2FA.</p></div>
          <p>Tidak ada sistem yang dapat menjamin keamanan absolut; kami membatasi klaim hanya pada kontrol yang benar-benar tersedia.</p>
        </Section>

        <Section title="5. Penghapusan akun dan retensi">
          <div className="flex gap-2"><Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/><p>Pengguna dapat menghapus akun langsung melalui <strong>Profil/Pengaturan → Hapus Akun</strong> atau menggunakan halaman publik <Link className="text-indigo-400" to={createPageUrl('AccountDeletion')}>Penghapusan Akun</Link>.</p></div>
          <p>Penghapusan dalam aplikasi menghapus data akun pada sistem autentikasi, sesi login, 2FA, persetujuan akun, challenge autentikasi terkait email, dan catatan saldo internal terkait akun.</p>
          <p>Data tertentu dapat dipertahankan secara terbatas bila diperlukan untuk kewajiban hukum, keamanan, pencegahan penipuan, atau penyelesaian sengketa. Akun lama yang pernah menggunakan layanan verifikasi pihak ketiga sebelum mode watch-only dapat meminta penelusuran dan penghapusan data residual melalui privacy@kriptoaman.com.</p>
        </Section>

        <Section title="6. Hak dan kontak privasi">
          <p>Anda dapat meminta akses, koreksi, atau penghapusan data yang berada di bawah kendali KriptoAman. Untuk pertanyaan privasi atau jika Anda tidak dapat masuk untuk menghapus akun, hubungi <strong>privacy@kriptoaman.com</strong>.</p>
        </Section>

        <div className="pt-5 border-t border-slate-700/50 text-center text-xs text-slate-500">
          <p>© 2026 PT Kripto Aman Indonesia.</p>
          <div className="mt-2 flex justify-center gap-4"><Link to={createPageUrl('TermsOfService')} className="text-indigo-400">Syarat Layanan</Link><Link to={createPageUrl('AccountDeletion')} className="text-indigo-400">Hapus Akun</Link></div>
        </div>
      </div>
    </div>
  );
}

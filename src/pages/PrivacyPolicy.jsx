import React, { useState } from 'react';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import { ChevronDown, ChevronUp, Shield, Lock, Eye, Globe, Trash2, Bell, Users, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const sections = [
  {
    icon: <Eye className="w-5 h-5 text-indigo-400" />,
    title: '1. Informasi yang Kami Kumpulkan',
    content: (
      <>
        <p className="text-slate-300 mb-3">Kami mengumpulkan informasi berikut untuk menjalankan layanan:</p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Data akun: nama lengkap, alamat email</li>
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Alamat dompet kripto (bukan private key/seed phrase)</li>
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Preferensi, aktivitas aplikasi, dan data diagnostik</li>
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Data perangkat, IP, dan pola penggunaan (analytics)</li>
        </ul>
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-300">
          ✅ Kami <strong>TIDAK</strong> menyimpan private key, seed phrase, atau kata sandi dalam bentuk tidak terenkripsi.
        </div>
      </>
    ),
  },
  {
    icon: <Shield className="w-5 h-5 text-indigo-400" />,
    title: '2. Cara Kami Menggunakan Data Anda',
    content: (
      <ul className="space-y-2 text-slate-300">
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Menyediakan dan meningkatkan layanan platform</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Menampilkan informasi pemantauan dan merespons permintaan</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Mendeteksi dan mencegah penipuan/aktivitas ilegal</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Mematuhi kewajiban hukum dan regulasi</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Mengirim notifikasi transaksi dan informasi layanan</li>
      </ul>
    ),
  },
  {
    icon: <Lock className="w-5 h-5 text-indigo-400" />,
    title: '3. Keamanan Data',
    content: (
      <>
        <p className="text-slate-300 mb-3">Kami menerapkan langkah-langkah keamanan industri standar:</p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Enkripsi end-to-end untuk data sensitif</li>
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> HTTPS/TLS untuk semua koneksi</li>
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Audit keamanan berkala</li>
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Dukungan autentikasi multi-faktor</li>
        </ul>
        <p className="text-slate-400 text-sm mt-3">Namun tidak ada metode transmisi atau penyimpanan yang 100% aman. Kami tidak dapat menjamin keamanan absolut.</p>
      </>
    ),
  },
  {
    icon: <Users className="w-5 h-5 text-indigo-400" />,
    title: '4. Berbagi Data',
    content: (
      <>
        <p className="text-slate-300 mb-3">Kami hanya berbagi data dengan:</p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Penyedia layanan di bawah perjanjian kerahasiaan ketat</li>
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Penegak hukum jika diwajibkan secara hukum</li>
          <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Jaringan blockchain (data transaksi bersifat publik)</li>
        </ul>
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
          🚫 Kami <strong>TIDAK</strong> menjual informasi pribadi Anda kepada pihak ketiga.
        </div>
      </>
    ),
  },
  {
    icon: <Trash2 className="w-5 h-5 text-indigo-400" />,
    title: '5. Hak Anda',
    content: (
      <ul className="space-y-2 text-slate-300">
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Akses data pribadi Anda</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Koreksi informasi yang tidak akurat</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Penghapusan data (hak untuk dilupakan)</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Portabilitas data</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Menarik persetujuan kapan saja</li>
        <p className="text-slate-400 text-sm mt-2 ml-5">Penghapusan dapat dimulai melalui Profil → Hapus Akun atau halaman Penghapusan Akun. Hubungi: <strong className="text-indigo-400">privacy@kriptoaman.com</strong></p>
      </ul>
    ),
  },
  {
    icon: <Bell className="w-5 h-5 text-indigo-400" />,
    title: '6. Cookie & Pelacakan',
    content: (
      <ul className="space-y-2 text-slate-300">
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Manajemen sesi & autentikasi pengguna</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Analytics (Mixpanel) untuk meningkatkan UX</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Pencegahan penipuan</li>
        <p className="text-slate-400 text-sm mt-2 ml-5">Anda dapat mengelola preferensi cookie di pengaturan browser.</p>
      </ul>
    ),
  },
  {
    icon: <Globe className="w-5 h-5 text-indigo-400" />,
    title: '7. Anak-anak & Transfer Internasional',
    content: (
      <>
        <p className="text-slate-300 mb-3">Layanan kami tidak ditujukan untuk pengguna di bawah 18 tahun. Kami tidak secara sadar mengumpulkan informasi dari anak di bawah umur.</p>
        <p className="text-slate-300">Informasi Anda mungkin ditransfer ke negara lain yang memiliki undang-undang perlindungan data berbeda. Dengan menggunakan layanan kami, Anda menyetujui transfer tersebut.</p>
      </>
    ),
  },
];

function AccordionItem({ item, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-indigo-500/50 bg-slate-800/60' : 'border-slate-700/50 bg-slate-900/40'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {item.icon}
          <span className="text-white font-semibold text-sm">{item.title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/40 pt-4">
          {item.content}
        </div>
      )}
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 pt-6 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('Settings')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </Link>
          <KriptoAmanLogo size={36} showText={true} textSize="text-base" />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold">Kebijakan Privasi</h1>
          </div>
          <p className="text-slate-400 text-sm ml-1">Berlaku sejak: 1 Maret 2026 · Terakhir diperbarui: 10 Agustus 2026</p>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            KriptoAman berkomitmen melindungi privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi Anda.
          </p>
        </div>

        {/* Accordion sections */}
        <div className="space-y-3">
          {sections.map((item, idx) => (
            <AccordionItem key={idx} item={item} idx={idx} />
          ))}
        </div>

        {/* Contact */}
        <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <p className="text-indigo-300 font-semibold text-sm mb-2">📬 Hubungi Kami</p>
          <p className="text-slate-300 text-sm">Email: <strong>privacy@kriptoaman.com</strong></p>
          <p className="text-slate-300 text-sm mt-1">Waktu respons: maks. 30 hari kerja</p>
        </div>

        {/* Footer links */}
        <div className="mt-8 py-6 border-t border-slate-700/50 text-center space-y-2">
          <p className="text-slate-500 text-xs">© 2026 KriptoAman. Hak cipta dilindungi.</p>
          <div className="flex justify-center gap-4 text-xs">
            <Link to={createPageUrl('TermsOfService')} className="text-indigo-400 hover:underline">Syarat Layanan</Link>
            <Link to={createPageUrl('Disclaimer')} className="text-indigo-400 hover:underline">Disclaimer</Link>
            <Link to={createPageUrl('AccountDeletion')} className="text-indigo-400 hover:underline">Hapus Akun</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

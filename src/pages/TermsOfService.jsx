import React, { useState } from 'react';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import { ChevronDown, ChevronUp, FileText, ArrowLeft, Shield, AlertTriangle, Scale, Gavel, UserCheck, XCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const sections = [
  {
    icon: <FileText className="w-5 h-5 text-indigo-400" />,
    title: '1. Persetujuan Ketentuan',
    content: (
      <p className="text-slate-300 leading-relaxed">
        Dengan mengakses dan menggunakan KriptoAman ("Platform"), Anda menyetujui dan terikat oleh ketentuan dan syarat perjanjian ini. Jika Anda tidak setuju, harap tidak menggunakan layanan ini.
      </p>
    ),
  },
  {
    icon: <UserCheck className="w-5 h-5 text-indigo-400" />,
    title: '2. Lisensi Penggunaan',
    content: (
      <>
        <p className="text-slate-300 mb-3">Izin diberikan untuk penggunaan pribadi, non-komersial. Di bawah lisensi ini Anda tidak diperbolehkan:</p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex gap-2"><span className="text-red-400 mt-1">✕</span> Memodifikasi atau menyalin materi platform</li>
          <li className="flex gap-2"><span className="text-red-400 mt-1">✕</span> Menggunakan untuk tujuan komersial tanpa izin tertulis</li>
          <li className="flex gap-2"><span className="text-red-400 mt-1">✕</span> Melakukan rekayasa balik (reverse engineer) pada perangkat lunak</li>
          <li className="flex gap-2"><span className="text-red-400 mt-1">✕</span> Menggunakan bot/scraper untuk mengumpulkan data platform</li>
          <li className="flex gap-2"><span className="text-red-400 mt-1">✕</span> Mentransfer atau "mirroring" materi ke server lain</li>
        </ul>
      </>
    ),
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    title: '3. Disclaimer Keuangan',
    content: (
      <>
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-xl mb-3">
          <p className="text-yellow-300 font-semibold text-sm mb-2">⚠️ Peringatan Risiko Investasi</p>
          <p className="text-slate-300 text-sm leading-relaxed">
            KriptoAman disediakan untuk tujuan edukasi dan informasi. Kripto sangat fluktuatif dan berisiko tinggi. Kinerja masa lalu tidak menjamin hasil di masa depan. Anda bertanggung jawab penuh atas keputusan investasi Anda.
          </p>
        </div>
        <p className="text-slate-400 text-sm">Selalu lakukan riset mandiri (DYOR) dan konsultasikan dengan penasihat keuangan sebelum bertransaksi.</p>
      </>
    ),
  },
  {
    icon: <Shield className="w-5 h-5 text-indigo-400" />,
    title: '4. Batasan Tanggung Jawab',
    content: (
      <p className="text-slate-300 leading-relaxed">
        KriptoAman tidak bertanggung jawab atas kerugian apa pun (termasuk kehilangan data, profit, atau akibat gangguan bisnis) yang timbul dari penggunaan atau ketidakmampuan menggunakan platform, bahkan jika telah diberitahu tentang kemungkinan kerugian tersebut.
      </p>
    ),
  },
  {
    icon: <UserCheck className="w-5 h-5 text-indigo-400" />,
    title: '5. Tanggung Jawab Pengguna',
    content: (
      <ul className="space-y-2 text-slate-300">
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Memberikan informasi yang akurat dan lengkap</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Menjaga kerahasiaan kredensial akun</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Mematuhi semua hukum dan regulasi yang berlaku</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Tidak menggunakan platform untuk kegiatan ilegal</li>
        <li className="flex gap-2"><span className="text-indigo-400 mt-1">▸</span> Tidak terlibat penipuan, pencucian uang, atau pendanaan terorisme</li>
      </ul>
    ),
  },
  {
    icon: <XCircle className="w-5 h-5 text-red-400" />,
    title: '6. Penangguhan & Penutupan Akun',
    content: (
      <>
        <p className="text-slate-300 mb-3">KriptoAman berhak menangguhkan atau menutup akun Anda kapan saja jika:</p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex gap-2"><span className="text-red-400 mt-1">▸</span> Melanggar Ketentuan Layanan ini</li>
          <li className="flex gap-2"><span className="text-red-400 mt-1">▸</span> Dicurigai melakukan penipuan atau aktivitas ilegal</li>
          <li className="flex gap-2"><span className="text-red-400 mt-1">▸</span> Persyaratan regulasi atau hukum</li>
          <li className="flex gap-2"><span className="text-red-400 mt-1">▸</span> Inaktivitas dalam jangka panjang</li>
        </ul>
      </>
    ),
  },
  {
    icon: <Scale className="w-5 h-5 text-indigo-400" />,
    title: '7. Keamanan & Risiko',
    content: (
      <>
        <p className="text-slate-300 mb-3">Anda mengakui risiko inheren dari transaksi kripto, termasuk:</p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex gap-2"><span className="text-yellow-400 mt-1">▸</span> Kehilangan private key atau kompromi dompet</li>
          <li className="flex gap-2"><span className="text-yellow-400 mt-1">▸</span> Serangan jaringan atau kegagalan teknis</li>
          <li className="flex gap-2"><span className="text-yellow-400 mt-1">▸</span> Perubahan regulasi yang mempengaruhi kripto</li>
          <li className="flex gap-2"><span className="text-yellow-400 mt-1">▸</span> Volatilitas pasar dan fluktuasi harga</li>
        </ul>
      </>
    ),
  },
  {
    icon: <Gavel className="w-5 h-5 text-indigo-400" />,
    title: '8. Hukum yang Berlaku',
    content: (
      <p className="text-slate-300 leading-relaxed">
        Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Anda tunduk pada yurisdiksi eksklusif pengadilan yang berlokasi di Jakarta, Indonesia.
      </p>
    ),
  },
];

function AccordionItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-indigo-500/50 bg-slate-800/60' : 'border-slate-700/50 bg-slate-900/40'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
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

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 pt-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('Settings')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </Link>
          <KriptoAmanLogo size={36} showText={true} textSize="text-base" />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold">Syarat & Ketentuan Layanan</h1>
          </div>
          <p className="text-slate-400 text-sm ml-1">Berlaku sejak: 1 Maret 2026 · Terakhir diperbarui: 4 Maret 2026</p>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            Dengan menggunakan KriptoAman, Anda menyetujui ketentuan berikut. Harap baca dengan seksama.
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((item, idx) => (
            <AccordionItem key={idx} item={item} />
          ))}
        </div>

        <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <p className="text-indigo-300 font-semibold text-sm mb-2">📬 Kontak Legal</p>
          <p className="text-slate-300 text-sm">Email: <strong>legal@kriptoaman.id</strong></p>
          <p className="text-slate-300 text-sm mt-1">Support: <strong>support@kriptoaman.id</strong></p>
          <p className="text-slate-300 text-sm mt-1">Waktu respons: maks. 48 jam kerja</p>
        </div>

        <div className="mt-8 py-6 border-t border-slate-700/50 text-center space-y-2">
          <p className="text-slate-500 text-xs">© 2026 KriptoAman. Hak cipta dilindungi.</p>
          <div className="flex justify-center gap-4 text-xs">
            <Link to={createPageUrl('PrivacyPolicy')} className="text-indigo-400 hover:underline">Kebijakan Privasi</Link>
            <Link to={createPageUrl('Disclaimer')} className="text-indigo-400 hover:underline">Disclaimer</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
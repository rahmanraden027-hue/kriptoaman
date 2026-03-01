import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Globe, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    icon: Database,
    title: 'Data yang Kami Kumpulkan',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    content: [
      'Informasi akun: nama, alamat email yang Anda daftarkan.',
      'Data wallet: alamat publik blockchain (BUKAN private key atau seed phrase).',
      'Riwayat transaksi: hash transaksi dan metadata yang tersedia secara publik di blockchain.',
      'Data penggunaan: log aktivitas dalam aplikasi untuk meningkatkan layanan.',
      'Informasi perangkat: jenis perangkat, sistem operasi, dan versi aplikasi.',
    ],
  },
  {
    icon: Lock,
    title: 'Keamanan Data',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    content: [
      'Private key dan seed phrase TIDAK PERNAH dikirim ke server kami — selalu tersimpan secara lokal dan terenkripsi di perangkat Anda.',
      'Enkripsi AES-256 digunakan untuk melindungi data sensitif yang tersimpan lokal.',
      'Koneksi ke server menggunakan TLS 1.3 untuk keamanan data saat transit.',
      'PIN dan biometrik diproses sepenuhnya di perangkat, tidak dikirim ke mana pun.',
      'Kami secara berkala melakukan audit keamanan dan penetration testing.',
    ],
  },
  {
    icon: Eye,
    title: 'Penggunaan Data',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    content: [
      'Meningkatkan pengalaman pengguna dan fitur aplikasi.',
      'Mengirimkan notifikasi penting terkait keamanan akun.',
      'Analisis agregat (anonim) untuk pengembangan produk.',
      'Kepatuhan terhadap regulasi keuangan dan hukum yang berlaku.',
      'Kami TIDAK menjual data pribadi Anda kepada pihak ketiga.',
    ],
  },
  {
    icon: Globe,
    title: 'Berbagi Data dengan Pihak Ketiga',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    content: [
      'Penyedia layanan teknis (hosting, analytics) yang terikat perjanjian kerahasiaan.',
      'Informasi harga kripto dari API publik (CoinGecko, CoinCap) — tidak ada data pribadi yang dibagikan.',
      'Transaksi blockchain bersifat publik sesuai sifat teknologi blockchain.',
      'Otoritas hukum jika diwajibkan oleh peraturan perundang-undangan yang berlaku.',
    ],
  },
  {
    icon: Bell,
    title: 'Notifikasi & Komunikasi',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    content: [
      'Push notification untuk aktivitas transaksi dan keamanan (dapat dinonaktifkan).',
      'Email untuk konfirmasi penting dan pembaruan kebijakan.',
      'Anda dapat berhenti berlangganan komunikasi non-esensial kapan saja melalui pengaturan.',
    ],
  },
  {
    icon: Shield,
    title: 'Hak Pengguna',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    content: [
      'Hak akses: Anda dapat meminta salinan data pribadi yang kami simpan.',
      'Hak koreksi: Anda dapat memperbarui data yang tidak akurat.',
      'Hak penghapusan: Anda dapat meminta penghapusan akun dan data terkait.',
      'Hak portabilitas: Anda dapat meminta ekspor data dalam format yang dapat dibaca mesin.',
      'Untuk menggunakan hak-hak ini, hubungi: privacy@coinvault.app',
    ],
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 py-4 flex items-center gap-3 -mx-4 px-4 mb-6">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">Kebijakan Privasi</h1>
            <p className="text-slate-500 text-xs">Berlaku sejak 1 Maret 2026</p>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold">CoinVault App</p>
              <p className="text-blue-400 text-xs">Keamanan & Privasi adalah Prioritas Kami</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Kebijakan Privasi ini menjelaskan bagaimana CoinVault mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda. Kami berkomitmen penuh untuk menjaga privasi dan keamanan data Anda sesuai dengan standar internasional (GDPR, PDPA Indonesia).
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map(({ icon: Icon, title, color, bg, content }) => (
            <div key={title} className={`border rounded-2xl p-5 ${bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <h2 className={`font-bold text-sm ${color}`}>{title}</h2>
              </div>
              <ul className="space-y-2">
                {content.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-slate-600 mt-0.5 shrink-0">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-bold text-sm">Hubungi Kami</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini atau ingin menggunakan hak-hak Anda, silakan hubungi Tim Privasi kami:
          </p>
          <div className="mt-3 space-y-1.5">
            <p className="text-blue-400 text-sm font-mono">privacy@coinvault.app</p>
            <p className="text-slate-500 text-xs">Waktu respons: 1-5 hari kerja</p>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          Dengan menggunakan CoinVault, Anda menyetujui Kebijakan Privasi ini. Kami akan memberi tahu Anda jika ada perubahan material melalui email atau notifikasi aplikasi.
        </p>
      </div>
    </div>
  );
}
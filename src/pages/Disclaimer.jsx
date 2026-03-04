import React from 'react';
import KriptoAmanLogo from '../components/brand/KriptoAmanLogo';
import { AlertTriangle, TrendingDown, Scale, Globe, Bot, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const items = [
  {
    icon: <TrendingDown className="w-6 h-6 text-yellow-400" />,
    title: 'Risiko Investasi Kripto',
    color: 'yellow',
    content: 'Cryptocurrency adalah aset digital yang sangat volatil. Nilai aset dapat turun drastis dalam waktu singkat, bahkan hingga nol. Investasi dalam kripto mengandung risiko tinggi kehilangan seluruh modal yang diinvestasikan.',
  },
  {
    icon: <Scale className="w-6 h-6 text-blue-400" />,
    title: 'Bukan Saran Keuangan',
    color: 'blue',
    content: 'Seluruh informasi, analisis, grafik, harga, dan konten di KriptoAman disediakan semata-mata untuk tujuan informasi dan edukasi. Tidak ada konten di platform ini yang merupakan saran keuangan, investasi, hukum, atau pajak.',
  },
  {
    icon: <Bot className="w-6 h-6 text-purple-400" />,
    title: 'Auto-Trading & Bot',
    color: 'purple',
    content: 'Fitur auto-trading dan bot yang tersedia di platform ini adalah alat otomasi. Hasil backtest dan paper trading tidak menjamin keuntungan di kondisi pasar nyata. Anda bertanggung jawab penuh atas setiap keputusan trading otomatis.',
  },
  {
    icon: <Globe className="w-6 h-6 text-green-400" />,
    title: 'Data Pihak Ketiga',
    content: 'Harga, data pasar, dan informasi yang ditampilkan bersumber dari penyedia data pihak ketiga. KriptoAman tidak menjamin akurasi, kelengkapan, atau ketepatan waktu data tersebut. Selalu verifikasi data dari sumber primer.',
    color: 'green',
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
    title: 'Keamanan Dompet',
    color: 'red',
    content: 'Pengguna bertanggung jawab penuh atas keamanan seed phrase, private key, dan kredensial akun. KriptoAman tidak dapat memulihkan akses ke dompet yang hilang atau transaksi blockchain yang telah dikonfirmasi.',
  },
];

const colorMap = {
  yellow: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-300',
  blue: 'bg-blue-500/10 border-blue-500/25 text-blue-300',
  purple: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
  green: 'bg-green-500/10 border-green-500/25 text-green-300',
  red: 'bg-red-500/10 border-red-500/25 text-red-300',
};

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 pt-6 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Back + Logo */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('Settings')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </Link>
          <KriptoAmanLogo size={36} showText={true} textSize="text-base" />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold">Disclaimer</h1>
          </div>
          <p className="text-slate-400 text-sm ml-1">Berlaku sejak: 1 Maret 2026</p>
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-xl">
            <p className="text-yellow-200 text-sm font-semibold mb-1">⚠️ Peringatan Penting</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sebelum menggunakan KriptoAman, harap baca dan pahami disclaimer ini sepenuhnya. Penggunaan platform berarti Anda telah memahami dan menyetujui semua pernyataan berikut.
            </p>
          </div>
        </div>

        {/* Disclaimer Cards */}
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className={`p-5 border rounded-xl ${colorMap[item.color]}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <div>
                  <p className="font-bold text-white mb-2">{item.title}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{item.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conditional notice */}
        <div className="mt-8 p-5 bg-slate-800/60 border border-slate-600/50 rounded-xl">
          <p className="text-white font-bold mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-400" /> Kondisi Penggunaan Platform
          </p>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0 mt-0.5">▸</span> Anda berusia minimal 18 tahun atau usia legal di yurisdiksi Anda</li>
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0 mt-0.5">▸</span> Perdagangan kripto diizinkan secara hukum di negara Anda</li>
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0 mt-0.5">▸</span> Anda memahami dan menerima risiko penuh dari perdagangan kripto</li>
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0 mt-0.5">▸</span> Anda hanya menginvestasikan dana yang mampu Anda rugikan</li>
            <li className="flex gap-2"><span className="text-indigo-400 shrink-0 mt-0.5">▸</span> Anda tidak berada di yurisdiksi yang dilarang (mis. negara sanksi OFAC)</li>
          </ul>
        </div>

        {/* DYOR reminder */}
        <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
          <p className="text-indigo-300 font-bold text-lg">🔍 DYOR — Do Your Own Research</p>
          <p className="text-slate-400 text-sm mt-2">Selalu lakukan riset mandiri. Jangan berinvestasi hanya berdasarkan informasi dari platform ini.</p>
        </div>

        {/* Footer */}
        <div className="mt-8 py-6 border-t border-slate-700/50 text-center space-y-2">
          <p className="text-slate-500 text-xs">© 2026 KriptoAman. Hak cipta dilindungi.</p>
          <div className="flex justify-center gap-4 text-xs">
            <Link to={createPageUrl('PrivacyPolicy')} className="text-indigo-400 hover:underline">Kebijakan Privasi</Link>
            <Link to={createPageUrl('TermsOfService')} className="text-indigo-400 hover:underline">Syarat Layanan</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import SupportChat from '../components/support/SupportChat';
import { MessageCircle, Mail, HelpCircle, ChevronRight, ExternalLink, Phone, Clock } from 'lucide-react';

const FAQS = [
  { q: 'Bagaimana cara deposit kripto?', a: 'Buka halaman Wallet, klik "Semua Alamat Penerima", pilih koin yang ingin dideposit, salin alamat dan kirim dari wallet eksternal Anda.' },
  { q: 'Berapa lama proses deposit IDR?', a: 'Deposit via bank transfer biasanya diproses dalam 1-3 hari kerja. Pastikan Anda menyertakan kode referensi yang tertera.' },
  { q: 'Bagaimana cara withdraw ke rekening bank?', a: 'Buka halaman Wallet, klik banner "Deposit & Withdraw IDR", pilih tab Withdraw, masukkan jumlah dan informasi rekening bank Anda.' },
  { q: 'Apakah saldo saya aman?', a: 'Ya, KriptoAman menggunakan enkripsi tingkat tinggi untuk melindungi data dan aset Anda. Kami merekomendasikan aktifkan PIN keamanan di Settings > Security.' },
  { q: 'Bagaimana cara swap antar koin?', a: 'Di halaman Wallet, klik tombol "Swap" pada dashboard koin. Pilih koin asal dan tujuan, masukkan jumlah, lalu konfirmasi.' },
];

export default function Support() {
  const [user, setUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Header */}
        <div className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Pusat Bantuan</h1>
          <p className="text-slate-400 text-sm mt-2">Tim kami siap membantu Anda 24/7</p>
        </div>

        {/* Contact Options */}
        <div className="space-y-3">
          <button onClick={() => setShowChat(true)}
            className="w-full flex items-center gap-4 p-4 bg-blue-600/15 border border-blue-500/30 rounded-2xl hover:bg-blue-600/20 transition-colors text-left">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Live Chat Support</p>
              <p className="text-blue-400 text-xs">● Online · Balas dalam 1-2 jam</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <a href="mailto:support@kriptoaman.com"
            className="w-full flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl hover:bg-slate-800/70 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Email Support</p>
              <p className="text-slate-400 text-xs">support@kriptoaman.com</p>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500" />
          </a>

          <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/40 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Jam Operasional</p>
              <p className="text-slate-400 text-xs">Senin–Jumat: 09.00–18.00 WIB</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-semibold">Pertanyaan Umum (FAQ)</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700/40 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                  <span className="text-white text-sm font-medium">{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ml-2 ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 text-center">
          <p className="text-slate-500 text-xs">Tidak menemukan jawaban? Hubungi kami langsung melalui live chat atau email.</p>
          <p className="text-slate-600 text-xs mt-1">© 2025 KriptoAman. Semua hak dilindungi.</p>
        </div>

      </div>

      {showChat && <SupportChat user={user} onClose={() => setShowChat(false)} />}
    </div>
  );
}
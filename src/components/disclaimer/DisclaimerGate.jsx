import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';

const STORAGE_KEY = '_ka_disclaimer_accepted_v2';

export default function DisclaimerGate({ children }) {
  const [accepted, setAccepted] = useState(true); // true = skip rendering gate
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(false);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '1') {
      setAccepted(true);
    } else {
      setAccepted(false);
    }
  }, []);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 30) {
      setScrolled(true);
    }
  };

  const accept = () => {
    if (!checked) return;
    localStorage.setItem(STORAGE_KEY, '1');
    setAccepted(true);
  };

  if (accepted) return children;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl flex flex-col overflow-hidden shadow-2xl" style={{ maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-yellow-500/20">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Disclaimer & Persetujuan</h1>
              <p className="text-slate-400 text-xs">KriptoAman · Wajib dibaca sebelum lanjut</p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto flex-1 px-6 py-4 space-y-4 text-sm text-slate-300">
          
          <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-4">
            <p className="text-yellow-200 font-semibold mb-1">⚠️ Risiko Investasi Kripto</p>
            <p className="text-slate-300 text-xs leading-relaxed">Cryptocurrency adalah aset sangat volatil. Nilai dapat turun drastis hingga nol. Anda bisa kehilangan <strong>seluruh modal</strong>. Ini bukan produk tabungan atau deposito.</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4">
            <p className="text-blue-200 font-semibold mb-1">📋 Bukan Saran Keuangan</p>
            <p className="text-slate-300 text-xs leading-relaxed">Seluruh informasi, analisis, harga, dan fitur di KriptoAman hanya untuk tujuan <strong>informasi dan edukasi</strong>. Bukan saran investasi, keuangan, hukum, atau pajak.</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-4">
            <p className="text-purple-200 font-semibold mb-1">🤖 Auto-Trading & Bot</p>
            <p className="text-slate-300 text-xs leading-relaxed">Hasil backtesting dan paper trading <strong>tidak menjamin</strong> keuntungan di pasar nyata. Anda bertanggung jawab penuh atas setiap keputusan trading otomatis.</p>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4">
            <p className="text-rose-200 font-semibold mb-1">🚨 Waspada Rug Pull & Scam</p>
            <p className="text-slate-300 text-xs leading-relaxed">KriptoAman tidak bertanggung jawab atas kerugian akibat interaksi dengan token atau proyek scam / rug pull. Selalu lakukan riset mandiri (DYOR) sebelum berinvestasi.</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4">
            <p className="text-red-200 font-semibold mb-1">🔑 Keamanan Wallet</p>
            <p className="text-slate-300 text-xs leading-relaxed">Pengguna bertanggung jawab penuh atas keamanan seed phrase dan private key. KriptoAman <strong>tidak dapat</strong> memulihkan akses ke wallet yang hilang atau transaksi yang sudah dikonfirmasi blockchain.</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-white font-semibold mb-2">✅ Syarat Penggunaan</p>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">▸</span>Saya berusia minimal 18 tahun</li>
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">▸</span>Perdagangan kripto legal di negara saya</li>
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">▸</span>Saya memahami risiko penuh kripto</li>
              <li className="flex gap-2"><span className="text-indigo-400 shrink-0">▸</span>Saya hanya menginvestasikan dana yang siap saya rugikan</li>
            </ul>
          </div>

          <div className="text-center py-2">
            <p className="text-indigo-300 font-bold">🔍 DYOR — Do Your Own Research</p>
            <p className="text-slate-500 text-xs mt-1">Selalu lakukan riset mandiri. Jangan percaya satu sumber.</p>
          </div>

          {!scrolled && (
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs pb-2">
              <ChevronDown className="w-4 h-4 animate-bounce" />
              Scroll ke bawah untuk lanjut
            </div>
          )}
        </div>

        {/* Footer / Accept */}
        {scrolled && (
          <div className="px-6 pb-6 pt-4 border-t border-slate-800 shrink-0 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setChecked(!checked)}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Saya telah membaca, memahami, dan menyetujui seluruh disclaimer dan syarat penggunaan KriptoAman. Saya berinvestasi atas risiko saya sendiri.
              </p>
            </label>
            <button
              onClick={accept}
              disabled={!checked}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${checked ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
              Saya Setuju & Lanjutkan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
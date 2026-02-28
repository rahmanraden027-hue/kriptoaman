import React, { useState } from 'react';
import { Wallet, ArrowLeftRight, TrendingUp, ShieldCheck, ChevronRight, X, Zap } from 'lucide-react';

const STEPS = [
  {
    icon: Wallet,
    color: '#F97316',
    title: 'Selamat Datang di DEX Wallet!',
    desc: 'Kelola aset kripto multi-chain Anda dengan aman. Simpan, kirim, terima, dan swap langsung dari wallet.',
    tip: '🔐 Wallet Anda sepenuhnya terenkripsi dan tersimpan lokal di perangkat ini.',
  },
  {
    icon: ArrowLeftRight,
    color: '#8B5CF6',
    title: 'Swap Antar Koin',
    desc: 'Tukar BTC, ETH, SOL, dan koin lainnya langsung via protokol DEX tanpa perantara. Klik "Swap" di dashboard utama.',
    tip: '⚡ Swap dieksekusi via THORChain & 1inch — non-custodial, Anda tetap pegang kunci.',
  },
  {
    icon: TrendingUp,
    color: '#10B981',
    title: 'Pantau Harga Real-time',
    desc: 'Harga semua koin diperbarui otomatis setiap detik via Binance WebSocket stream.',
    tip: '📊 Buka tab "Harga" di menu bawah untuk grafik dan analisis pergerakan harga.',
  },
  {
    icon: ShieldCheck,
    color: '#3B82F6',
    title: 'Keamanan Utama',
    desc: 'Seed phrase Anda adalah kunci master wallet. Jangan pernah dibagikan ke siapapun, termasuk kami.',
    tip: '📝 Catat seed phrase di kertas dan simpan di tempat aman — bukan di foto atau cloud.',
  },
];

export default function OnboardingGuide({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-4">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1 p-3 pb-0">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-blue-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* Close button */}
          <div className="flex justify-end">
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: current.color + '22', border: `2px solid ${current.color}44` }}>
              <Icon className="w-10 h-10" style={{ color: current.color }} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h2 className="text-white font-bold text-xl">{current.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{current.desc}</p>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2.5 bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
            <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-slate-400 text-xs leading-relaxed">{current.tip}</p>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                Kembali
              </button>
            )}
            <button
              onClick={() => isLast ? onClose() : setStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: isLast ? '#10B981' : current.color }}>
              {isLast ? '🚀 Mulai Sekarang' : <>Lanjut <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>

          <button onClick={onClose} className="w-full text-center text-slate-600 text-xs hover:text-slate-400 transition-colors">
            Lewati panduan
          </button>
        </div>
      </div>
    </div>
  );
}
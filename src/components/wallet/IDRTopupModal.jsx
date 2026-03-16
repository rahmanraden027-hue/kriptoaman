import React, { useState } from 'react';
import { X, CreditCard, Zap, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PACKAGES = [
  { idr: 50000,   label: 'Rp 50.000',     popular: false },
  { idr: 100000,  label: 'Rp 100.000',    popular: false },
  { idr: 200000,  label: 'Rp 200.000',    popular: true  },
  { idr: 500000,  label: 'Rp 500.000',    popular: false },
  { idr: 1000000, label: 'Rp 1.000.000',  popular: false },
];

export default function IDRTopupModal({ onClose }) {
  const [selected, setSelected] = useState(200000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    // Block if inside iframe
    if (window.self !== window.top) {
      alert('Checkout hanya dapat digunakan di aplikasi yang dipublikasikan, bukan di preview editor.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await base44.functions.invoke('createIDRTopup', {
      amountIDR: selected,
      successUrl: window.location.href + '?topup=success',
      cancelUrl: window.location.href + '?topup=cancel',
    });
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      setError(res.data?.error || 'Gagal membuat sesi pembayaran.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-white font-bold text-sm">Top-up Saldo IDR</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-slate-400 text-xs">Pilih nominal top-up. Pembayaran aman via Stripe (kartu kredit/debit).</p>

          <div className="grid grid-cols-2 gap-2.5">
            {PACKAGES.map(pkg => (
              <button
                key={pkg.idr}
                onClick={() => setSelected(pkg.idr)}
                className={`relative flex flex-col items-center justify-center py-3.5 rounded-xl border transition-all text-center
                  ${selected === pkg.idr
                    ? 'bg-green-500/20 border-green-500 text-green-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'}`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-amber-500 text-black font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    POPULER
                  </span>
                )}
                {selected === pkg.idr && (
                  <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-green-400" />
                )}
                <span className="font-bold text-sm">{pkg.label}</span>
              </button>
            ))}
          </div>

          {/* Info biaya */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Saldo langsung masuk setelah pembayaran berhasil · Biaya layanan 1%</span>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mengarahkan ke Stripe…</>
            ) : (
              <><CreditCard className="w-4 h-4" />Bayar {PACKAGES.find(p => p.idr === selected)?.label}</>
            )}
          </button>

          <p className="text-slate-600 text-[10px] text-center">🔒 Pembayaran diproses oleh Stripe · Kami tidak menyimpan data kartu Anda</p>
        </div>
      </div>
    </div>
  );
}
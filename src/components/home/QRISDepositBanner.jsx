import React, { useState } from 'react';
import { X, Smartphone, Building2, CreditCard } from 'lucide-react';

const PAYMENT_METHODS = [
  { name: 'QRIS', icon: '🔳', desc: 'Scan & bayar', color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/20' },
  { name: 'GoPay', icon: '💚', desc: 'Via Gojek', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/20' },
  { name: 'OVO', icon: '💜', desc: 'Via OVO', color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/20' },
  { name: 'DANA', icon: '💙', desc: 'Via DANA', color: 'from-blue-500/20 to-sky-500/20', border: 'border-blue-500/20' },
  { name: 'ShopeePay', icon: '🧡', desc: 'Via Shopee', color: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/20' },
  { name: 'BCA', icon: '🏦', desc: 'Transfer bank', color: 'from-blue-600/20 to-indigo-600/20', border: 'border-blue-600/20' },
  { name: 'Mandiri', icon: '🏦', desc: 'Transfer bank', color: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/20' },
  { name: 'BRI', icon: '🏦', desc: 'Transfer bank', color: 'from-blue-400/20 to-sky-400/20', border: 'border-blue-400/20' },
];

export default function QRISDepositBanner({ onDepositClick }) {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            🔳
          </div>
          <div>
            <p className="text-white text-sm font-bold">Deposit via QRIS & E-Wallet</p>
            <p className="text-slate-500 text-[10px]">Instan · Tanpa rekening bank</p>
          </div>
        </div>
        <button onClick={() => setShow(false)} className="text-slate-600 hover:text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PAYMENT_METHODS.map(pm => (
          <button
            key={pm.name}
            onClick={onDepositClick}
            className={`flex flex-col items-center gap-1 p-2 bg-gradient-to-br ${pm.color} border ${pm.border} rounded-xl hover:opacity-80 transition-opacity`}
          >
            <span className="text-xl">{pm.icon}</span>
            <span className="text-white text-[9px] font-bold">{pm.name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onDepositClick}
        className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white font-semibold rounded-xl text-sm transition-opacity"
      >
        💰 Deposit Sekarang
      </button>
    </div>
  );
}
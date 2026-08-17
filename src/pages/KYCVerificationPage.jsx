import React from 'react';
import { ShieldCheck, Eye, Lock } from 'lucide-react';
import TrustBadges from '../components/trust/TrustBadges';

export default function KYCVerificationPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h1 className="text-white font-bold text-xl">Verifikasi Identitas</h1>
              <p className="text-blue-200 text-sm mt-2 leading-relaxed">
                Versi publik KriptoAman saat ini beroperasi sebagai platform pemantauan dan market intelligence. Pengiriman dokumen KYC dari aplikasi dinonaktifkan dan tidak diperlukan untuk menggunakan fitur pemantauan yang tersedia.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <Eye className="w-5 h-5 text-sky-400 mb-3" />
            <h2 className="font-semibold">Mode watch-only</h2>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">KriptoAman tidak menjalankan penyimpanan aset, deposit, penarikan, atau eksekusi perdagangan pada versi publik.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <Lock className="w-5 h-5 text-emerald-400 mb-3" />
            <h2 className="font-semibold">Minimasi data</h2>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">Kami tidak meminta foto identitas, selfie, atau nomor identitas melalui build publik saat fitur tersebut tidak diperlukan.</p>
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
          <p className="text-slate-500 text-xs text-center mb-3">Prinsip transparansi dan keamanan data</p>
          <TrustBadges />
        </div>
      </div>
    </div>
  );
}

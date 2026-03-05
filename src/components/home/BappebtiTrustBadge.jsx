import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

export default function BappebtiTrustBadge() {
  return (
    <div className="bg-gradient-to-r from-green-950/60 via-emerald-950/40 to-green-950/60 border border-green-800/40 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="text-green-300 font-bold text-sm">Platform Terpercaya Indonesia</p>
          <p className="text-green-700 text-[10px]">Beroperasi sesuai regulasi yang berlaku</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Bappebti Compliant', desc: 'Aset kripto terdaftar' },
          { label: 'OJK Aware', desc: 'Edukasi keuangan digital' },
          { label: 'SSL Encrypted', desc: 'Data 100% aman' },
          { label: 'KYC Verified', desc: 'Verifikasi identitas' },
        ].map(badge => (
          <div key={badge.label} className="flex items-start gap-2 bg-green-900/20 border border-green-800/30 rounded-xl p-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-green-300 text-[10px] font-bold">{badge.label}</p>
              <p className="text-green-700 text-[9px]">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import React from 'react';
import { Shield } from 'lucide-react';
import TrustBadges from '../trust/TrustBadges';

export default function BappebtiTrustBadge() {
  return (
    <div className="bg-gradient-to-r from-blue-950/60 via-slate-900/40 to-blue-950/60 border border-blue-800/40 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-4 h-4 text-blue-400 shrink-0" />
        <p className="text-blue-300 font-bold text-sm">Transparansi & Keamanan Aplikasi</p>
      </div>
      <TrustBadges />
    </div>
  );
}

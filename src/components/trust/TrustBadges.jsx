import React from 'react';
import { Eye, Database, Lock, ShieldCheck } from 'lucide-react';

const BADGES = [
  { Icon: ShieldCheck, label: 'Analisis risiko indikatif', color: 'border-sky-500/30 bg-sky-950/20', textColor: 'text-sky-200' },
  { Icon: Eye, label: 'Sumber data transparan', color: 'border-indigo-500/30 bg-indigo-950/20', textColor: 'text-indigo-200' },
  { Icon: Lock, label: 'Koneksi HTTPS/TLS', color: 'border-green-500/30 bg-green-950/20', textColor: 'text-green-200' },
  { Icon: Database, label: 'Data belum diverifikasi', color: 'border-amber-500/30 bg-amber-950/20', textColor: 'text-amber-200' },
];

export default function TrustBadges({ compact = false }) {
  const layout = compact
    ? 'flex items-center justify-center gap-3 flex-wrap'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-3';

  return (
    <div className={layout}>
      {BADGES.map(({ Icon, label, color, textColor }) => (
        <div key={label} className={`flex items-center gap-2 px-3 py-3 rounded-xl border ${color}`}>
          <Icon className={`h-5 w-5 shrink-0 ${textColor}`} aria-hidden="true" />
          <span className={`text-[11px] font-semibold ${textColor}`}>{label}</span>
        </div>
      ))}
    </div>
  );
}

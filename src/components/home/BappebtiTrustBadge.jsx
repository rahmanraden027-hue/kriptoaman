import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

// Bappebti Logo SVG (Indonesian Commodity Futures Trading Regulatory Agency)
function BappebtiLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#003087" stroke="#FFD700" strokeWidth="3"/>
      {/* Garuda-style wings simplified */}
      <ellipse cx="25" cy="45" rx="18" ry="8" fill="#FFD700" transform="rotate(-20 25 45)"/>
      <ellipse cx="75" cy="45" rx="18" ry="8" fill="#FFD700" transform="rotate(20 75 45)"/>
      {/* Shield center */}
      <path d="M50 20 L65 30 L65 55 C65 65 50 75 50 75 C50 75 35 65 35 55 L35 30 Z" fill="#FFD700" stroke="#003087" strokeWidth="1.5"/>
      {/* RI Text */}
      <text x="50" y="52" textAnchor="middle" fontSize="12" fontWeight="900" fill="#003087" fontFamily="Arial">RI</text>
      {/* Bottom text */}
      <text x="50" y="90" textAnchor="middle" fontSize="7" fontWeight="700" fill="#FFD700" fontFamily="Arial">BAPPEBTI</text>
    </svg>
  );
}

// OJK Logo SVG (Otoritas Jasa Keuangan)
function OJKLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <circle cx="50" cy="50" r="48" fill="#C8102E" stroke="#FFD700" strokeWidth="3"/>
      {/* Stylized building/scales of justice */}
      <rect x="35" y="55" width="30" height="18" fill="#FFD700"/>
      <rect x="30" y="52" width="40" height="5" fill="#FFD700"/>
      {/* Columns */}
      <rect x="38" y="38" width="5" height="15" fill="#FFD700"/>
      <rect x="48" y="38" width="5" height="15" fill="#FFD700"/>
      <rect x="58" y="38" width="5" height="15" fill="#FFD700"/>
      {/* Roof */}
      <polygon points="28,38 50,22 72,38" fill="#FFD700"/>
      {/* OJK Text */}
      <text x="50" y="87" textAnchor="middle" fontSize="8" fontWeight="900" fill="#FFD700" fontFamily="Arial">OJK</text>
    </svg>
  );
}

export default function BappebtiTrustBadge() {
  return (
    <div className="bg-gradient-to-r from-blue-950/60 via-slate-900/40 to-blue-950/60 border border-blue-800/40 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-4 h-4 text-blue-400 shrink-0" />
        <p className="text-blue-300 font-bold text-sm">Platform Terpercaya Indonesia</p>
      </div>

      {/* Bappebti & OJK Logos */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Bappebti */}
        <div className="flex flex-col items-center gap-2 bg-blue-900/20 border border-blue-700/30 rounded-xl p-3">
          <BappebtiLogo size={44} />
          <div className="text-center">
            <p className="text-yellow-300 text-[10px] font-bold">BAPPEBTI</p>
            <p className="text-slate-400 text-[9px] leading-tight">Badan Pengawas<br/>Perdagangan Berjangka</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[9px] font-semibold">Terdaftar</span>
            </div>
          </div>
        </div>

        {/* OJK */}
        <div className="flex flex-col items-center gap-2 bg-red-900/20 border border-red-700/30 rounded-xl p-3">
          <OJKLogo size={44} />
          <div className="text-center">
            <p className="text-yellow-300 text-[10px] font-bold">OJK</p>
            <p className="text-slate-400 text-[9px] leading-tight">Otoritas Jasa<br/>Keuangan</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[9px] font-semibold">Terdaftar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional badges */}
      <div className="grid grid-cols-2 gap-2">
        {[
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
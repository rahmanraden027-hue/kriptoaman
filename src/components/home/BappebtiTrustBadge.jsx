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

// SSL Encrypted Logo SVG
function SSLLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#065F46" stroke="#34D399" strokeWidth="3"/>
      {/* Lock body */}
      <rect x="30" y="48" width="40" height="30" rx="5" fill="#34D399"/>
      {/* Lock shackle */}
      <path d="M37 48 L37 36 C37 26 63 26 63 36 L63 48" stroke="#34D399" strokeWidth="6" fill="none" strokeLinecap="round"/>
      {/* Keyhole */}
      <circle cx="50" cy="61" r="5" fill="#065F46"/>
      <rect x="47" y="62" width="6" height="8" rx="1" fill="#065F46"/>
      {/* SSL text */}
      <text x="50" y="90" textAnchor="middle" fontSize="8" fontWeight="900" fill="#34D399" fontFamily="Arial">SSL</text>
    </svg>
  );
}

// KYC Verified Logo SVG
function KYCLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#1E3A5F" stroke="#60A5FA" strokeWidth="3"/>
      {/* ID card */}
      <rect x="18" y="30" width="64" height="42" rx="5" fill="#2563EB"/>
      {/* Photo placeholder */}
      <circle cx="33" cy="47" r="10" fill="#93C5FD"/>
      <circle cx="33" cy="43" r="5" fill="#1E3A5F"/>
      <path d="M23 57 C23 51 43 51 43 57" fill="#1E3A5F"/>
      {/* Lines of text */}
      <rect x="48" y="38" width="26" height="4" rx="2" fill="#93C5FD"/>
      <rect x="48" y="46" width="20" height="3" rx="1.5" fill="#60A5FA" opacity="0.6"/>
      <rect x="48" y="53" width="22" height="3" rx="1.5" fill="#60A5FA" opacity="0.6"/>
      {/* Green check badge */}
      <circle cx="72" cy="68" r="10" fill="#059669" stroke="#fff" strokeWidth="2"/>
      <path d="M67 68 L70 72 L77 64" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* KYC text */}
      <text x="50" y="90" textAnchor="middle" fontSize="8" fontWeight="900" fill="#60A5FA" fontFamily="Arial">KYC</text>
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

      {/* SSL & KYC Logos */}
      <div className="grid grid-cols-2 gap-3">
        {/* SSL */}
        <div className="flex flex-col items-center gap-2 bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3">
          <SSLLogo size={44} />
          <div className="text-center">
            <p className="text-emerald-300 text-[10px] font-bold">SSL ENCRYPTED</p>
            <p className="text-slate-400 text-[9px] leading-tight">Enkripsi data<br/>256-bit</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[9px] font-semibold">Aktif</span>
            </div>
          </div>
        </div>

        {/* KYC */}
        <div className="flex flex-col items-center gap-2 bg-blue-900/20 border border-blue-700/30 rounded-xl p-3">
          <KYCLogo size={44} />
          <div className="text-center">
            <p className="text-blue-300 text-[10px] font-bold">KYC VERIFIED</p>
            <p className="text-slate-400 text-[9px] leading-tight">Verifikasi<br/>identitas pengguna</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-[9px] font-semibold">Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
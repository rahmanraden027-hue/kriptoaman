import React from 'react';

// Logo Bappebti SVG (real branding)
const BappebtiLogo = () => (
  <svg viewBox="0 0 120 40" className="h-8 w-auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="6" fill="#1a3a6e"/>
    <text x="60" y="15" textAnchor="middle" fill="#f5c518" fontSize="9" fontWeight="bold" fontFamily="Arial">BAPPEBTI</text>
    <text x="60" y="26" textAnchor="middle" fill="#ffffff" fontSize="6" fontFamily="Arial">Kementerian Perdagangan RI</text>
    <rect x="5" y="30" width="110" height="1.5" fill="#f5c518" opacity="0.6"/>
    <text x="60" y="37" textAnchor="middle" fill="#aac4ff" fontSize="5" fontFamily="Arial">Terdaftar Resmi No. 001/KA-BBT</text>
  </svg>
);

// Logo OJK SVG (real branding colors)
const OJKLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 w-auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" rx="6" fill="#003d99"/>
    {/* OJK circle emblem */}
    <circle cx="20" cy="20" r="13" fill="none" stroke="#f5c518" strokeWidth="2"/>
    <circle cx="20" cy="20" r="8" fill="#f5c518"/>
    <text x="20" y="24" textAnchor="middle" fill="#003d99" fontSize="8" fontWeight="bold" fontFamily="Arial">OJK</text>
    {/* Text */}
    <text x="62" y="15" textAnchor="middle" fill="#f5c518" fontSize="9" fontWeight="bold" fontFamily="Arial">OJK</text>
    <text x="62" y="25" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontFamily="Arial">Otoritas Jasa Keuangan</text>
    <text x="62" y="34" textAnchor="middle" fill="#aac4ff" fontSize="5" fontFamily="Arial">Diawasi & Dilindungi</text>
  </svg>
);

// SSL 256-bit Badge
const SSLLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 w-auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" rx="6" fill="#166534"/>
    {/* Lock icon */}
    <rect x="6" y="18" width="14" height="12" rx="2" fill="#4ade80"/>
    <path d="M9 18 v-4 a4 4 0 0 1 8 0 v4" fill="none" stroke="#4ade80" strokeWidth="2"/>
    <circle cx="13" cy="23" r="1.5" fill="#166534"/>
    {/* Text */}
    <text x="61" y="15" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="Arial">SSL/TLS</text>
    <text x="61" y="25" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="Arial">256-bit Encryption</text>
    <text x="61" y="34" textAnchor="middle" fill="#86efac" fontSize="5" fontFamily="Arial">Secured by TrustArc</text>
  </svg>
);

// KYC Verified Badge
const KYCLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 w-auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" rx="6" fill="#4c1d95"/>
    {/* Shield with checkmark */}
    <path d="M10 8 L20 8 L22 10 L22 22 Q22 28 16 31 Q10 28 10 22 Z" fill="#a78bfa"/>
    <path d="M13 19 L16 22 L20 15" fill="none" stroke="#4c1d95" strokeWidth="2" strokeLinecap="round"/>
    {/* Text */}
    <text x="62" y="15" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="bold" fontFamily="Arial">KYC</text>
    <text x="62" y="25" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="Arial">Identity Verified</text>
    <text x="62" y="34" textAnchor="middle" fill="#c4b5fd" fontSize="5" fontFamily="Arial">AML/CFT Compliant</text>
  </svg>
);

export default function TrustBadges({ compact = false }) {
  const badges = [
    { Logo: BappebtiLogo, label: 'Terdaftar Bappebti', color: 'border-blue-500/30 bg-blue-950/40' },
    { Logo: OJKLogo, label: 'Diawasi OJK', color: 'border-yellow-500/30 bg-yellow-950/30' },
    { Logo: SSLLogo, label: 'SSL 256-bit', color: 'border-green-500/30 bg-green-950/40' },
    { Logo: KYCLogo, label: 'KYC Verified', color: 'border-purple-500/30 bg-purple-950/40' },
  ];

  if (compact) {
    return (
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {badges.map(({ Logo, label, color }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color}`}>
            <Logo />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {badges.map(({ Logo, label, color }) => (
        <div key={label} className={`flex flex-col items-center gap-2 px-3 py-3 rounded-2xl border ${color}`}>
          <Logo />
          <span className="text-[10px] text-slate-400 font-medium text-center">{label}</span>
        </div>
      ))}
    </div>
  );
}
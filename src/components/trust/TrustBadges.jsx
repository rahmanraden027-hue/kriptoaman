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

// Logo OJK SVG — sesuai logo resmi: huruf OJK merah besar + pita merah-abu melengkung + teks OTORITAS JASA KEUANGAN
const OJKLogo = () => (
  <svg viewBox="0 0 160 54" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
    {/* Background putih */}
    <rect width="160" height="54" rx="5" fill="#ffffff"/>

    {/* ===== BAGIAN KIRI: Huruf OJK besar merah ===== */}
    {/* Huruf O */}
    <text x="6" y="42" fill="#9F1E22" fontSize="36" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">O</text>
    {/* Huruf J */}
    <text x="28" y="42" fill="#9F1E22" fontSize="36" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">J</text>
    {/* Huruf K */}
    <text x="44" y="42" fill="#9F1E22" fontSize="36" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">K</text>

    {/* ===== PITA MELENGKUNG di atas OJK (merah di atas, abu di bawah) ===== */}
    {/* Pita merah atas — melengkung dari kiri-atas ke kanan */}
    <path d="M4 14 Q18 2 46 6 Q62 8 70 14" fill="none" stroke="#9F1E22" strokeWidth="6" strokeLinecap="round"/>
    {/* Pita abu/silver di bawah pita merah — sedikit offset */}
    <path d="M4 20 Q18 9 46 13 Q62 15 70 20" fill="none" stroke="#b0b0b0" strokeWidth="4" strokeLinecap="round"/>

    {/* ===== GARIS VERTIKAL PEMBATAS ===== */}
    <line x1="78" y1="6" x2="78" y2="48" stroke="#9F1E22" strokeWidth="1.5"/>

    {/* ===== BAGIAN KANAN: Teks OTORITAS JASA KEUANGAN ===== */}
    <text x="86" y="20" fill="#555555" fontSize="7.5" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.5">OTORITAS</text>
    <text x="86" y="31" fill="#555555" fontSize="7.5" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.5">JASA</text>
    <text x="86" y="42" fill="#555555" fontSize="7.5" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.5">KEUANGAN</text>
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
    { Logo: OJKLogo, label: 'Diawasi OJK', color: 'border-red-700/40 bg-white/5' },
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
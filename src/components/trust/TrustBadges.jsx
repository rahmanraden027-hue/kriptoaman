import React from 'react';

// ============================================================
// BAPPEBTI — Logo resmi Kementerian Perdagangan RI
// Warna: biru tua #1B3A6B, aksen biru muda, teks putih
// ============================================================
const BappebtiLogo = () => (
  <svg viewBox="0 0 150 52" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="150" height="52" rx="5" fill="#ffffff"/>

    {/* Emblem lingkaran biru Kemendag */}
    <circle cx="24" cy="26" r="20" fill="#1B3A6B"/>
    {/* Bintang Garuda di tengah emblem — disederhanakan */}
    <polygon points="24,10 26.5,19 36,19 28.5,24.5 31,34 24,28.5 17,34 19.5,24.5 12,19 21.5,19" fill="#FFD700"/>
    {/* Lingkaran putih tipis border dalam */}
    <circle cx="24" cy="26" r="18" fill="none" stroke="white" strokeWidth="1" opacity="0.4"/>

    {/* Garis vertikal separator */}
    <line x1="50" y1="8" x2="50" y2="44" stroke="#1B3A6B" strokeWidth="1.2"/>

    {/* Teks BAPPEBTI */}
    <text x="100" y="21" textAnchor="middle" fill="#1B3A6B" fontSize="12" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">BAPPEBTI</text>
    {/* Garis bawah */}
    <line x1="57" y1="25" x2="143" y2="25" stroke="#1B3A6B" strokeWidth="0.8" opacity="0.3"/>
    {/* Sub teks */}
    <text x="100" y="34" textAnchor="middle" fill="#444444" fontSize="5.5" fontFamily="Arial, sans-serif">Badan Pengawas Perdagangan</text>
    <text x="100" y="42" textAnchor="middle" fill="#444444" fontSize="5.5" fontFamily="Arial, sans-serif">Berjangka Komoditi</text>
  </svg>
);

// ============================================================
// OJK — Logo resmi: huruf OJK merah besar + pita melengkung
// Warna: merah #9F1E22, abu, teks gelap
// ============================================================
const OJKLogo = () => (
  <svg viewBox="0 0 160 54" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="160" height="54" rx="5" fill="#ffffff"/>

    {/* Huruf OJK merah besar — bold italic seperti aslinya */}
    <text x="5" y="46" fill="#9F1E22" fontSize="40" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" fontStyle="italic">OJK</text>

    {/* Pita merah melengkung di atas kiri huruf O */}
    <path d="M3 16 Q22 2 50 7 Q64 9 72 16" fill="none" stroke="#9F1E22" strokeWidth="7" strokeLinecap="round"/>
    {/* Pita abu/silver di bawah pita merah */}
    <path d="M3 23 Q22 9 50 14 Q64 16 72 23" fill="none" stroke="#c0c0c0" strokeWidth="4.5" strokeLinecap="round"/>

    {/* Garis vertikal separator */}
    <line x1="80" y1="7" x2="80" y2="47" stroke="#9F1E22" strokeWidth="1.5"/>

    {/* Teks OTORITAS JASA KEUANGAN */}
    <text x="88" y="21" fill="#333333" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.3">OTORITAS</text>
    <text x="88" y="32" fill="#333333" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.3">JASA</text>
    <text x="88" y="43" fill="#333333" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="0.3">KEUANGAN</text>
  </svg>
);

// ============================================================
// SSL 256-bit — padlock hijau + teks secure seperti badge SSL resmi
// ============================================================
const SSLLogo = () => (
  <svg viewBox="0 0 130 52" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="130" height="52" rx="5" fill="#1a6b2e"/>
    <rect width="130" height="52" rx="5" fill="none" stroke="#2d9e4a" strokeWidth="1"/>

    {/* Padlock icon */}
    <rect x="8" y="22" width="18" height="16" rx="3" fill="#4ade80"/>
    <path d="M11 22 v-5 a6 6 0 0 1 12 0 v5" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="17" cy="29" r="2.5" fill="#1a6b2e"/>
    <rect x="16" y="30" width="2" height="4" rx="1" fill="#1a6b2e"/>

    {/* Garis vertikal */}
    <line x1="34" y1="8" x2="34" y2="44" stroke="#4ade80" strokeWidth="0.8" opacity="0.5"/>

    {/* Teks */}
    <text x="82" y="19" textAnchor="middle" fill="#4ade80" fontSize="13" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">SSL/TLS</text>
    <line x1="38" y1="23" x2="126" y2="23" stroke="#4ade80" strokeWidth="0.6" opacity="0.4"/>
    <text x="82" y="33" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="Arial, sans-serif">256-bit Encryption</text>
    <text x="82" y="43" textAnchor="middle" fill="#86efac" fontSize="6" fontFamily="Arial, sans-serif">Secured Connection</text>
  </svg>
);

// ============================================================
// KYC Verified — shield biru + centang, seperti badge verifikasi identitas
// ============================================================
const KYCLogo = () => (
  <svg viewBox="0 0 130 52" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
    <rect width="130" height="52" rx="5" fill="#1e3a8a"/>
    <rect width="130" height="52" rx="5" fill="none" stroke="#3b82f6" strokeWidth="1"/>

    {/* Shield */}
    <path d="M12 8 L28 8 L30 11 L30 27 Q30 36 20 40 Q10 36 10 27 L10 11 Z" fill="#3b82f6"/>
    {/* Checkmark dalam shield */}
    <path d="M14 23 L18 28 L26 16" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>

    {/* Garis vertikal */}
    <line x1="36" y1="8" x2="36" y2="44" stroke="#3b82f6" strokeWidth="0.8" opacity="0.5"/>

    {/* Teks */}
    <text x="83" y="20" textAnchor="middle" fill="#60a5fa" fontSize="13" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">KYC</text>
    <line x1="40" y1="24" x2="126" y2="24" stroke="#3b82f6" strokeWidth="0.6" opacity="0.4"/>
    <text x="83" y="34" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="Arial, sans-serif">Identity Verified</text>
    <text x="83" y="43" textAnchor="middle" fill="#93c5fd" fontSize="6" fontFamily="Arial, sans-serif">AML/CFT Compliant</text>
  </svg>
);

export default function TrustBadges({ compact = false }) {
  const badges = [
    { Logo: BappebtiLogo, label: 'Terdaftar Bappebti', color: 'border-blue-800/40 bg-white/5' },
    { Logo: OJKLogo, label: 'Diawasi OJK', color: 'border-red-700/40 bg-white/5' },
    { Logo: SSLLogo, label: 'SSL 256-bit', color: 'border-green-500/30 bg-green-950/20' },
    { Logo: KYCLogo, label: 'KYC Verified', color: 'border-blue-500/30 bg-blue-950/20' },
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
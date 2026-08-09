import React from 'react';

/**
 * KriptoAmanLogo — logo resmi KriptoAman (ikon perisai 3D biru/emas + wordmark).
 * Props:
 *   size: number (px, default 32) — tinggi ikon perisai
 *   showText: bool (default true) — tampilkan wordmark "KRIPTOAMAN"
 *   textSize: string (tailwind class, default 'text-sm')
 *   animate: bool (default true) — glow pulse halus
 *   className: string
 */
const AMAN_BLUE = '#007bff';

export default function KriptoAmanLogo({ size = 32, showText = true, textSize = 'text-sm', animate = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center ${animate ? 'animate-ka-glow' : ''}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <style>{`
          @keyframes ka-glow {
            0%, 100% { filter: drop-shadow(0 0 3px rgba(0,123,255,0.45)); }
            50% { filter: drop-shadow(0 0 10px rgba(0,123,255,0.85)); }
          }
          .animate-ka-glow { animation: ka-glow 2.8s ease-in-out infinite; }
        `}</style>
        <svg viewBox="0 0 64 64" role="img" aria-label="KriptoAman" width={size} height={size}>
          <defs>
            <linearGradient id="kaShieldBlue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5bc0ff" />
              <stop offset="0.52" stopColor="#087cf0" />
              <stop offset="1" stopColor="#123e9b" />
            </linearGradient>
            <linearGradient id="kaShieldGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff2a8" />
              <stop offset="0.45" stopColor="#f2b93b" />
              <stop offset="1" stopColor="#a8670b" />
            </linearGradient>
          </defs>
          <path d="M32 3 56 12v17c0 15-9.4 25.7-24 32C17.4 54.7 8 44 8 29V12L32 3Z" fill="url(#kaShieldGold)" />
          <path d="M32 8 50 15v14c0 11.2-6.4 19.7-18 26-11.6-6.3-18-14.8-18-26V15L32 8Z" fill="url(#kaShieldBlue)" />
          <path d="M25 17v29h6V34l9 12h7L35.5 31 46 17h-7l-8 11V17h-6Z" fill="#fff" />
          <path d="M32 8v47c11.6-6.3 18-14.8 18-26V15L32 8Z" fill="#041e55" opacity=".2" />
        </svg>
      </div>

      {showText && (
        <span className={`font-extrabold tracking-widest uppercase ${textSize}`}>
          <span className="text-white">Kripto</span><span style={{ color: AMAN_BLUE }}>Aman</span>
        </span>
      )}
    </div>
  );
}

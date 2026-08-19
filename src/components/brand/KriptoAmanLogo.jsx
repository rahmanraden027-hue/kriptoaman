import React from 'react';

/**
 * KriptoAmanLogo — Concept C resmi KriptoAman.
 * Premium gold + neon cyan shield monogram.
 * Props:
 *   size: number (px, default 32)
 *   showText: bool (default true)
 *   textSize: string (tailwind class, default 'text-sm')
 *   animate: bool (default true)
 *   className: string
 */
const PREMIUM_GOLD = '#D4AF37';
const NEON_CYAN = '#00E5FF';

export default function KriptoAmanLogo({ size = 32, showText = true, textSize = 'text-sm', animate = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center ${animate ? 'animate-ka-luxury-glow' : ''}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <style>{`
          @keyframes ka-luxury-glow {
            0%, 100% { filter: drop-shadow(0 0 3px rgba(212,175,55,.35)) drop-shadow(0 0 5px rgba(0,229,255,.22)); }
            50% { filter: drop-shadow(0 0 8px rgba(212,175,55,.55)) drop-shadow(0 0 12px rgba(0,229,255,.38)); }
          }
          .animate-ka-luxury-glow { animation: ka-luxury-glow 3.2s ease-in-out infinite; }
        `}</style>
        <img
          src="/brand/kriptoaman-mark.svg"
          alt="KriptoAman"
          width={size}
          height={size}
          className="h-full w-full object-contain"
          decoding="async"
        />
      </div>

      {showText && (
        <span className={`font-black tracking-[0.12em] uppercase ${textSize}`} aria-label="KriptoAman">
          <span style={{ color: PREMIUM_GOLD }}>Kripto</span>
          <span style={{ color: NEON_CYAN }}>Aman</span>
        </span>
      )}
    </div>
  );
}

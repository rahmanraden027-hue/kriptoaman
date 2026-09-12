import React from 'react';

/**
 * KriptoAmanLogo — final 2026 brand identity.
 * Metallic gold K + electric-blue blockchain orbit.
 * Props:
 *   size: number (px, default 32)
 *   showText: bool (default true)
 *   textSize: string (tailwind class, default 'text-sm')
 *   animate: bool (default true)
 *   className: string
 */
const PREMIUM_GOLD = '#F2C14E';
const SILVER_WHITE = '#E8EEF6';

export default function KriptoAmanLogo({ size = 32, showText = true, textSize = 'text-sm', animate = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center ${animate ? 'animate-ka-luxury-glow' : ''}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <style>{`
          @keyframes ka-luxury-glow {
            0%, 100% { filter: drop-shadow(0 0 3px rgba(242,193,78,.34)) drop-shadow(0 0 5px rgba(0,207,255,.22)); }
            50% { filter: drop-shadow(0 0 8px rgba(242,193,78,.54)) drop-shadow(0 0 12px rgba(0,207,255,.38)); }
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
        <span className={`font-black tracking-[0.035em] ${textSize}`} aria-label="KriptoAman">
          <span style={{ color: SILVER_WHITE }}>Kripto</span>
          <span style={{ color: PREMIUM_GOLD }}>Aman</span>
        </span>
      )}
    </div>
  );
}

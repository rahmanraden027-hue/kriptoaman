import React from 'react';

/**
 * KriptoAmanLogo — official final identity.
 * Gold + electric-blue K with orbital blockchain/network motif.
 */
const PREMIUM_GOLD = '#E7B438';
const SILVER_WHITE = '#F5F8FC';

export default function KriptoAmanLogo({ size = 32, showText = true, textSize = 'text-sm', animate = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center ${animate ? 'animate-ka-luxury-glow' : ''}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <style>{`
          @keyframes ka-luxury-glow {
            0%, 100% { filter: drop-shadow(0 0 3px rgba(231,180,56,.30)) drop-shadow(0 0 5px rgba(19,207,255,.18)); }
            50% { filter: drop-shadow(0 0 7px rgba(231,180,56,.48)) drop-shadow(0 0 11px rgba(19,207,255,.32)); }
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
        <span className={`font-black tracking-[0.08em] ${textSize}`} aria-label="KriptoAman">
          <span style={{ color: SILVER_WHITE }}>Kripto</span>
          <span style={{ color: PREMIUM_GOLD }}>Aman</span>
        </span>
      )}
    </div>
  );
}

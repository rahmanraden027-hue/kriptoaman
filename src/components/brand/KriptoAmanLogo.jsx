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
const SHIELD_ICON_URL = 'https://media.base44.com/images/public/69966c5817554cf31f7ec14b/2860a6e9d_generated_image.png';
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
        <img
          src={SHIELD_ICON_URL}
          alt="KriptoAman"
          width={size}
          height={size}
          loading="eager"
          className="object-contain pointer-events-none"
          style={{ width: size, height: size }}
        />
      </div>

      {showText && (
        <span className={`font-extrabold tracking-widest uppercase ${textSize}`}>
          <span className="text-white">Kripto</span><span style={{ color: AMAN_BLUE }}>Aman</span>
        </span>
      )}
    </div>
  );
}
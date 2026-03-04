import React, { useEffect, useRef } from 'react';

/**
 * KriptoAmanLogo — animated SVG logo, konsisten di seluruh app.
 * Props:
 *   size: number (px, default 32)
 *   showText: bool (default true)
 *   textSize: string (tailwind class, default 'text-sm')
 *   animate: bool (default true) — glow pulse animation
 *   className: string
 */
export default function KriptoAmanLogo({ size = 32, showText = true, textSize = 'text-sm', animate = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center rounded-xl overflow-hidden ${animate ? 'animate-logo-glow' : ''}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <style>{`
          @keyframes logo-glow {
            0%, 100% { box-shadow: 0 0 6px 1px rgba(99,102,241,0.5); }
            50% { box-shadow: 0 0 16px 4px rgba(99,102,241,0.85); }
          }
          .animate-logo-glow { animation: logo-glow 2.8s ease-in-out infinite; }
          @keyframes logo-ring {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          .animate-ring { animation: logo-ring 2.8s ease-in-out infinite; }
          @keyframes logo-coin {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-1.5px); }
          }
          .animate-coin { animation: logo-coin 2s ease-in-out infinite; }
        `}</style>
        <svg
          width={size}
          height={size}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background */}
          <rect width="40" height="40" rx="10" fill="url(#bg_grad)" />

          {/* Shield body */}
          <path
            d="M20 7L10 11.5V19.5C10 25.2 14.3 30.5 20 32C25.7 30.5 30 25.2 30 19.5V11.5L20 7Z"
            fill="url(#shield_grad)"
            opacity="0.95"
          />

          {/* Shield inner highlight */}
          <path
            d="M20 10L13 13.7V20.5C13 24.8 16.2 28.7 20 30C23.8 28.7 27 24.8 27 20.5V13.7L20 10Z"
            fill="url(#shield_inner)"
            opacity="0.5"
          />

          {/* Coin / K letter */}
          <g className="animate-coin">
            <circle cx="20" cy="20" r="6.5" fill="url(#coin_grad)" />
            <text
              x="20"
              y="23.8"
              textAnchor="middle"
              fontSize="8"
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
              fill="white"
              letterSpacing="-0.5"
            >K</text>
          </g>

          {/* Outer ring pulse */}
          <circle
            cx="20" cy="20" r="8"
            stroke="rgba(165,180,252,0.45)"
            strokeWidth="1"
            fill="none"
            className="animate-ring"
          />

          <defs>
            <linearGradient id="bg_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="shield_grad" x1="10" y1="7" x2="30" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="shield_inner" x1="13" y1="10" x2="27" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="coin_grad" x1="13.5" y1="13.5" x2="26.5" y2="26.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span className={`font-extrabold tracking-wider text-white ${textSize}`}>
          Kripto<span className="text-indigo-400">Aman</span>
        </span>
      )}
    </div>
  );
}
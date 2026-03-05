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
        className={`relative flex items-center justify-center ${animate ? 'animate-ka-glow' : ''}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <style>{`
          @keyframes ka-glow {
            0%, 100% { filter: drop-shadow(0 0 4px rgba(0,212,255,0.5)); }
            50% { filter: drop-shadow(0 0 12px rgba(0,212,255,0.9)); }
          }
          .animate-ka-glow { animation: ka-glow 2.8s ease-in-out infinite; }
          @keyframes ka-coin-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-1px); }
          }
          .ka-coin { animation: ka-coin-float 2s ease-in-out infinite; }
          @keyframes ka-circuit {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          .ka-circuit { animation: ka-circuit 2.5s ease-in-out infinite; }
        `}</style>
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Shield outer gradient — cyan/blue */}
            <linearGradient id="ka_shield_outer" x1="24" y1="1" x2="24" y2="51" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="60%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            {/* Shield body fill */}
            <linearGradient id="ka_shield_body" x1="24" y1="4" x2="24" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0c2340" />
              <stop offset="100%" stopColor="#061220" />
            </linearGradient>
            {/* Shield inner border */}
            <linearGradient id="ka_shield_inner" x1="24" y1="6" x2="24" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.3" />
            </linearGradient>
            {/* Coin gradient gold */}
            <linearGradient id="ka_coin" x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            {/* Coin ring */}
            <linearGradient id="ka_coin_ring" x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <filter id="ka_glow_filter">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── Outer shield (cyan border) ── */}
          <path
            d="M24 1L3 9V25C3 36.5 12.5 46.5 24 50C35.5 46.5 45 36.5 45 25V9L24 1Z"
            fill="url(#ka_shield_outer)"
          />
          {/* ── Shield body (dark fill) ── */}
          <path
            d="M24 4.5L6 11.5V25C6 34.8 14.2 43.5 24 46.8C33.8 43.5 42 34.8 42 25V11.5L24 4.5Z"
            fill="url(#ka_shield_body)"
          />
          {/* ── Inner shield border ── */}
          <path
            d="M24 8L9 14.5V25C9 33 16 40.5 24 43.5C32 40.5 39 33 39 25V14.5L24 8Z"
            fill="none"
            stroke="url(#ka_shield_inner)"
            strokeWidth="0.8"
            opacity="0.7"
          />

          {/* ── Circuit lines (teal) ── */}
          <g className="ka-circuit" stroke="#2dd4bf" strokeWidth="0.7" strokeLinecap="round" opacity="0.8">
            {/* left lines */}
            <line x1="24" y1="20" x2="17" y2="20" />
            <line x1="17" y1="20" x2="14" y2="17" />
            <circle cx="14" cy="17" r="1" fill="#2dd4bf" />
            <line x1="17" y1="20" x2="14" y2="23" />
            <circle cx="14" cy="23" r="1" fill="#2dd4bf" />
            <line x1="24" y1="24" x2="16" y2="28" />
            <circle cx="16" cy="28" r="1" fill="#06b6d4" />
            {/* right lines */}
            <line x1="24" y1="20" x2="31" y2="20" />
            <line x1="31" y1="20" x2="34" y2="17" />
            <circle cx="34" cy="17" r="1" fill="#2dd4bf" />
            <line x1="31" y1="20" x2="34" y2="23" />
            <circle cx="34" cy="23" r="1" fill="#2dd4bf" />
            <line x1="24" y1="24" x2="32" y2="28" />
            <circle cx="32" cy="28" r="1" fill="#06b6d4" />
            {/* bottom */}
            <line x1="24" y1="28" x2="24" y2="34" />
            <line x1="24" y1="34" x2="21" y2="37" />
            <circle cx="21" cy="37" r="1" fill="#f59e0b" />
            <line x1="24" y1="34" x2="27" y2="37" />
            <circle cx="27" cy="37" r="1" fill="#f59e0b" />
          </g>

          {/* ── Bitcoin coin ── */}
          <g className="ka-coin">
            {/* outer ring */}
            <circle cx="24" cy="22" r="9" fill="none" stroke="url(#ka_coin_ring)" strokeWidth="1.2" />
            {/* coin body */}
            <circle cx="24" cy="22" r="7.5" fill="url(#ka_coin)" />
            {/* coin inner shine */}
            <circle cx="24" cy="22" r="7.5" fill="url(#ka_coin)" />
            <ellipse cx="21" cy="19" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.2)" />
            {/* Bitcoin B symbol */}
            <text
              x="24"
              y="26.5"
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fontFamily="Arial, system-ui, sans-serif"
              fill="#7c2d12"
              letterSpacing="-0.5"
            >₿</text>
          </g>

          {/* Cyan glow bottom of shield */}
          <ellipse cx="24" cy="49" rx="10" ry="2" fill="#06b6d4" opacity="0.3" />
        </svg>
      </div>

      {showText && (
        <span className={`font-bold tracking-tight ${textSize}`}>
          <span className="text-cyan-300">K</span><span className="text-white">ripto</span><span className="text-cyan-400">.</span><span className="text-indigo-400">id</span>
        </span>
      )}
    </div>
  );
}
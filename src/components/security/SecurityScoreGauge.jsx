import React from 'react';

export default function SecurityScoreGauge({ score }) {
  const v = Math.max(0, Math.min(100, score));
  const R = 52, C = Math.PI * R;
  const dash = (v / 100) * C;
  const color = v >= 80 ? '#2ecc71' : v >= 50 ? '#fbbf24' : '#e74c3c';
  const label = v >= 80 ? 'Kuat' : v >= 50 ? 'Cukup' : 'Lemah';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-36">
        <path d="M 8 62 A 52 52 0 0 1 112 62" fill="none" stroke="#1f2a25" strokeWidth="9" strokeLinecap="round" />
        <path d="M 8 62 A 52 52 0 0 1 112 62" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`} style={{ transition: 'stroke-dasharray .6s ease' }} />
      </svg>
      <div className="-mt-7 text-center">
        <p className="text-3xl font-extrabold ka-num leading-none" style={{ color }}>{Math.round(v)}</p>
        <p className="text-[10px] font-bold mt-0.5" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}
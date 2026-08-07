import React, { useId, useState } from 'react';

function downsample(arr, n) {
  if (!arr || arr.length <= n) return arr || [];
  const step = (arr.length - 1) / (n - 1);
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.round(i * step)]);
  return out;
}

/**
 * InteractiveSparkline — lightweight SVG sparkline with area fill and a
 * hover/touch crosshair + price tooltip. Real 7-day data passed in via `data`.
 */
export default function InteractiveSparkline({ data, up, height = 30, width = 80, valuePrefix = '$' }) {
  const gradientId = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);
  const pts = downsample(data, 40);

  if (!pts || pts.length < 2) {
    return <div className="shrink-0 rounded bg-ka-card-border/30 ka-shimmer" style={{ width, height }} />;
  }

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const X = (i) => (i / (pts.length - 1)) * width;
  const Y = (v) => height - 3 - ((v - min) / range) * (height - 6);
  const line = pts.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  const area = `${X(0)},${height} ${line} ${X(pts.length - 1)},${height}`;
  const color = up ? '#2ecc71' : '#e74c3c';

  const handle = (clientX, target) => {
    const rect = target.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(px * (pts.length - 1))));
    setHover({ idx, x: X(idx), y: Y(pts[idx]), v: pts[idx] });
  };

  return (
    <div className="relative shrink-0" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        className="block touch-none"
        onMouseMove={(e) => handle(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => { if (e.touches[0]) handle(e.touches[0].clientX, e.currentTarget); }}
        onTouchMove={(e) => { if (e.touches[0]) handle(e.touches[0].clientX, e.currentTarget); }}
        onTouchEnd={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`g${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#g${gradientId})`} />
        <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {hover && (
          <>
            <line x1={hover.x} y1="0" x2={hover.x} y2={height} stroke={color} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.55" />
            <circle cx={hover.x} cy={hover.y} r="2.5" fill={color} stroke="#0a0c0a" strokeWidth="1" />
          </>
        )}
      </svg>
      {hover && (
        <div
          className="absolute -top-5 px-1.5 py-0.5 rounded bg-[#0a0c0a] border border-ka-card-border text-[9px] font-bold ka-num pointer-events-none whitespace-nowrap z-10"
          style={{ left: Math.max(0, Math.min(width - 44, hover.x - 18)), color }}
        >
          {valuePrefix}{hover.v.toLocaleString('en-US', { maximumFractionDigits: hover.v < 1 ? 6 : 2 })}
        </div>
      )}
    </div>
  );
}
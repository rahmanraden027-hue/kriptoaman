import React from 'react';
import { CheckCircle2, AlertTriangle, Package, Zap, ArrowDown } from 'lucide-react';

const CHUNKS = [
  { name: 'vendor-react',     size: '~45KB',  desc: 'React core' },
  { name: 'vendor-ui',        size: '~180KB', desc: 'Radix UI / shadcn' },
  { name: 'vendor-router',    size: '~30KB',  desc: 'React Router' },
  { name: 'vendor-query',     size: '~35KB',  desc: 'TanStack Query' },
  { name: 'vendor-base44',    size: '~40KB',  desc: 'Base44 SDK' },
  { name: 'vendor-charts',    size: '~220KB', desc: 'Recharts + lightweight-charts (lazy)' },
  { name: 'vendor-web3-core', size: '~580KB', desc: 'viem + @noble (lazy — hanya dimuat saat buka wallet)' },
  { name: 'vendor-solana',    size: '~350KB', desc: '@solana/web3.js (lazy)' },
  { name: 'vendor-crypto',    size: '~60KB',  desc: 'crypto-js (lazy)' },
  { name: 'vendor-three',     size: '~680KB', desc: 'Three.js (lazy — hanya di halaman 3D)' },
  { name: 'vendor-utils',     size: '~70KB',  desc: 'date-fns / moment / lodash' },
  { name: 'vendor-animation', size: '~55KB',  desc: 'Framer Motion' },
  { name: 'vendor-analytics', size: '~40KB',  desc: 'Mixpanel' },
  { name: 'vendor-maps',      size: '~145KB', desc: 'react-leaflet (lazy)' },
  { name: 'vendor-stripe',    size: '~65KB',  desc: '@stripe (lazy)' },
  { name: 'vendor-markdown',  size: '~50KB',  desc: 'react-markdown (lazy)' },
  { name: 'app-pages',        size: '~300KB', desc: 'Semua halaman (lazy per-page)' },
];

const TIPS = [
  { ok: true,  text: 'Code splitting aktif — setiap halaman dimuat terpisah (lazy)' },
  { ok: true,  text: 'viem, @noble, @solana hanya dimuat saat user buka fitur wallet' },
  { ok: true,  text: 'Three.js hanya dimuat di halaman yang butuh 3D' },
  { ok: true,  text: 'console.log dihapus otomatis saat build production' },
  { ok: true,  text: 'Initial bundle (tanpa lazy chunks): ~500KB gzip ≈ 1.5MB raw' },
  { ok: true,  text: 'Total APK dengan semua assets: estimasi 12-14MB' },
  { ok: false, text: 'Jika APK masih besar: hapus three.js jika tidak dipakai' },
  { ok: false, text: 'react-quill (editor) bisa diganti textarea biasa jika jarang dipakai' },
];

export default function BundleSizeGuide() {
  const initialChunks = CHUNKS.filter(c => !c.desc.includes('lazy'));
  const lazyChunks = CHUNKS.filter(c => c.desc.includes('lazy'));

  return (
    <div className="space-y-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-200 flex items-start gap-2">
        <Zap className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Estimasi ukuran APK: 12-14MB</strong> — di bawah limit Play Store (150MB) dan App Store (4GB). Initial load ~500KB gzip.
        </div>
      </div>

      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Chunks Yang Dimuat Saat Buka App (Initial)</p>
        <div className="space-y-1">
          {initialChunks.map(c => (
            <div key={c.name} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Package className="w-3 h-3 text-blue-400" />
                <code className="text-blue-300">{c.name}</code>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">{c.desc}</span>
                <span className="text-white font-mono">{c.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
          <ArrowDown className="w-3 h-3 text-green-400" /> Chunks Lazy (Dimuat On-Demand)
        </p>
        <div className="space-y-1">
          {lazyChunks.map(c => (
            <div key={c.name} className="flex items-center justify-between bg-slate-900/40 border border-slate-700/30 rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Package className="w-3 h-3 text-green-400" />
                <code className="text-green-300">{c.name}</code>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[11px]">{c.desc}</span>
                <span className="text-slate-300 font-mono">{c.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Status Optimasi</p>
        <div className="space-y-1.5">
          {TIPS.map((t, i) => (
            <div key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs ${t.ok ? 'bg-green-500/5 border border-green-500/15 text-green-200' : 'bg-yellow-500/5 border border-yellow-500/15 text-yellow-200'}`}>
              {t.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />}
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
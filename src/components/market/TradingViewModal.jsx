import React, { useState } from 'react';
import { BarChart3, X, TrendingUp, TrendingDown } from 'lucide-react';
import TradingViewChart from './TradingViewChart';
import { COIN_META } from '../home/coinMeta';

export default function TradingViewModal({ coin, price, change24h, onClose }) {
  const meta = COIN_META[coin.sym] || {};
  const [logoError, setLogoError] = useState(false);
  const up = (change24h ?? 0) >= 0;
  const fmt = (value) => value == null ? '—' : value >= 1 ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `$${value.toFixed(6)}`;
  const fmtBig = (value) => {
    if (!value) return '—';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString('en-US')}`;
  };
  const logo = coin.image || meta.logo;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="asset-detail-title" className="fixed inset-0 z-[60] flex flex-col bg-[#06101c]/98 backdrop-blur ka-fade-up">
      <header className="flex items-center justify-between gap-3 border-b border-ka-card-border bg-[#07111d]/90 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {logo && !logoError ? <img src={logo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" onError={() => setLogoError(true)} /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10 text-[10px] font-extrabold text-sky-300">{coin.sym.slice(0, 4)}</span>}
          <div className="min-w-0"><h2 id="asset-detail-title" className="truncate text-sm font-bold text-white">{coin.sym}<span className="ka-muted font-normal">/USDT</span></h2><p className="ka-muted truncate text-[10px]">{coin.name} {coin.rank ? `· Peringkat #${coin.rank}` : ''}</p></div>
        </div>
        <div className="ml-auto text-right"><p className={`text-sm font-bold ka-num ${up ? 'text-ka-emerald' : 'text-red-400'}`}>{fmt(price)}</p><p className={`flex items-center justify-end gap-1 text-[11px] font-semibold ${up ? 'text-ka-emerald' : 'text-red-400'}`}>{up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{change24h != null ? `${up ? '+' : ''}${change24h.toFixed(2)}%` : '—'}</p></div>
        <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ka-card-border bg-ka-card ka-muted hover:text-white" aria-label="Tutup detail aset"><X className="h-5 w-5" /></button>
      </header>
      <div className="grid grid-cols-3 gap-2 border-b border-ka-card-border px-3 py-2">
        {[['Kapitalisasi',fmtBig(coin.marketCap)],['Volume 24j',fmtBig(coin.volume)],['Sumber grafik','TradingView']].map(([label,value]) => <div key={label} className="rounded-xl bg-white/[0.03] p-2 text-center"><p className="ka-muted text-[9px] uppercase">{label}</p><p className="mt-1 truncate text-xs font-bold text-white">{value}</p></div>)}
      </div>
      <div className="min-h-0 flex-1 p-2"><div className="ka-surface h-full p-2"><TradingViewChart symbol={`${coin.sym}USDT`} height="100%" /></div></div>
      <div className="flex items-start gap-2 border-t border-ka-card-border px-4 py-2 text-[10px] text-slate-500"><BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p>Grafik dapat tidak tersedia untuk pasangan tertentu. Data bersifat informatif dan bukan rekomendasi investasi.</p></div>
    </div>
  );
}

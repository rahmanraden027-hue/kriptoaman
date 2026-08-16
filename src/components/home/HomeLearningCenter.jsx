import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GraduationCap, ShieldCheck, Coins, BookOpen, TrendingUp, Wallet, ChevronRight, Clock } from 'lucide-react';

const CARDS = [
  { icon: Coins, cat: 'Dasar', title: 'Memahami DeFi', desc: 'Konsep decentralized finance & cara kerja protokol DeFi.', level: 'Pemula', mins: 8, color: '#2ecc71' },
  { icon: ShieldCheck, cat: 'Keamanan', title: 'Keamanan Kripto', desc: '5 praktik aman: 2FA, cold wallet, dan hindari phishing.', level: 'Pemula', mins: 6, color: '#10b981' },
  { icon: TrendingUp, cat: 'Trading', title: 'Trading 101', desc: 'Cara membaca candlestick, support/resistance, dan volume.', level: 'Pemula', mins: 10, color: '#14b8a6' },
  { icon: BookOpen, cat: 'Analisis', title: 'Analisis Teknikal', desc: 'Indikator RSI, MACD, dan EMA untuk entry/exit tepat.', level: 'Menengah', mins: 12, color: '#34d399' },
  { icon: Wallet, cat: 'Dompet', title: 'Custody & Self-Custody', desc: 'Perbedaan kustodian vs dompet pribadi & risikonya.', level: 'Menengah', mins: 7, color: '#6ee7b7' },
  { icon: GraduationCap, cat: 'Lanjutan', title: 'Strategi DCA vs Lump Sum', desc: 'Kapan menggunakan dollar-cost averaging vs beli sekaligus.', level: 'Lanjutan', mins: 9, color: '#2ecc71' },
];

const levelClass = (l) =>
  l === 'Pemula' ? 'text-ka-emerald bg-ka-emerald/12 border-ka-emerald/25'
  : l === 'Menengah' ? 'text-yellow-400 bg-yellow-500/12 border-yellow-500/25'
  : 'text-orange-400 bg-orange-500/12 border-orange-500/25';

export default function HomeLearningCenter() {
  return (
    <div className="ka-surface p-4 ka-fade-up" style={{ animationDelay: '360ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-ka-emerald" /> Pusat Edukasi
        </h3>
        <Link to={createPageUrl('Edukasi')} className="ka-muted hover:text-ka-emerald transition tap-reset"><ChevronRight className="w-4 h-4" /></Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {CARDS.map(({ icon: Icon, cat, title, desc, level, mins, color }) => (
          <Link key={title} to={createPageUrl('Edukasi')}
            className="min-w-[86%] sm:min-w-[220px] sm:max-w-[220px] ka-surface ka-surface-hover p-4 shrink-0 snap-start relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}1f`, border: `1px solid ${color}40` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-[9px] font-bold ka-muted uppercase tracking-wide text-right">{cat}</span>
            </div>
            <p className="text-white text-sm font-bold leading-snug whitespace-normal break-words">{title}</p>
            <p className="ka-muted text-[11px] mt-1.5 leading-relaxed line-clamp-2 min-h-[34px]">{desc}</p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-ka-card-border">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${levelClass(level)}`}>{level}</span>
              <span className="text-[10px] ka-muted flex items-center gap-1"><Clock className="w-3 h-3" />{mins} mnt</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
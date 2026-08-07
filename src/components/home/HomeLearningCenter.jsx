import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { GraduationCap, ShieldCheck, Coins, ChevronRight } from 'lucide-react';

const CARDS = [
  { icon: GraduationCap, title: 'Memahami DeFi', desc: 'Dasar decentralized finance untuk pemula', color: '#2ecc71' },
  { icon: ShieldCheck, title: 'Keamanan Kripto', desc: '5 praktik aman melindungi aset Anda', color: '#10b981' },
  { icon: Coins, title: 'Trading 101', desc: 'Cara beli & jual kripto pertama kali', color: '#14b8a6' },
];

export default function HomeLearningCenter() {
  return (
    <div className="ka-surface p-4 ka-fade-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-ka-emerald" /> Pusat Edukasi
        </h3>
        <Link to={createPageUrl('Edukasi')} className="text-ka-muted hover:text-ka-emerald transition tap-reset"><ChevronRight className="w-4 h-4" /></Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {CARDS.map(({ icon: Icon, title, desc, color }) => (
          <Link key={title} to={createPageUrl('Edukasi')}
            className="min-w-[170px] ka-surface ka-surface-hover p-3.5 shrink-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5" style={{ background: `${color}1f`, border: `1px solid ${color}40` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-white text-xs font-bold leading-snug">{title}</p>
            <p className="ka-muted text-[10px] mt-1 leading-relaxed line-clamp-2">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
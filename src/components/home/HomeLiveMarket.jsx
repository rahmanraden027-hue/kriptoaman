import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { COIN_META, LIVE_COINS } from './coinMeta';
import { Wifi, WifiOff, ChevronRight, ShieldCheck, Search } from 'lucide-react';

const TABS = ['IDR', 'Hot', 'Untung', 'Rugi'];

export default function HomeLiveMarket({ prices, markets, idrRate, connected }) {
  const [activeTab, setActiveTab] = useState('IDR');

  const fmtIDR = (usd) => {
    if (usd == null) return '—';
    const v = usd * (idrRate || 0);
    if (!v) return '—';
    if (v >= 1e9) return `Rp${(v / 1e9).toFixed(2)} M`;
    if (v >= 1e6) return `Rp${(v / 1e6).toFixed(2)} Jt`;
    if (v >= 1e3) return `Rp${v.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
    return `Rp${v.toLocaleString('id-ID', { maximumFractionDigits: 4 })}`;
  };

  const rows = useMemo(() => {
    const data = LIVE_COINS.map((sym) => {
      const market = markets[sym];
      const live = prices[sym];
      return {
        sym,
        meta: COIN_META[sym] || {},
        market,
        price: live?.price ?? market?.price,
        change: live?.change24h ?? market?.change24h,
        tick: live?.tick,
      };
    });

    if (activeTab === 'Untung') return [...data].sort((a, b) => (b.change ?? -Infinity) - (a.change ?? -Infinity));
    if (activeTab === 'Rugi') return [...data].sort((a, b) => (a.change ?? Infinity) - (b.change ?? Infinity));
    if (activeTab === 'Hot') return [...data].sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0));
    return data;
  }, [activeTab, markets, prices]);

  return (
    <section className="ka-surface overflow-hidden ka-fade-up" style={{ animationDelay: '120ms' }}>
      <div className="relative overflow-hidden border-b border-sky-400/15 bg-gradient-to-br from-[#0b2742] via-[#0a1b30] to-[#08121f] p-4 sm:p-5">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-16 h-24 w-24 rounded-full bg-amber-300/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/35 bg-[#07111d]/80 shadow-[0_0_24px_rgba(56,189,248,0.14)]">
              <ShieldCheck className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300">KriptoAman Market</p>
              <h3 className="mt-1 text-base font-extrabold text-white sm:text-lg">Pantau pasar dengan lebih aman</h3>
              <p className="mt-1 max-w-md text-[11px] leading-relaxed text-slate-300">
                Harga IDR, pergerakan 24 jam, dan lebih dari 2.000 aset dalam satu tampilan transparan.
              </p>
            </div>
          </div>
          <span className={`hidden shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${
            connected
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
              : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
          }`}>
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Data live' : 'Menghubungkan'}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-sky-400/15 bg-[#07111d]/70 px-3 py-2.5 text-slate-400">
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate text-xs">Cari aset di halaman Pasar Kripto</span>
          <Link to={createPageUrl('Market')} className="ml-auto shrink-0 text-[10px] font-bold text-sky-300 hover:text-white">
            Cari
          </Link>
        </div>

        <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-white/10">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative min-w-[64px] px-3 pb-3 pt-1 text-xs font-bold transition-colors ${
                activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
              {activeTab === tab && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-sky-400" />}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          <span>Nama</span>
          <span className="text-right">Harga</span>
          <span className="w-[82px] text-center">24 Jam</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {rows.map(({ sym, meta, price, change, tick }) => {
            const up = (change ?? 0) >= 0;
            return (
              <Link
                key={sym}
                to={createPageUrl('Market')}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-1 py-3 transition-colors hover:bg-white/[0.035]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img src={meta.logo} alt={sym} className="h-9 w-9 shrink-0 rounded-full bg-white/5" loading="lazy" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-white">{sym}</p>
                    <p className="truncate text-[10px] text-slate-500">{meta.name}</p>
                  </div>
                </div>
                <p className={`whitespace-nowrap text-right text-xs font-bold ka-num sm:text-sm ${
                  tick === 'up' ? 'text-emerald-300' : tick === 'down' ? 'text-rose-300' : 'text-white'
                }`}>
                  {fmtIDR(price)}
                </p>
                <span className={`w-[82px] rounded-xl px-2 py-2 text-center text-xs font-extrabold ka-num ${
                  change == null
                    ? 'bg-slate-700/60 text-slate-300'
                    : up
                      ? 'bg-emerald-400/90 text-[#04150f]'
                      : 'bg-rose-500/90 text-white'
                }`}>
                  {change != null ? `${up ? '+' : ''}${change.toFixed(2)}%` : '—'}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          to={createPageUrl('Market')}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl border border-sky-400/20 bg-sky-400/[0.07] py-3 text-xs font-extrabold text-sky-300 transition hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-white"
        >
          Lihat semua 2.000+ aset
          <ChevronRight className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-center text-[9px] leading-relaxed text-slate-600">
          Informasi pasar bersifat informatif, bukan ajakan membeli atau menjual aset kripto.
        </p>
      </div>
    </section>
  );
}

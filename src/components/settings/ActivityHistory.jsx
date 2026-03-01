import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Shield, Settings, LogIn, TrendingUp, Filter } from 'lucide-react';
import { format, subDays, subHours } from 'date-fns';
import { id } from 'date-fns/locale';

const ACTIVITY_TYPES = {
  send: { label: 'Kirim', icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-500/10' },
  receive: { label: 'Terima', icon: ArrowDownLeft, color: 'text-green-400', bg: 'bg-green-500/10' },
  swap: { label: 'Swap', icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  trade: { label: 'Trade', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  login: { label: 'Login', icon: LogIn, color: 'text-slate-400', bg: 'bg-slate-700' },
  security: { label: 'Keamanan', icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  settings: { label: 'Pengaturan', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-700' },
};

const MOCK_ACTIVITIES = [
  { id: 1, type: 'receive', title: 'Terima BTC', description: '0.0025 BTC dari bc1q...4f8a', amount: '+$118.50', date: subHours(new Date(), 2) },
  { id: 2, type: 'swap', title: 'Swap ETH → USDT', description: '0.15 ETH ditukar ke USDT via THORChain', amount: '+$412.00', date: subHours(new Date(), 5) },
  { id: 3, type: 'login', title: 'Login berhasil', description: 'Chrome · Jakarta, ID · 103.x.x.x', amount: null, date: subHours(new Date(), 8) },
  { id: 4, type: 'send', title: 'Kirim ETH', description: '0.05 ETH ke 0x1a2b...9f0c', amount: '-$137.50', date: subDays(new Date(), 1) },
  { id: 5, type: 'trade', title: 'Auto-Trade Eksekusi', description: 'ETH/USDT · Strategi RSI Crossover', amount: '+$23.40', date: subDays(new Date(), 1) },
  { id: 6, type: 'security', title: 'PIN Diaktifkan', description: 'Kunci PIN aplikasi diaktifkan', amount: null, date: subDays(new Date(), 2) },
  { id: 7, type: 'receive', title: 'Terima USDT', description: '250 USDT dari 0xabc...123', amount: '+$250.00', date: subDays(new Date(), 3) },
  { id: 8, type: 'swap', title: 'Swap BTC → ETH', description: '0.001 BTC ditukar ke ETH via THORChain', amount: '+0.015 ETH', date: subDays(new Date(), 4) },
  { id: 9, type: 'settings', title: 'Preferensi Diperbarui', description: 'Tema, notifikasi, dan auto-refresh diubah', amount: null, date: subDays(new Date(), 5) },
  { id: 10, type: 'send', title: 'Kirim BTC', description: '0.001 BTC ke bc1q...9k2m', amount: '-$47.20', date: subDays(new Date(), 7) },
];

const FILTERS = ['Semua', 'Transaksi', 'Login', 'Sistem'];
const filterMap = {
  Semua: null,
  Transaksi: ['send', 'receive', 'swap', 'trade'],
  Login: ['login'],
  Sistem: ['security', 'settings'],
};

export default function ActivityHistory() {
  const [activeFilter, setActiveFilter] = useState('Semua');

  const filtered = MOCK_ACTIVITIES.filter(a => {
    const allowed = filterMap[activeFilter];
    return !allowed || allowed.includes(a.type);
  });

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 ml-0.5" />
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeFilter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl divide-y divide-slate-700/30">
        {filtered.map((activity, idx) => {
          const cfg = ACTIVITY_TYPES[activity.type];
          const Icon = cfg.icon;
          return (
            <div key={activity.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{activity.title}</p>
                <p className="text-slate-500 text-[11px] truncate mt-0.5">{activity.description}</p>
              </div>
              <div className="text-right shrink-0">
                {activity.amount && (
                  <p className={`text-sm font-bold ${activity.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {activity.amount}
                  </p>
                )}
                <p className="text-slate-600 text-[10px] mt-0.5">
                  {format(activity.date, 'd MMM, HH:mm', { locale: id })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-slate-600 text-xs">Menampilkan 10 aktivitas terakhir</p>
    </div>
  );
}
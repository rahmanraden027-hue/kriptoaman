import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings2, Eye, EyeOff, GripVertical, ArrowUpDown,
  SortAsc, SortDesc, Sun, Moon, X, Check, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'wallet_personalization';

const DEFAULT_SECTIONS = [
  { id: 'passive',   label: 'Passive Income',       visible: true },
  { id: 'analytics', label: 'Portfolio Analytics',  visible: true },
  { id: 'chart',     label: 'Portfolio Chart',       visible: true },
  { id: 'swap',      label: 'Swap Widget',           visible: true },
  { id: 'bridge',    label: 'Cross-Chain Bridge',    visible: true },
  { id: 'txhistory', label: 'Riwayat Transaksi',     visible: true },
  { id: 'staking',   label: 'Staking',               visible: true },
  { id: 'tokens',    label: 'Custom Tokens',         visible: true },
];

const COIN_LIST = [
  { id: 'BTC', label: 'Bitcoin',   color: '#F7931A' },
  { id: 'ETH', label: 'Ethereum',  color: '#627EEA' },
  { id: 'BNB', label: 'BNB',       color: '#F0B90B' },
  { id: 'SOL', label: 'Solana',    color: '#9945FF' },
  { id: 'MATIC',label: 'Polygon',  color: '#8247E5' },
  { id: 'LTC', label: 'Litecoin',  color: '#345D9D' },
  { id: 'DOGE',label: 'Dogecoin',  color: '#C2A633' },
];

export function loadPersonalization() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function savePersonalization(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDefaults() {
  return {
    sections: DEFAULT_SECTIONS,
    hiddenCoins: [],
    coinSortMode: 'manual', // manual | value | name
    theme: 'dark',
  };
}

export function usePersonalization() {
  const [prefs, setPrefs] = useState(() => {
    const saved = loadPersonalization();
    if (!saved) return getDefaults();
    // Merge with defaults to handle new sections
    const base = getDefaults();
    return {
      ...base,
      ...saved,
      sections: base.sections.map(def => {
        const found = (saved.sections || []).find(s => s.id === def.id);
        return found ? { ...def, ...found } : def;
      }),
    };
  });

  const update = useCallback((patch) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      savePersonalization(next);
      return next;
    });
  }, []);

  const toggleSection = useCallback((id) => {
    setPrefs(prev => {
      const next = {
        ...prev,
        sections: prev.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s),
      };
      savePersonalization(next);
      return next;
    });
  }, []);

  const toggleCoin = useCallback((coinId) => {
    setPrefs(prev => {
      const hidden = prev.hiddenCoins.includes(coinId)
        ? prev.hiddenCoins.filter(c => c !== coinId)
        : [...prev.hiddenCoins, coinId];
      const next = { ...prev, hiddenCoins: hidden };
      savePersonalization(next);
      return next;
    });
  }, []);

  const moveSectionUp = useCallback((id) => {
    setPrefs(prev => {
      const idx = prev.sections.findIndex(s => s.id === id);
      if (idx <= 0) return prev;
      const arr = [...prev.sections];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      const next = { ...prev, sections: arr };
      savePersonalization(next);
      return next;
    });
  }, []);

  const moveSectionDown = useCallback((id) => {
    setPrefs(prev => {
      const idx = prev.sections.findIndex(s => s.id === id);
      if (idx < 0 || idx >= prev.sections.length - 1) return prev;
      const arr = [...prev.sections];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      const next = { ...prev, sections: arr };
      savePersonalization(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const def = getDefaults();
    savePersonalization(def);
    setPrefs(def);
  }, []);

  return { prefs, update, toggleSection, toggleCoin, moveSectionUp, moveSectionDown, reset };
}

// ─── Panel Component ────────────────────────────────────────────────────────

export default function WalletPersonalization({ onClose, prefs, onToggleSection, onToggleCoin, onMoveSectionUp, onMoveSectionDown, onSortChange, onThemeChange, onReset }) {
  const [tab, setTab] = useState('sections'); // sections | coins | theme

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-violet-400" />
            <span className="text-white font-semibold">Personalisasi Wallet</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onReset} className="text-slate-500 hover:text-red-400 transition-colors" title="Reset ke default">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          {[
            { id: 'sections', label: 'Widget' },
            { id: 'coins',    label: 'Token' },
            { id: 'theme',    label: 'Tampilan' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tab === t.id ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-500 hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* ── SECTIONS TAB ── */}
          {tab === 'sections' && (
            <>
              <p className="text-slate-500 text-xs">Tampilkan/sembunyikan widget dan atur urutannya.</p>
              {prefs.sections.map((section, idx) => (
                <div key={section.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${section.visible ? 'border-slate-700/50 bg-slate-800/40' : 'border-slate-800/50 bg-slate-900/40 opacity-60'}`}>
                  <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className={`flex-1 text-sm font-medium ${section.visible ? 'text-white' : 'text-slate-500'}`}>{section.label}</span>
                  {/* Move up/down */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => onMoveSectionUp(section.id)} disabled={idx === 0}
                      className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 2L9 8H1L5 2Z" fill="currentColor"/></svg>
                    </button>
                    <button onClick={() => onMoveSectionDown(section.id)} disabled={idx === prefs.sections.length - 1}
                      className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 8L1 2H9L5 8Z" fill="currentColor"/></svg>
                    </button>
                  </div>
                  {/* Toggle visibility */}
                  <button onClick={() => onToggleSection(section.id)}
                    className={`p-1.5 rounded-lg border transition-all ${section.visible ? 'bg-violet-600/20 border-violet-600/30 text-violet-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                    {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ── COINS TAB ── */}
          {tab === 'coins' && (
            <>
              <p className="text-slate-500 text-xs">Sembunyikan koin yang tidak ingin ditampilkan di dashboard.</p>

              {/* Sort mode */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
                <p className="text-slate-400 text-xs font-semibold">Urutan Token</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'manual', label: 'Manual', icon: <GripVertical className="w-3.5 h-3.5" /> },
                    { id: 'value',  label: 'Nilai',  icon: <SortDesc className="w-3.5 h-3.5" /> },
                    { id: 'name',   label: 'Nama',   icon: <SortAsc className="w-3.5 h-3.5" /> },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => onSortChange(opt.id)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${prefs.coinSortMode === opt.id ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coin visibility */}
              <div className="space-y-2">
                {COIN_LIST.map(coin => {
                  const hidden = prefs.hiddenCoins.includes(coin.id);
                  return (
                    <div key={coin.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${hidden ? 'border-slate-800/50 bg-slate-900/40 opacity-60' : 'border-slate-700/50 bg-slate-800/40'}`}>
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: coin.color }}>{coin.id.slice(0, 1)}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${hidden ? 'text-slate-500' : 'text-white'}`}>{coin.label}</p>
                        <p className="text-slate-600 text-[10px]">{coin.id}</p>
                      </div>
                      <button onClick={() => onToggleCoin(coin.id)}
                        className={`p-1.5 rounded-lg border transition-all ${!hidden ? 'bg-violet-600/20 border-violet-600/30 text-violet-400' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                        {!hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── THEME TAB ── */}
          {tab === 'theme' && (
            <>
              <p className="text-slate-500 text-xs">Pilih tema antarmuka wallet.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: 'dark',
                    label: 'Gelap',
                    icon: <Moon className="w-6 h-6 text-indigo-400" />,
                    bg: 'bg-slate-900',
                    preview: ['bg-slate-800', 'bg-slate-700', 'bg-blue-500'],
                  },
                  {
                    id: 'light',
                    label: 'Terang',
                    icon: <Sun className="w-6 h-6 text-yellow-400" />,
                    bg: 'bg-slate-100',
                    preview: ['bg-white', 'bg-slate-200', 'bg-blue-500'],
                  },
                ].map(t => {
                  const active = prefs.theme === t.id;
                  return (
                    <button key={t.id} onClick={() => onThemeChange(t.id)}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${active ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'}`}>
                      {active && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {/* Mini preview */}
                      <div className={`w-full h-16 rounded-xl ${t.bg} p-2 space-y-1.5`}>
                        {t.preview.map((c, i) => (
                          <div key={i} className={`h-2.5 rounded-full ${c}`} style={{ width: i === 0 ? '80%' : i === 1 ? '60%' : '40%' }} />
                        ))}
                      </div>
                      {t.icon}
                      <span className={`text-sm font-semibold ${active ? 'text-violet-300' : 'text-slate-300'}`}>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {prefs.theme === 'light' && (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mt-2">
                  <Sun className="w-4 h-4 text-yellow-400 shrink-0" />
                  <p className="text-yellow-300 text-xs">Tema terang aktif. Beberapa elemen mungkin terlihat berbeda.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <Button onClick={onClose} className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm">
            Simpan & Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
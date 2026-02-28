import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAddressInfo, getBtcPrice } from './bitcoinApi';
import { satoshiToBtc } from './walletUtils';
import { Bell, X, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, CheckCircle2, Award, Clock, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

let globalNotifId = 0;

// ── Browser Push Notification helper ────────────────────────────────────────
async function requestPushPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

function sendPush(title, body, icon = '₿') {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: title, // dedup same-title notifs
      silent: false,
    });
  } catch (_) { /* silently fail if blocked */ }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useNotifications(address) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [pushEnabled, setPushEnabled]     = useState(
    typeof window !== 'undefined' && Notification?.permission === 'granted'
  );
  const prevPriceRef     = useRef(null);
  const prevBalanceRef   = useRef(null);
  const prevTxCountRef   = useRef(null);
  // Staking reminder: track last reminder time in ref
  const lastStakingReminderRef = useRef(null);

  const addNotif = useCallback((notif) => {
    const id = ++globalNotifId;
    setNotifications(prev => [{ ...notif, id, time: new Date() }, ...prev].slice(0, 80));
    setUnread(u => u + 1);
    // Mirror to browser push
    if (notif.push !== false) sendPush(notif.title, notif.body || '');
  }, []);

  // Enable push from outside
  const enablePush = useCallback(async () => {
    const result = await requestPushPermission();
    setPushEnabled(result === 'granted');
    return result;
  }, []);

  // ── 1. Price alerts (BTC ±2%) ─────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const price = await getBtcPrice().catch(() => null);
      if (!price) return;
      if (prevPriceRef.current !== null) {
        const change = ((price - prevPriceRef.current) / prevPriceRef.current) * 100;
        if (Math.abs(change) >= 2) {
          addNotif({
            type: 'price',
            icon: change > 0 ? 'up' : 'down',
            title: `BTC ${change > 0 ? 'naik' : 'turun'} ${Math.abs(change).toFixed(1)}%`,
            body: `Harga sekarang: $${price.toLocaleString()}`,
          });
        }
      }
      prevPriceRef.current = price;
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, [addNotif]);

  // ── 2. Transaction notifications ──────────────────────────────────────────
  useEffect(() => {
    if (!address) return;
    const check = async () => {
      const info = await getAddressInfo(address).catch(() => null);
      if (!info) return;
      const txCount    = info.n_tx || 0;
      const balance    = info.balance || 0;
      const unconfirmed = info.unconfirmed_balance || 0;

      if (prevBalanceRef.current !== null) {
        const diff = balance - prevBalanceRef.current;
        if (diff > 0) {
          addNotif({ type: 'received', icon: 'in',  title: '✅ Bitcoin diterima!',  body: `+${satoshiToBtc(diff)} BTC dikonfirmasi` });
        } else if (diff < 0) {
          addNotif({ type: 'sent',     icon: 'out', title: '✅ Bitcoin terkirim',   body: `${satoshiToBtc(Math.abs(diff))} BTC dikonfirmasi` });
        }
      }
      if (prevTxCountRef.current !== null && txCount > prevTxCountRef.current && unconfirmed > 0) {
        addNotif({ type: 'pending', icon: 'pending', title: '⏳ Transaksi terdeteksi', body: `${satoshiToBtc(Math.abs(unconfirmed))} BTC menunggu konfirmasi` });
      }

      prevBalanceRef.current  = balance;
      prevTxCountRef.current  = txCount;
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [address, addNotif]);

  // ── 3. Staking reward notifications (check every 6 hours) ─────────────────
  useEffect(() => {
    const checkStaking = () => {
      const STORAGE_KEY = 'wallet_staking_positions_v2';
      let positions = [];
      try { positions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return; }

      positions.forEach(pos => {
        const daysActive = Math.max(1, Math.floor((Date.now() - new Date(pos.stakedAt).getTime()) / 86400000));
        const netApy     = pos.apy * (1 - (pos.fee || 0) / 100);
        const rewards    = parseFloat((pos.amount * netApy / 100 / 365 * daysActive).toFixed(6));
        if (rewards > 0.000001) {
          addNotif({
            type:  'reward',
            icon:  'reward',
            title: `🏆 Reward staking ${pos.coin} tersedia`,
            body:  `+${rewards} ${pos.coin} dari ${pos.providerName} siap diklaim`,
          });
        }
      });
    };
    // Run once after 5s, then every 6 hours
    const to = setTimeout(checkStaking, 5000);
    const iv = setInterval(checkStaking, 6 * 60 * 60 * 1000);
    return () => { clearTimeout(to); clearInterval(iv); };
  }, [addNotif]);

  // ── 4. Staking review reminder (once per day) ─────────────────────────────
  useEffect(() => {
    const REMINDER_KEY = 'wallet_staking_reminder_ts';
    const check = () => {
      const last = parseInt(localStorage.getItem(REMINDER_KEY) || '0', 10);
      if (Date.now() - last < 24 * 60 * 60 * 1000) return;
      const STORAGE_KEY = 'wallet_staking_positions_v2';
      let positions = [];
      try { positions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return; }
      if (positions.length === 0) return;
      localStorage.setItem(REMINDER_KEY, String(Date.now()));
      addNotif({
        type:  'reminder',
        icon:  'reminder',
        title: '🔔 Tinjau posisi staking Anda',
        body:  `Anda memiliki ${positions.length} posisi aktif — cek reward & optimasi alokasi.`,
      });
    };
    const to = setTimeout(check, 10000);
    return () => clearTimeout(to);
  }, [addNotif]);

  const markAllRead = useCallback(() => setUnread(0), []);
  const dismiss     = useCallback((id) => setNotifications(prev => prev.filter(n => n.id !== id)), []);

  return { notifications, unread, markAllRead, dismiss, addNotif, pushEnabled, enablePush };
}

// ── Visual config ─────────────────────────────────────────────────────────────
const ICONS = {
  up:       <TrendingUp    className="w-4 h-4 text-green-400" />,
  down:     <TrendingDown  className="w-4 h-4 text-red-400" />,
  in:       <ArrowDownLeft className="w-4 h-4 text-green-400" />,
  out:      <ArrowUpRight  className="w-4 h-4 text-orange-400" />,
  pending:  <CheckCircle2  className="w-4 h-4 text-yellow-400" />,
  trade:    <CheckCircle2  className="w-4 h-4 text-orange-400" />,
  reward:   <Award         className="w-4 h-4 text-purple-400" />,
  reminder: <Clock         className="w-4 h-4 text-blue-400" />,
};

const BG = {
  price:    'border-blue-500/30 bg-blue-500/10',
  received: 'border-green-500/30 bg-green-500/10',
  sent:     'border-orange-500/30 bg-orange-500/10',
  pending:  'border-yellow-500/30 bg-yellow-500/10',
  trade:    'border-orange-500/30 bg-orange-500/10',
  reward:   'border-purple-500/30 bg-purple-500/10',
  reminder: 'border-blue-500/30 bg-blue-500/10',
};

const TYPE_LABELS = {
  price: 'Harga',
  received: 'Masuk',
  sent: 'Keluar',
  pending: 'Pending',
  trade: 'Trade',
  reward: 'Staking',
  reminder: 'Pengingat',
};

// ── UI Component ──────────────────────────────────────────────────────────────
export default function NotificationCenter({ notifications, unread, onMarkRead, onDismiss, pushEnabled, onEnablePush }) {
  const [open, setOpen]       = useState(false);
  const [filter, setFilter]   = useState('all');

  const toggle = () => {
    setOpen(o => !o);
    if (!open) onMarkRead();
  };

  const types  = ['all', ...Array.from(new Set(notifications.map(n => n.type)))];
  const shown  = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  return (
    <div className="relative">
      <button onClick={toggle} className="relative p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors">
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <span className="text-white font-semibold text-sm">Notifikasi</span>
                <div className="flex items-center gap-2">
                  {/* Push toggle */}
                  {onEnablePush && (
                    <button
                      onClick={onEnablePush}
                      title={pushEnabled ? 'Push aktif' : 'Aktifkan push notification'}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg border transition-colors ${pushEnabled ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-slate-600 text-slate-400 hover:text-white'}`}
                    >
                      <Bell className="w-3 h-3" />
                      {pushEnabled ? 'Push ON' : 'Push OFF'}
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              {notifications.length > 0 && (
                <div className="flex gap-1 px-3 py-2 border-b border-slate-800 overflow-x-auto">
                  {types.map(t => (
                    <button key={t} onClick={() => setFilter(t)}
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-lg border transition-colors ${filter === t ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}
                    >
                      {t === 'all' ? 'Semua' : (TYPE_LABELS[t] || t)}
                    </button>
                  ))}
                </div>
              )}

              {/* List */}
              <div className="max-h-96 overflow-y-auto">
                {shown.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Belum ada notifikasi</p>
                    {!pushEnabled && onEnablePush && (
                      <button onClick={onEnablePush} className="mt-3 text-xs text-orange-400 border border-orange-400/30 rounded-lg px-3 py-1.5 hover:bg-orange-400/10 transition-colors">
                        Aktifkan Push Notification
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {shown.map(n => (
                      <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-l-2 ${BG[n.type] || 'border-slate-500/30 bg-slate-800/30'}`}>
                        <div className="mt-0.5 shrink-0">{ICONS[n.icon] || ICONS.pending}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium leading-snug">{n.title}</p>
                          {n.body && <p className="text-slate-400 text-xs mt-0.5">{n.body}</p>}
                          <p className="text-slate-600 text-xs mt-0.5">
                            {n.time instanceof Date
                              ? n.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                              : new Date(n.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button onClick={() => onDismiss(n.id)} className="text-slate-600 hover:text-slate-400 shrink-0 mt-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
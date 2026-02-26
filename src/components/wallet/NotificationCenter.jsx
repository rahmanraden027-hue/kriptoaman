import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAddressInfo, getBtcPrice } from './bitcoinApi';
import { satoshiToBtc } from './walletUtils';
import { Bell, X, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

let globalNotifId = 0;

export function useNotifications(address) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const prevPriceRef = useRef(null);
  const prevBalanceRef = useRef(null);
  const prevTxCountRef = useRef(null);
  const prevConfirmationsRef = useRef({});

  const addNotif = useCallback((notif) => {
    const id = ++globalNotifId;
    setNotifications(prev => [{ ...notif, id, time: new Date() }, ...prev].slice(0, 50));
    setUnread(u => u + 1);
  }, []);

  // Poll price every 60s, alert on ±2% change
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
            title: `Harga BTC ${change > 0 ? 'naik' : 'turun'} ${Math.abs(change).toFixed(1)}%`,
            body: `Harga sekarang: $${price.toLocaleString()}`,
          });
        }
      }
      prevPriceRef.current = price;
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [addNotif]);

  // Poll address every 30s for new txs & confirmations
  useEffect(() => {
    if (!address) return;
    const check = async () => {
      const info = await getAddressInfo(address).catch(() => null);
      if (!info) return;

      const txCount = info.n_tx || 0;
      const balance = info.balance || 0;
      const unconfirmed = info.unconfirmed_balance || 0;

      // New incoming tx (unconfirmed balance increased)
      if (prevBalanceRef.current !== null) {
        const balanceDiff = balance - prevBalanceRef.current;
        if (balanceDiff > 0) {
          addNotif({
            type: 'received',
            icon: 'in',
            title: 'Bitcoin diterima!',
            body: `+${satoshiToBtc(balanceDiff)} BTC telah dikonfirmasi`,
          });
        } else if (balanceDiff < 0) {
          addNotif({
            type: 'sent',
            icon: 'out',
            title: 'Bitcoin terkirim',
            body: `${satoshiToBtc(Math.abs(balanceDiff))} BTC telah dikonfirmasi`,
          });
        }
      }

      // New unconfirmed tx
      if (prevTxCountRef.current !== null && txCount > prevTxCountRef.current) {
        if (unconfirmed > 0) {
          addNotif({
            type: 'pending',
            icon: 'pending',
            title: 'Transaksi terdeteksi',
            body: `${satoshiToBtc(Math.abs(unconfirmed))} BTC menunggu konfirmasi`,
          });
        }
      }

      prevBalanceRef.current = balance;
      prevTxCountRef.current = txCount;
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [address, addNotif]);

  const markAllRead = useCallback(() => setUnread(0), []);
  const dismiss = useCallback((id) => setNotifications(prev => prev.filter(n => n.id !== id)), []);

  return { notifications, unread, markAllRead, dismiss, addNotif };
}

const ICONS = {
  up: <TrendingUp className="w-4 h-4 text-green-400" />,
  down: <TrendingDown className="w-4 h-4 text-red-400" />,
  in: <ArrowDownLeft className="w-4 h-4 text-green-400" />,
  out: <ArrowUpRight className="w-4 h-4 text-red-400" />,
  pending: <CheckCircle2 className="w-4 h-4 text-yellow-400" />,
  trade: <CheckCircle2 className="w-4 h-4 text-orange-400" />,
  swap_pending: <CheckCircle2 className="w-4 h-4 text-yellow-400" />,
  swap_submitted: <CheckCircle2 className="w-4 h-4 text-violet-400" />,
  swap_confirmed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  swap_failed: <CheckCircle2 className="w-4 h-4 text-red-400" />,
  stake_pending: <CheckCircle2 className="w-4 h-4 text-yellow-400" />,
  stake_confirmed: <CheckCircle2 className="w-4 h-4 text-orange-400" />,
};

const BG = {
  price: 'border-blue-500/30 bg-blue-500/10',
  received: 'border-green-500/30 bg-green-500/10',
  sent: 'border-red-500/30 bg-red-500/10',
  pending: 'border-yellow-500/30 bg-yellow-500/10',
  trade: 'border-orange-500/30 bg-orange-500/10',
  swap_pending: 'border-yellow-500/30 bg-yellow-500/10',
  swap_submitted: 'border-violet-500/30 bg-violet-500/10',
  swap_confirmed: 'border-green-500/30 bg-green-500/10',
  swap_failed: 'border-red-500/30 bg-red-500/10',
  stake_pending: 'border-yellow-500/30 bg-yellow-500/10',
  stake_confirmed: 'border-orange-500/30 bg-orange-500/10',
};

export default function NotificationCenter({ notifications, unread, onMarkRead, onDismiss }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen(o => !o);
    if (!open) onMarkRead();
  };

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
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <span className="text-white font-semibold text-sm">Notifikasi</span>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Belum ada notifikasi</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {notifications.map(n => (
                      <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-l-2 ${BG[n.type] || 'border-slate-500/30 bg-slate-800/30'}`}>
                        <div className="mt-0.5 shrink-0">{ICONS[n.icon] || ICONS.pending}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{n.title}</p>
                          <p className="text-slate-400 text-xs">{n.body}</p>
                          <p className="text-slate-600 text-xs mt-0.5">
                            {n.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
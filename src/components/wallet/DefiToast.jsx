import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, X, ArrowDownUp, Zap } from 'lucide-react';

// Global event bus for DeFi notifications
const listeners = new Set();

export function emitDefiNotif(notif) {
  listeners.forEach(fn => fn(notif));
}

export function useDefiToast() {
  const subscribe = useCallback((fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return { subscribe };
}

const TYPE_CONFIG = {
  swap_pending: {
    icon: <Clock className="w-4 h-4 text-yellow-400" />,
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  swap_submitted: {
    icon: <ArrowDownUp className="w-4 h-4 text-violet-400" />,
    bg: 'bg-violet-500/10 border-violet-500/30',
    dot: 'bg-violet-400',
  },
  swap_confirmed: {
    icon: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    bg: 'bg-green-500/10 border-green-500/30',
    dot: 'bg-green-400',
  },
  swap_failed: {
    icon: <AlertCircle className="w-4 h-4 text-red-400" />,
    bg: 'bg-red-500/10 border-red-500/30',
    dot: 'bg-red-400',
  },
  stake_pending: {
    icon: <Clock className="w-4 h-4 text-yellow-400" />,
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  stake_confirmed: {
    icon: <Zap className="w-4 h-4 text-orange-400" />,
    bg: 'bg-orange-500/10 border-orange-500/30',
    dot: 'bg-orange-400',
  },
};

function Toast({ notif, onDismiss }) {
  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.swap_confirmed;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notif.id), notif.duration || 5000);
    return () => clearTimeout(timer);
  }, [notif.id, notif.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm w-80 ${config.bg}`}
    >
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
          <p className="text-white text-sm font-semibold">{notif.title}</p>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">{notif.body}</p>
      </div>
      <button onClick={() => onDismiss(notif.id)} className="text-slate-500 hover:text-white shrink-0 mt-0.5 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

let toastId = 0;

export default function DefiToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (notif) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { ...notif, id }].slice(-5)); // max 5 visible
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="fixed bottom-6 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast notif={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
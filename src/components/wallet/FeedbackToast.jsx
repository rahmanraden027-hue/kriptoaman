import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'bg-green-500/10 border-green-500/20 text-green-300',
  error: 'bg-red-500/10 border-red-500/20 text-red-300',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
};

export default function FeedbackToast({ type = 'success', message, duration = 3000, onClose }) {
  const Icon = ICONS[type];

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${COLORS[type]} animate-in slide-in-from-top-2`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-current opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
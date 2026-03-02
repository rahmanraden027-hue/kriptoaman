import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Bell, ArrowDownToLine, X, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'admin_seen_deposit_ids';

function getSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveSeenIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export default function AdminDepositNotifier() {
  const [toasts, setToasts] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const seenIds = useRef(getSeenIds());

  useEffect(() => {
    // Subscribe to real-time DepositRequest changes
    const unsub = base44.entities.DepositRequest.subscribe((event) => {
      if (event.type === 'create') {
        const deposit = event.data;
        if (!deposit || seenIds.current.has(event.id)) return;

        seenIds.current.add(event.id);
        saveSeenIds(seenIds.current);

        const id = event.id;
        const label = deposit.type === 'crypto'
          ? `${deposit.coin} – ${deposit.amountCrypto ?? '?'} koin`
          : `IDR ${deposit.amountIDR?.toLocaleString('id-ID') ?? '?'}`;

        setToasts(prev => [...prev, { id, label, userEmail: deposit.userEmail, type: deposit.type }]);
        setPendingCount(c => c + 1);

        // Auto-dismiss after 8s
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 8000);
      }
    });

    // Load current pending count
    base44.entities.DepositRequest.filter({ status: 'pending' }).then(list => {
      setPendingCount(list.length);
    }).catch(() => {});

    return () => unsub();
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <>
      {/* Bell badge in nav (rendered as overlay near bell icon via portal-like absolute) */}
      {pendingCount > 0 && (
        <div className="fixed top-2 right-[72px] z-[60] pointer-events-none">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold ring-2 ring-slate-950">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        </div>
      )}

      {/* Toast stack */}
      <div className="fixed top-20 right-3 z-[70] flex flex-col gap-2 max-w-[300px]">
        {toasts.map(toast => (
          <div key={toast.id}
            className="flex items-start gap-3 bg-slate-900 border border-blue-500/40 rounded-2xl px-4 py-3 shadow-xl shadow-black/40 animate-slide-in">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <ArrowDownToLine className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold">Deposit Baru Masuk!</p>
              <p className="text-slate-400 text-[11px] truncate">{toast.userEmail}</p>
              <p className="text-blue-300 text-[11px] font-semibold">{toast.label}</p>
              <Link to={createPageUrl('AdminUserBalances')}
                className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                onClick={() => dismiss(toast.id)}>
                <ExternalLink className="w-3 h-3" /> Kelola Transaksi
              </Link>
            </div>
            <button onClick={() => dismiss(toast.id)} className="text-slate-600 hover:text-slate-400 mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </>
  );
}
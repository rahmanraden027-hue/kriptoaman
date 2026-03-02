import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronUp, AlertTriangle, MessageSquare } from 'lucide-react';

export default function PendingDepositsPanel() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [pendingReasons, setPendingReasons] = useState({});
  const [adminNotes, setAdminNotes] = useState({});

  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ['pendingDeposits'],
    queryFn: () => base44.entities.DepositRequest.filter({ status: 'pending' }),
    refetchInterval: 15000,
  });

  const updateDeposit = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositRequest.update(id, data),
    onSuccess: () => qc.invalidateQueries(['pendingDeposits']),
  });

  // Save pending reason without changing status
  const savePendingReason = (deposit) => {
    const reason = pendingReasons[deposit.id] ?? deposit.pendingReason ?? '';
    updateDeposit.mutate({ id: deposit.id, data: { pendingReason: reason } });
  };

  const confirmDeposit = (deposit) => {
    const note = adminNotes[deposit.id] ?? '';
    // Status update triggers automation that auto-credits balance
    updateDeposit.mutate({
      id: deposit.id,
      data: { status: 'confirmed', confirmedAt: new Date().toISOString(), adminNote: note, pendingReason: '' },
    });
  };

  const rejectDeposit = (deposit) => {
    const note = adminNotes[deposit.id] ?? '';
    updateDeposit.mutate({
      id: deposit.id,
      data: { status: 'rejected', adminNote: note },
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
    </div>
  );

  if (deposits.length === 0) return (
    <div className="text-center py-6 text-slate-500 text-sm">
      Tidak ada deposit pending
    </div>
  );

  return (
    <div className="space-y-3">
      {deposits.map(dep => {
        const isExpanded = expandedId === dep.id;
        const reason = pendingReasons[dep.id] ?? dep.pendingReason ?? '';
        const note = adminNotes[dep.id] ?? dep.adminNote ?? '';

        return (
          <div key={dep.id} className="bg-slate-800/60 border border-amber-500/20 rounded-xl overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : dep.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{dep.userEmail}</p>
                <p className="text-slate-400 text-xs">
                  {dep.type === 'crypto'
                    ? `${dep.amountCrypto} ${dep.coin}${dep.network ? ` · ${dep.network}` : ''}`
                    : `IDR ${dep.amountIDR?.toLocaleString('id-ID')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {dep.pendingReason && (
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Ada alasan
                  </span>
                )}
                <span className="text-slate-500 text-xs">{new Date(dep.created_date).toLocaleDateString('id-ID')}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-700/40 pt-3">
                {/* TX Hash / info */}
                {dep.txHash && (
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1">TX HASH</p>
                    <p className="text-slate-300 text-xs font-mono break-all">{dep.txHash}</p>
                  </div>
                )}
                {dep.senderName && (
                  <div>
                    <p className="text-slate-400 text-xs font-semibold mb-1">PENGIRIM</p>
                    <p className="text-slate-300 text-xs">{dep.senderName}</p>
                  </div>
                )}

                {/* Pending Reason */}
                <div>
                  <label className="text-amber-400 text-xs font-semibold mb-1.5 flex items-center gap-1 block">
                    <AlertTriangle className="w-3 h-3" /> Alasan Tertunda (ditampilkan ke user)
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={e => setPendingReasons(prev => ({ ...prev, [dep.id]: e.target.value }))}
                    placeholder="mis. TX hash tidak ditemukan, menunggu konfirmasi blockchain..."
                    className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
                  />
                  <button
                    onClick={() => savePendingReason(dep)}
                    disabled={updateDeposit.isPending}
                    className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Simpan Alasan
                  </button>
                </div>

                {/* Admin Note */}
                <div>
                  <label className="text-slate-400 text-xs font-semibold mb-1 block">Catatan Internal Admin</label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setAdminNotes(prev => ({ ...prev, [dep.id]: e.target.value }))}
                    placeholder="Catatan internal (tidak ditampilkan ke user)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => confirmDeposit(dep)}
                    disabled={updateDeposit.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    {updateDeposit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Konfirmasi
                  </button>
                  <button
                    onClick={() => rejectDeposit(dep)}
                    disabled={updateDeposit.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-900/50 hover:bg-red-800/50 border border-red-500/30 text-red-400 text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" /> Tolak
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
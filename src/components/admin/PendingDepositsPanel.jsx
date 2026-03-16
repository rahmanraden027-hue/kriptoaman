import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronUp, AlertTriangle, MessageSquare, ExternalLink, Image, Filter } from 'lucide-react';

export default function PendingDepositsPanel() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [pendingReasons, setPendingReasons] = useState({});
  const [adminNotes, setAdminNotes] = useState({});
  const [filter, setFilter] = useState('pending'); // pending | all | confirmed | rejected

  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ['pendingDeposits', filter],
    queryFn: () => filter === 'all'
      ? base44.entities.DepositRequest.list('-created_date', 50)
      : base44.entities.DepositRequest.filter({ status: filter }, '-created_date', 50),
    refetchInterval: 10000,
  });

  const updateDeposit = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositRequest.update(id, data),
    onSuccess: () => qc.invalidateQueries(['pendingDeposits']),
  });

  const savePendingReason = (deposit) => {
    const reason = pendingReasons[deposit.id] ?? deposit.pendingReason ?? '';
    updateDeposit.mutate({ id: deposit.id, data: { pendingReason: reason } });
  };

  const confirmDeposit = (deposit) => {
    const note = adminNotes[deposit.id] ?? deposit.adminNote ?? '';
    updateDeposit.mutate({
      id: deposit.id,
      data: { status: 'confirmed', confirmedAt: new Date().toISOString(), adminNote: note || 'Dikonfirmasi manual oleh admin', pendingReason: '' },
    });
  };

  const rejectDeposit = (deposit) => {
    const note = adminNotes[deposit.id] ?? '';
    if (!note.trim()) {
      alert('Harap isi catatan/alasan penolakan sebelum menolak deposit.');
      return;
    }
    updateDeposit.mutate({
      id: deposit.id,
      data: { status: 'rejected', adminNote: note },
    });
  };

  // Extract proof image URL from proofNote field
  const extractProofUrl = (proofNote) => {
    if (!proofNote) return null;
    const match = proofNote.match(/Bukti:\s*(https?:\/\/\S+)/);
    return match ? match[1] : null;
  };

  const statusColors = {
    pending: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    confirmed: 'text-green-400 bg-green-500/20 border-green-500/30',
    rejected: 'text-red-400 bg-red-500/20 border-red-500/30',
  };

  const filterOptions = [
    { key: 'pending', label: 'Pending', color: 'text-amber-400' },
    { key: 'confirmed', label: 'Confirmed', color: 'text-green-400' },
    { key: 'rejected', label: 'Ditolak', color: 'text-red-400' },
    { key: 'all', label: 'Semua', color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {filterOptions.map(({ key, label, color }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === key
                ? 'bg-slate-600 text-white'
                : `bg-slate-800 ${color} hover:bg-slate-700`
            }`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          Tidak ada deposit {filter !== 'all' ? filter : ''}
        </div>
      ) : (
        deposits.map(dep => {
          const isExpanded = expandedId === dep.id;
          const reason = pendingReasons[dep.id] ?? dep.pendingReason ?? '';
          const note = adminNotes[dep.id] ?? dep.adminNote ?? '';
          const proofUrl = extractProofUrl(dep.proofNote);

          return (
            <div key={dep.id} className={`bg-slate-800/60 border rounded-xl overflow-hidden ${
              dep.status === 'pending' ? 'border-amber-500/20' :
              dep.status === 'confirmed' ? 'border-green-500/20' : 'border-red-500/20'
            }`}>
              {/* Header row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : dep.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  dep.status === 'confirmed' ? 'bg-green-500/20' :
                  dep.status === 'rejected' ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}>
                  {dep.status === 'confirmed' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> :
                   dep.status === 'rejected' ? <XCircle className="w-4 h-4 text-red-400" /> :
                   <Clock className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{dep.userEmail}</p>
                  <p className="text-slate-400 text-xs">
                    {dep.type === 'crypto'
                      ? `${dep.amountCrypto} ${dep.coin}${dep.network ? ` · ${dep.network}` : ''}`
                      : `IDR ${dep.amountIDR?.toLocaleString('id-ID')}`}
                    {proofUrl && <span className="ml-2 text-blue-400">📎 Ada bukti</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] border px-2 py-0.5 rounded-full ${statusColors[dep.status] || ''}`}>
                    {dep.status}
                  </span>
                  <span className="text-slate-500 text-[10px]">{new Date(dep.created_date).toLocaleDateString('id-ID')}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-700/40 pt-3">
                  {/* TX Hash */}
                  {dep.txHash && (
                    <div>
                      <p className="text-slate-400 text-xs font-semibold mb-1">TX HASH</p>
                      <p className="text-slate-300 text-xs font-mono break-all">{dep.txHash}</p>
                    </div>
                  )}

                  {/* Pengirim & Info */}
                  {dep.senderName && (
                    <div className="flex gap-4">
                      <div>
                        <p className="text-slate-400 text-xs font-semibold mb-0.5">PENGIRIM</p>
                        <p className="text-slate-300 text-xs">{dep.senderName}</p>
                      </div>
                    </div>
                  )}

                  {/* Proof image */}
                  {proofUrl && (
                    <div>
                      <p className="text-slate-400 text-xs font-semibold mb-1.5 flex items-center gap-1">
                        <Image className="w-3.5 h-3.5" /> BUKTI TRANSFER
                      </p>
                      <div className="relative">
                        <img src={proofUrl} alt="Bukti Transfer" className="w-full max-h-48 object-contain rounded-xl border border-slate-700 bg-slate-900" />
                        <a href={proofUrl} target="_blank" rel="noopener noreferrer"
                          className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-black/80">
                          <ExternalLink className="w-3 h-3" /> Buka
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Proof note */}
                  {dep.proofNote && (
                    <div>
                      <p className="text-slate-400 text-xs font-semibold mb-1">CATATAN USER</p>
                      <p className="text-slate-300 text-xs break-all">{dep.proofNote.replace(/\s*\|\s*Bukti:.*/, '')}</p>
                    </div>
                  )}

                  {/* Pending reason — hanya tampil di status pending */}
                  {dep.status === 'pending' && (
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
                  )}

                  {/* Admin Note */}
                  <div>
                    <label className="text-slate-400 text-xs font-semibold mb-1 block">
                      {dep.status === 'pending' ? 'Catatan Internal / Alasan Tolak' : 'Catatan Admin'}
                    </label>
                    {dep.status === 'pending' ? (
                      <input
                        type="text"
                        value={note}
                        onChange={e => setAdminNotes(prev => ({ ...prev, [dep.id]: e.target.value }))}
                        placeholder="Wajib diisi jika menolak deposit"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-slate-400 text-xs">{dep.adminNote || '-'}</p>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="flex gap-4 text-[10px] text-slate-600">
                    <span>Dibuat: {new Date(dep.created_date).toLocaleString('id-ID')}</span>
                    {dep.confirmedAt && <span>Dikonfirmasi: {new Date(dep.confirmedAt).toLocaleString('id-ID')}</span>}
                  </div>

                  {/* Actions — hanya untuk pending */}
                  {dep.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => confirmDeposit(dep)}
                        disabled={updateDeposit.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors disabled:opacity-60"
                      >
                        {updateDeposit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Konfirmasi & Credit Saldo
                      </button>
                      <button
                        onClick={() => rejectDeposit(dep)}
                        disabled={updateDeposit.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-900/50 hover:bg-red-800/50 border border-red-500/30 text-red-400 text-sm font-bold transition-colors disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
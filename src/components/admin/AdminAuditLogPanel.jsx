import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, Clock3, Activity, AlertTriangle } from 'lucide-react';

function formatTime(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID');
  } catch {
    return value;
  }
}

function actionLabel(action) {
  const labels = {
    balance_update: 'Perubahan Saldo Admin',
    deploy_note: 'Catatan Deploy',
  };
  return labels[action] || action || 'Aktivitas Admin';
}

function metadataSummary(log) {
  const metadata = log?.metadata || {};
  if (log?.action === 'balance_update') {
    const changed = Array.isArray(metadata.changed_coins) ? metadata.changed_coins.join(', ') : null;
    return changed ? `Aset berubah: ${changed}` : 'Saldo admin diperbarui';
  }
  if (log?.action === 'deploy_note') {
    return metadata.version ? `Versi: ${metadata.version}` : 'Catatan deployment dibuat';
  }
  const keys = Object.keys(metadata);
  return keys.length ? keys.slice(0, 3).map((key) => `${key}: ${String(metadata[key])}`).join(' · ') : 'Tidak ada metadata tambahan';
}

export default function AdminAuditLogPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/admin/audit?limit=50', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Gagal memuat audit log');
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (err) {
      setError(err?.message || 'Audit log tidak tersedia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const latest = useMemo(() => logs[0]?.created_at || null, [logs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
            <Activity className="w-3.5 h-3.5" /> Total Log
          </div>
          <p className="text-white text-2xl font-bold mt-1">{logs.length}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
            <Clock3 className="w-3.5 h-3.5" /> Aktivitas Terakhir
          </div>
          <p className="text-slate-200 text-xs font-semibold mt-2">{latest ? formatTime(latest) : '-'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Log hanya dapat dibaca oleh sesi admin terverifikasi.
        </div>
        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Muat Ulang
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {!error && loading && (
        <div className="py-8 text-center text-slate-500 text-xs">Memuat audit log...</div>
      )}

      {!error && !loading && logs.length === 0 && (
        <div className="py-8 text-center text-slate-500 text-xs border border-slate-800 rounded-xl bg-slate-950/40">
          Belum ada aktivitas admin yang tercatat.
        </div>
      )}

      {!error && !loading && logs.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div key={log.id} className="bg-slate-950/60 border border-slate-700/40 rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold">{actionLabel(log.action)}</p>
                  <p className="text-slate-500 text-[11px] mt-1 break-all">{metadataSummary(log)}</p>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{formatTime(log.created_at)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600">
                <span>Admin: {log.admin_email || '-'}</span>
                <span>Target: {log.target_type || '-'}{log.target_id ? `/${log.target_id}` : ''}</span>
                {log.ip_masked && <span>IP: {log.ip_masked}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

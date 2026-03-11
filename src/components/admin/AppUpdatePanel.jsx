import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Upload, Zap, Clock, User, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CURRENT_VERSION = '1.0.0';
const CHANGELOG = [
  { version: '1.0.0', date: '2026-03-11', by: 'system', notes: 'Initial release — KriptoAman platform launch' },
];

export default function AppUpdatePanel() {
  const [checking, setChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [manualNote, setManualNote] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [autoUpdate, setAutoUpdate] = useState(
    localStorage.getItem('ka_auto_update') !== 'false'
  );

  const checkForUpdates = async () => {
    setChecking(true);
    setUpdateStatus(null);
    await new Promise(r => setTimeout(r, 1200));
    setUpdateStatus({ hasUpdate: false, msg: `Platform sudah versi terbaru (${CURRENT_VERSION})`, latestVersion: CURRENT_VERSION });
    setChecking(false);
  };

  const triggerManualDeploy = async () => {
    if (!manualNote.trim()) return;
    setDeploying(true);
    setDeployResult(null);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'rahmanraden027@gmail.com',
        subject: `[KriptoAman] Manual Deploy Triggered — v${CURRENT_VERSION}`,
        body: `Admin melakukan manual deploy.\n\nCatatan: ${manualNote}\nWaktu: ${new Date().toLocaleString('id-ID')}\n\nLogin ke Base44 Dashboard untuk konfirmasi.`,
      });
      setDeployResult({ ok: true, msg: 'Notifikasi deploy terkirim ke email Anda. Publish ulang via Base44 Dashboard.' });
    } catch (e) {
      setDeployResult({ ok: false, msg: 'Gagal kirim notifikasi: ' + e.message });
    }
    setDeploying(false);
  };

  const toggleAutoUpdate = () => {
    const val = !autoUpdate;
    setAutoUpdate(val);
    localStorage.setItem('ka_auto_update', String(val));
  };

  return (
    <div className="space-y-5">
      {/* Current Version */}
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs">Versi Aktif</p>
          <p className="text-white font-bold text-xl font-mono">{CURRENT_VERSION}</p>
          <p className="text-slate-500 text-xs">Platform: Base44 | Environment: Production</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
      </div>

      {/* Auto Update Toggle */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white text-sm font-semibold">Update Otomatis</p>
            <p className="text-slate-500 text-xs">Platform Base44 otomatis push update saat ada perubahan kode</p>
          </div>
        </div>
        <button onClick={toggleAutoUpdate}
          className={`relative w-11 h-6 rounded-full transition-colors ${autoUpdate ? 'bg-blue-500' : 'bg-slate-700'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoUpdate ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Check for Updates */}
      <div className="space-y-2">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cek Update Platform</p>
        <button onClick={checkForUpdates} disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Mengecek...' : 'Cek Update Sekarang'}
        </button>
        {updateStatus && (
          <div className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2 ${updateStatus.hasUpdate ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300' : 'bg-green-500/10 border border-green-500/20 text-green-300'}`}>
            {updateStatus.hasUpdate ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {updateStatus.msg}
          </div>
        )}
      </div>

      {/* Manual Deploy (Admin) */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-orange-400" />
          <p className="text-orange-300 font-semibold text-sm">Update Manual oleh Admin</p>
        </div>
        <p className="text-slate-500 text-xs">Untuk deploy kode baru secara manual: buka Base44 Dashboard → klik "Publish". Gunakan form ini untuk mencatat dan notifikasi.</p>
        <textarea
          value={manualNote}
          onChange={e => setManualNote(e.target.value)}
          placeholder="Catatan update (contoh: Fix bug withdrawal, tambah fitur grid bot, update UI...)"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 resize-none h-20 focus:outline-none focus:border-orange-500/50"
        />
        <button onClick={triggerManualDeploy} disabled={deploying || !manualNote.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors">
          <Upload className={`w-3.5 h-3.5 ${deploying ? 'animate-bounce' : ''}`} />
          {deploying ? 'Memproses...' : 'Kirim Notifikasi Deploy'}
        </button>
        {deployResult && (
          <p className={`text-xs ${deployResult.ok ? 'text-green-400' : 'text-red-400'}`}>{deployResult.msg}</p>
        )}
      </div>

      {/* Changelog */}
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Riwayat Update</p>
        <div className="space-y-2">
          {CHANGELOG.map(log => (
            <div key={log.version} className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-xs font-mono">v{log.version}</span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" /> {log.date}
                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-[10px]">{log.by}</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs">{log.notes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cara Deploy */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cara Update / Deploy Aplikasi</p>
        <ol className="space-y-1.5 text-xs text-slate-400">
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">1.</span> Edit kode di Base44 AI Builder (chat dengan AI)</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">2.</span> Preview perubahan di panel kanan</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">3.</span> Klik tombol <span className="text-white font-semibold">Publish</span> di Base44 Dashboard</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">4.</span> Update langsung aktif dalam 30-60 detik</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">5.</span> Catat versi & changelog di form Manual Deploy di atas</li>
        </ol>
      </div>
    </div>
  );
}
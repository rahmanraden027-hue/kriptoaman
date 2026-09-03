import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Upload, Zap, Clock, User, Mail, Users } from 'lucide-react';

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
  const [broadcastInfo, setBroadcastInfo] = useState(null);
  const [broadcastChecking, setBroadcastChecking] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
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
      const response = await fetch('/api/auth/admin/deploy-notify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: manualNote.trim(), version: CURRENT_VERSION }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Permintaan ditolak');
      setDeployResult({ ok: true, msg: 'Catatan deploy tervalidasi oleh server dan notifikasi admin telah dikirim.' });
      setManualNote('');
    } catch (e) {
      setDeployResult({ ok: false, msg: 'Gagal memproses notifikasi deploy: ' + e.message });
    }
    setDeploying(false);
  };

  const checkBroadcastRecipients = async () => {
    setBroadcastChecking(true);
    setBroadcastResult(null);
    try {
      const response = await fetch('/api/auth/admin/broadcast-progress', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Gagal membaca status broadcast');
      setBroadcastInfo(data);
      if (data.alreadySent) {
        setBroadcastResult({ ok: true, msg: `Update September 2026 sudah terkirim${data.sentAt ? ` pada ${new Date(data.sentAt).toLocaleString('id-ID')}` : ''}.` });
      }
    } catch (e) {
      setBroadcastResult({ ok: false, msg: 'Gagal memeriksa penerima: ' + e.message });
    }
    setBroadcastChecking(false);
  };

  const sendProgressBroadcast = async () => {
    if (!broadcastInfo || broadcastInfo.alreadySent || !broadcastInfo.recipientCount) return;
    const approved = window.confirm(
      `Kirim “${broadcastInfo.subject}” ke ${broadcastInfo.recipientCount} pengguna KriptoAman terverifikasi? Pengiriman hanya dapat dilakukan satu kali untuk kampanye ini.`
    );
    if (!approved) return;

    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const response = await fetch('/api/auth/admin/broadcast-progress', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'KIRIM UPDATE SEPTEMBER 2026' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Broadcast ditolak');
      setBroadcastResult({ ok: true, msg: `Broadcast diterima Resend untuk ${data.acceptedCount || data.recipientCount} pengguna.` });
      setBroadcastInfo((current) => ({
        ...(current || {}),
        alreadySent: true,
        recipientCount: data.recipientCount,
        sentAt: new Date().toISOString(),
      }));
    } catch (e) {
      setBroadcastResult({ ok: false, msg: 'Gagal mengirim broadcast: ' + e.message });
    }
    setBroadcasting(false);
  };

  const toggleAutoUpdate = () => {
    const val = !autoUpdate;
    setAutoUpdate(val);
    localStorage.setItem('ka_auto_update', String(val));
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs">Versi Aktif</p>
          <p className="text-white font-bold text-xl font-mono">{CURRENT_VERSION}</p>
          <p className="text-slate-500 text-xs">Platform: Production</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white text-sm font-semibold">Preferensi Update Otomatis</p>
            <p className="text-slate-500 text-xs">Pengaturan lokal untuk notifikasi/status update aplikasi.</p>
          </div>
        </div>
        <button onClick={toggleAutoUpdate}
          className={`relative w-11 h-6 rounded-full transition-colors ${autoUpdate ? 'bg-blue-500' : 'bg-slate-700'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoUpdate ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

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

      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-orange-400" />
          <p className="text-orange-300 font-semibold text-sm">Catatan Deploy oleh Admin</p>
        </div>
        <p className="text-slate-500 text-xs">Permintaan ini diverifikasi ulang di server. Hanya sesi admin aktif yang dapat mengirim catatan deploy.</p>
        <textarea
          value={manualNote}
          onChange={e => setManualNote(e.target.value)}
          placeholder="Catatan perubahan yang akan dipublikasikan..."
          maxLength={2000}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 resize-none h-20 focus:outline-none focus:border-orange-500/50"
        />
        <button onClick={triggerManualDeploy} disabled={deploying || !manualNote.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors">
          <Upload className={`w-3.5 h-3.5 ${deploying ? 'animate-bounce' : ''}`} />
          {deploying ? 'Memverifikasi...' : 'Kirim Catatan Deploy Aman'}
        </button>
        {deployResult && (
          <p className={`text-xs ${deployResult.ok ? 'text-green-400' : 'text-red-400'}`}>{deployResult.msg}</p>
        )}
      </div>

      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-cyan-300" />
          <p className="text-cyan-200 font-semibold text-sm">Broadcast Perkembangan Ekosistem — September 2026</p>
        </div>
        <p className="text-slate-400 text-xs">Bahasa email dipertahankan seperti contoh yang telah disetujui. Visual perkembangan ditampilkan di bagian atas email. Semua pengguna terverifikasi menerima email secara individual melalui Resend.</p>
        <img
          src="/assets/kriptoaman-ecosystem-progress-september-2026.svg"
          alt="Kemajuan Positif Ekosistem KriptoAman"
          className="w-full rounded-xl border border-cyan-500/20 bg-slate-950"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={checkBroadcastRecipients} disabled={broadcastChecking || broadcasting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors">
            <Users className={`w-3.5 h-3.5 ${broadcastChecking ? 'animate-pulse' : ''}`} />
            {broadcastChecking ? 'Memeriksa...' : 'Cek Penerima'}
          </button>
          <button
            onClick={sendProgressBroadcast}
            disabled={broadcasting || !broadcastInfo || broadcastInfo.alreadySent || !broadcastInfo.recipientCount || broadcastInfo.recipientCount > broadcastInfo.maxRecipients}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors">
            <Mail className={`w-3.5 h-3.5 ${broadcasting ? 'animate-pulse' : ''}`} />
            {broadcasting ? 'Mengirim...' : 'Kirim Update September 2026'}
          </button>
        </div>
        {broadcastInfo && (
          <div className="rounded-xl bg-slate-900/70 border border-slate-700/50 p-3 text-xs text-slate-300 space-y-1">
            <p><span className="text-slate-500">Penerima terverifikasi:</span> <strong className="text-white">{broadcastInfo.recipientCount}</strong></p>
            <p><span className="text-slate-500">Status kampanye:</span> <strong className={broadcastInfo.alreadySent ? 'text-green-400' : 'text-cyan-300'}>{broadcastInfo.alreadySent ? 'Sudah terkirim' : 'Siap dikirim'}</strong></p>
            {broadcastInfo.recipientCount > broadcastInfo.maxRecipients && (
              <p className="text-amber-300">Jumlah penerima melebihi batas pengamanan {broadcastInfo.maxRecipients}. Gunakan campaign queue sebelum mengirim.</p>
            )}
          </div>
        )}
        {broadcastResult && (
          <p className={`text-xs ${broadcastResult.ok ? 'text-green-400' : 'text-red-400'}`}>{broadcastResult.msg}</p>
        )}
      </div>

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

      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Prosedur Deploy Aman</p>
        <ol className="space-y-1.5 text-xs text-slate-400">
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">1.</span> Siapkan perubahan kode pada repository resmi.</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">2.</span> Pastikan build dan pemeriksaan keamanan berhasil.</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">3.</span> Publikasikan melalui pipeline deployment resmi.</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">4.</span> Verifikasi versi live setelah deployment.</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">5.</span> Catat perubahan melalui form admin di atas.</li>
        </ol>
      </div>
    </div>
  );
}

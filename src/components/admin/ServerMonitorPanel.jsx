import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const ENDPOINTS = [
  { label: 'App (Base44)', url: 'https://kriptoaman.base44.app', key: 'app' },
  { label: 'Binance API', url: 'https://api.binance.com/api/v3/ping', key: 'binance' },
  { label: 'CoinGecko API', url: 'https://api.coingecko.com/api/v3/ping', key: 'coingecko' },
  { label: 'Stripe API', url: 'https://api.stripe.com', key: 'stripe' },
  { label: 'Cloudflare DNS', url: 'https://1.1.1.1', key: 'cloudflare' },
];

function StatusDot({ status }) {
  if (status === 'up') return <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block animate-pulse" />;
  if (status === 'down') return <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block animate-pulse" />;
}

export default function ServerMonitorPanel() {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg, type = 'info') => {
    const entry = { msg, type, time: new Date().toLocaleTimeString('id-ID') };
    setLogs(prev => [entry, ...prev].slice(0, 50));
  };

  const checkEndpoint = async (ep) => {
    const start = Date.now();
    try {
      const res = await fetch(ep.url, { method: 'GET', signal: AbortSignal.timeout(5000), mode: 'no-cors' });
      const latency = Date.now() - start;
      return { status: 'up', latency };
    } catch {
      return { status: 'down', latency: null };
    }
  };

  const runChecks = async () => {
    setLoading(true);
    addLog('Memulai pengecekan uptime semua endpoint...', 'info');
    const results = {};
    await Promise.all(
      ENDPOINTS.map(async (ep) => {
        const result = await checkEndpoint(ep);
        results[ep.key] = result;
        addLog(`${ep.label}: ${result.status === 'up' ? '✅ UP' : '❌ DOWN'} ${result.latency ? `(${result.latency}ms)` : ''}`, result.status === 'up' ? 'success' : 'error');
      })
    );
    setStatuses(results);
    setLastChecked(new Date());
    setLoading(false);
  };

  useEffect(() => { runChecks(); }, []);

  const upCount = Object.values(statuses).filter(s => s.status === 'up').length;
  const total = ENDPOINTS.length;

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${upCount === total ? 'bg-green-500/10 border border-green-500/20 text-green-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
        {upCount === total ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        {upCount}/{total} endpoint online
        {lastChecked && <span className="text-slate-500 font-normal ml-auto">Terakhir cek: {lastChecked.toLocaleTimeString('id-ID')}</span>}
      </div>

      {/* Endpoint list */}
      <div className="space-y-2">
        {ENDPOINTS.map(ep => {
          const s = statuses[ep.key];
          return (
            <div key={ep.key} className="flex items-center justify-between bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <StatusDot status={s?.status || 'loading'} />
                <span className="text-white text-xs font-medium">{ep.label}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {s?.latency && <span className="text-slate-500">{s.latency}ms</span>}
                <span className={s?.status === 'up' ? 'text-green-400' : s?.status === 'down' ? 'text-red-400' : 'text-yellow-400'}>
                  {s?.status === 'up' ? 'UP' : s?.status === 'down' ? 'DOWN' : 'Checking...'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={runChecks} disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors">
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Mengecek...' : 'Cek Ulang Sekarang'}
      </button>

      {/* Live Log */}
      {logs.length > 0 && (
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Log Monitor</p>
          <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono">
                <span className="text-slate-600 shrink-0">{log.time}</span>
                <span className={log.type === 'success' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : 'text-slate-400'}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
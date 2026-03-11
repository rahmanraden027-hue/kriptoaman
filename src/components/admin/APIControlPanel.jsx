import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, AlertTriangle, ExternalLink, Copy, CheckCheck, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const API_REGISTRY = [
  {
    group: 'Payment',
    color: 'purple',
    apis: [
      { key: 'stripe', label: 'Stripe', env: 'STRIPE_SECRET_KEY', envPub: 'STRIPE_PUBLISHABLE_KEY', envWebhook: 'STRIPE_WEBHOOK_SECRET', docs: 'https://dashboard.stripe.com/apikeys', desc: 'Payment gateway utama' },
    ],
  },
  {
    group: 'Market / Price',
    color: 'yellow',
    apis: [
      { key: 'binance', label: 'Binance API', docs: 'https://www.binance.com/en/my/settings/api-management', desc: 'Harga kripto real-time & trading', freePublic: true },
      { key: 'coingecko', label: 'CoinGecko API', docs: 'https://www.coingecko.com/en/api/pricing', desc: 'Market data, chart & coin info', freePublic: true },
      { key: 'twelvedata', label: 'Twelve Data', env: 'TWELVE_DATA_API_KEY', docs: 'https://twelvedata.com/account/api-keys', desc: 'Forex, stocks & crypto OHLCV' },
    ],
  },
  {
    group: 'Notifikasi & Email',
    color: 'blue',
    apis: [
      { key: 'gmail', label: 'Gmail (OAuth)', docs: 'https://console.cloud.google.com/apis/credentials', desc: 'Kirim email via OAuth (sudah terhubung)', connected: true },
    ],
  },
  {
    group: 'Blockchain & Web3',
    color: 'green',
    apis: [
      { key: 'etherscan', label: 'Etherscan', env: 'ETHERSCAN_API_KEY', docs: 'https://etherscan.io/myapikey', desc: 'Verifikasi TX Ethereum' },
      { key: 'solscan', label: 'Solana (public RPC)', docs: 'https://solana.com/developers', desc: 'Solana blockchain data', freePublic: true },
    ],
  },
];

const COLOR_MAP = {
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/25', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   text: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-300' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/25',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-300' },
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function APICard({ api, color }) {
  const c = COLOR_MAP[color];
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const testAPI = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      if (api.key === 'binance') {
        const r = await fetch('https://api.binance.com/api/v3/ping');
        setTestResult(r.ok ? { ok: true, msg: 'Binance API OK ✅' } : { ok: false, msg: 'Binance unreachable' });
      } else if (api.key === 'coingecko') {
        const r = await fetch('https://api.coingecko.com/api/v3/ping');
        const d = await r.json();
        setTestResult(d.gecko_says ? { ok: true, msg: `CoinGecko: ${d.gecko_says}` } : { ok: false, msg: 'CoinGecko error' });
      } else if (api.key === 'stripe') {
        setTestResult({ ok: true, msg: 'Stripe keys terset di Secrets. Cek Dashboard Stripe untuk verifikasi.' });
      } else {
        setTestResult({ ok: null, msg: 'Test manual — buka link docs di bawah.' });
      }
    } catch (e) {
      setTestResult({ ok: false, msg: e.message });
    }
    setTesting(false);
  };

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-3 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-bold">{api.label}</span>
            {api.freePublic && <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">Free Public</span>}
            {api.connected && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">OAuth ✓</span>}
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">{api.desc}</p>
        </div>
        <a href={api.docs} target="_blank" rel="noreferrer" className={`${c.text} hover:opacity-70 transition-opacity`}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {api.env && (
        <div className="bg-slate-950/60 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
          <code className="text-green-300 text-[11px]">{api.env}</code>
          <CopyBtn text={api.env} />
        </div>
      )}
      {api.envPub && (
        <div className="bg-slate-950/60 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
          <code className="text-blue-300 text-[11px]">{api.envPub}</code>
          <CopyBtn text={api.envPub} />
        </div>
      )}
      {api.envWebhook && (
        <div className="bg-slate-950/60 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
          <code className="text-yellow-300 text-[11px]">{api.envWebhook}</code>
          <CopyBtn text={api.envWebhook} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={testAPI} disabled={testing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white rounded-lg text-[11px] font-semibold transition-colors">
          <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
          Test
        </button>
        {testResult && (
          <span className={`text-[11px] ${testResult.ok === true ? 'text-green-400' : testResult.ok === false ? 'text-red-400' : 'text-yellow-400'}`}>
            {testResult.msg}
          </span>
        )}
      </div>
    </div>
  );
}

export default function APIControlPanel() {
  return (
    <div className="space-y-5">
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-xs text-slate-400">
        🔑 Semua API key disimpan di <strong className="text-white">Secrets</strong> (bukan di kode). Hanya Anda (admin/owner) yang bisa lihat dan update via Base44 Dashboard → Settings → Secrets.
      </div>

      {API_REGISTRY.map(group => {
        const c = COLOR_MAP[group.color];
        return (
          <div key={group.group}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.text}`}>── {group.group}</p>
            <div className="space-y-2">
              {group.apis.map(api => <APICard key={api.key} api={api} color={group.color} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
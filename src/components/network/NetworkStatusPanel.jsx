import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, CheckCircle2, Clock, Globe, RefreshCw, Wifi, WifiOff, XCircle, Zap } from 'lucide-react';

const CATEGORIES = {
  blockchain: [
    'Ethereum RPC','BNB Chain RPC','Polygon RPC','Arbitrum RPC','Optimism RPC','Base RPC','Avalanche RPC','Fantom RPC',
    'Solana RPC','BlockCypher BTC','BlockCypher LTC','BlockCypher DOGE','TRON Grid','XRP Ledger',
  ],
  market: ['Binance Market Data','CoinGecko'],
  banking: ['ExchangeRate API','Open ER API','Frankfurter'],
};

const ICONS = {
  'Ethereum RPC':'⟠','BNB Chain RPC':'🔶','Polygon RPC':'🟣','Arbitrum RPC':'🔵','Optimism RPC':'🔴','Base RPC':'🔷',
  'Avalanche RPC':'🔺','Fantom RPC':'👻','Solana RPC':'🟢','BlockCypher BTC':'₿','BlockCypher LTC':'Ł','BlockCypher DOGE':'Ð',
  'TRON Grid':'⚡','XRP Ledger':'✕','Binance Market Data':'🟡','CoinGecko':'🦎','ExchangeRate API':'🏦','Open ER API':'💱','Frankfurter':'🇩🇪',
};

const FALLBACK = Object.values(CATEGORIES).flat().map(name => ({ name, status: 'unknown', latency: null }));

function Row({ item }) {
  const online = item.status === 'online';
  const offline = item.status === 'offline';
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-base leading-none">{ICONS[item.name] || '🌐'}</span>
        <span className="truncate text-xs text-slate-300">{item.name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.latency != null && <span className="font-mono text-[10px] text-slate-500">{item.latency}ms</span>}
        {online ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : offline ? <XCircle className="h-3.5 w-3.5 text-red-400" /> : <Clock className="h-3.5 w-3.5 text-slate-500" />}
      </div>
    </div>
  );
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export default function NetworkStatusPanel({ compact = false }) {
  const [data, setData] = useState(null);
  const [bankRates, setBankRates] = useState(null);
  const [gasData, setGasData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tab, setTab] = useState('networks');

  const refresh = useCallback(async () => {
    setLoading(true);
    const [health, rates, gas] = await Promise.allSettled([
      fetchJson('/api/network-health'),
      base44.functions.invoke('networkConnector', { action: 'bankrates' }),
      fetchJson('/api/network-gas'),
    ]);
    if (health.status === 'fulfilled') setData(health.value);
    if (rates.status === 'fulfilled' && rates.value?.data) setBankRates(rates.value.data);
    if (gas.status === 'fulfilled') setGasData(gas.value);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const networks = data?.networks?.length ? data.networks : FALLBACK;
  const byCategory = (category) => networks.filter(item => CATEGORIES[category].includes(item.name));
  const healthy = (data?.summary?.health_pct || 0) >= 80;

  if (compact) {
    return (
      <button onClick={refresh} className="flex items-center gap-1.5 rounded-lg border border-slate-700/40 bg-slate-800/60 px-2 py-1">
        {loading ? <RefreshCw className="h-3 w-3 animate-spin text-slate-400" /> : healthy ? <Wifi className="h-3 w-3 text-emerald-400" /> : <WifiOff className="h-3 w-3 text-yellow-400" />}
        <span className={`text-[10px] font-semibold ${healthy ? 'text-emerald-400' : 'text-yellow-400'}`}>{data?.summary ? `${data.summary.health_pct}%` : '—'}</span>
        <span className="text-[10px] text-slate-500">Network</span>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/80">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-sky-400" /><span className="text-sm font-semibold text-white">Status Jaringan Real-time</span></div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-[10px] text-slate-500">{lastUpdated.toLocaleTimeString('id-ID')}</span>}
          <button onClick={refresh} disabled={loading} className="rounded-lg bg-slate-800 p-1.5"><RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {data?.summary && <div className="border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between"><span className="text-xs text-slate-400">Kesehatan jaringan terverifikasi</span><span className={`text-sm font-bold ${healthy ? 'text-emerald-400' : 'text-yellow-400'}`}>{data.summary.health_pct}%</span></div>
        <div className="mt-2 flex gap-4 text-[10px]"><span className="text-emerald-400">● {data.summary.online} Online</span><span className="text-red-400">● {data.summary.offline} Offline</span><span className="text-slate-500">Total {data.summary.total}</span></div>
      </div>}

      <div className="flex border-b border-slate-700/50">
        {[["networks","Blockchain",Globe],["banking","Perbankan",Building2],["gas","Gas",Zap]].map(([id,label,Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex-1 py-2 text-xs font-medium ${tab === id ? 'border-b-2 border-sky-400 text-sky-400' : 'text-slate-400'}`}><span className="inline-flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</span></button>)}
      </div>

      <div className="p-4">
        {tab === 'networks' && <div className="space-y-4">
          <div><p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Blockchain Networks</p><div className="divide-y divide-slate-800">{byCategory('blockchain').map(item => <Row key={item.name} item={item} />)}</div></div>
          <div><p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Market Data</p><div className="divide-y divide-slate-800">{byCategory('market').map(item => <Row key={item.name} item={item} />)}</div></div>
          <p className="text-[9px] leading-relaxed text-slate-600">Status memakai pemeriksaan sesuai protokol jaringan. RPC JSON-RPC diuji dengan POST, bukan sekadar HEAD request.</p>
        </div>}

        {tab === 'banking' && <div className="space-y-3">
          {bankRates?.idr_rate?.rate ? <div className="rounded-xl bg-slate-800/50 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">USD/IDR</p><p className="mt-1 text-lg font-bold text-white">Rp {bankRates.idr_rate.rate.toLocaleString('id-ID')}</p><p className="text-[10px] text-slate-500">Sumber: {bankRates.idr_rate.source}</p></div> : <p className="text-xs text-slate-500">Data kurs belum tersedia.</p>}
          <div className="divide-y divide-slate-800">{byCategory('banking').map(item => <Row key={item.name} item={item} />)}</div>
        </div>}

        {tab === 'gas' && <div className="space-y-2">
          {gasData?.gas_prices?.length ? gasData.gas_prices.map(item => <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-800/50 px-3 py-2"><span className="text-xs text-slate-300">{item.name}</span><span className={`text-xs font-bold ${item.status === 'online' ? 'text-white' : 'text-yellow-400'}`}>{item.status === 'online' ? `${item.gwei} Gwei` : 'Tidak tersedia'}</span></div>) : <p className="text-xs text-slate-500">Data gas belum tersedia.</p>}
        </div>}
      </div>
    </div>
  );
}

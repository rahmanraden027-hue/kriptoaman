import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, CheckCircle2, Clock, Globe2, RefreshCw, Server, Wifi, WifiOff, XCircle, Zap } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const CATEGORIES = {
  blockchain: [
    'Ethereum RPC','BNB Chain RPC','Polygon RPC','Arbitrum RPC','Optimism RPC','Base RPC','Avalanche RPC','Fantom RPC',
    'Solana RPC','Bitcoin Network','Litecoin Network','Dogecoin Network','TRON Grid','XRP Ledger',
  ],
  market: ['Binance Market Data','CoinGecko'],
  banking: ['ExchangeRate API','Open ER API','Frankfurter'],
};

const FALLBACK = Object.values(CATEGORIES).flat().map(name => ({ name, status: 'unknown', latency: null }));

const COPY = {
  id: {
    title: 'Status Infrastruktur Jaringan',
    subtitle: 'Pemeriksaan server-side dengan failover multi-provider',
    network: 'Jaringan',
    health: 'Kesehatan endpoint yang diperiksa',
    online: 'Online',
    offline: 'Tidak terjangkau',
    total: 'Total',
    blockchain: 'Jaringan Blockchain',
    market: 'Data Pasar',
    banking: 'Kurs & Penyedia Data',
    gas: 'Gas',
    refresh: 'Periksa ulang',
    unavailable: 'Belum tersedia',
    rateUnavailable: 'Data kurs belum tersedia.',
    gasUnavailable: 'Data gas belum tersedia.',
    note: 'Status menunjukkan hasil probe endpoint dari server KriptoAman. Gangguan satu penyedia tidak otomatis berarti jaringan blockchain sedang berhenti; sistem mencoba endpoint cadangan sebelum menandai layanan tidak terjangkau.',
    checked: 'Diperiksa',
  },
  en: {
    title: 'Network Infrastructure Status',
    subtitle: 'Server-side probes with multi-provider failover',
    network: 'Network',
    health: 'Probed endpoint health',
    online: 'Online',
    offline: 'Unreachable',
    total: 'Total',
    blockchain: 'Blockchain Networks',
    market: 'Market Data',
    banking: 'Rates & Data Providers',
    gas: 'Gas',
    refresh: 'Refresh status',
    unavailable: 'Unavailable',
    rateUnavailable: 'Exchange-rate data is not available yet.',
    gasUnavailable: 'Gas data is not available yet.',
    note: 'Status reflects endpoint probes performed by the KriptoAman server. A single provider outage does not necessarily mean the underlying blockchain is down; fallback endpoints are attempted before a service is marked unreachable.',
    checked: 'Checked',
  },
};

function NetworkRow({ item }) {
  const online = item.status === 'online';
  const offline = item.status === 'offline';
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${online ? 'border-emerald-500/20 bg-emerald-500/8' : offline ? 'border-red-500/20 bg-red-500/8' : 'border-slate-700/60 bg-slate-900/60'}`}>
          <Server className={`h-4 w-4 ${online ? 'text-emerald-300' : offline ? 'text-red-300' : 'text-slate-500'}`} />
        </div>
        <div className="min-w-0">
          <span className="block truncate text-xs font-semibold text-slate-200">{item.name}</span>
          {item.provider && <span className="block truncate text-[9px] text-slate-600">via {item.provider}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.latency != null && <span className="rounded-md bg-slate-950/60 px-2 py-1 font-mono text-[9px] text-slate-500">{item.latency} ms</span>}
        {online ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : offline ? <XCircle className="h-4 w-4 text-red-400" /> : <Clock className="h-4 w-4 text-slate-500" />}
      </div>
    </div>
  );
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export default function NetworkStatusPanel({ compact = false }) {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const locale = language === 'en' ? 'en-US' : 'id-ID';
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
  const byCategory = useCallback((category) => networks.filter(item => CATEGORIES[category].includes(item.name)), [networks]);
  const healthPct = Number(data?.summary?.health_pct || 0);
  const healthy = healthPct >= 80;

  const tabs = useMemo(() => [
    ['networks', language === 'en' ? 'Networks' : 'Jaringan', Globe2],
    ['banking', language === 'en' ? 'Rates' : 'Kurs', Building2],
    ['gas', text.gas, Zap],
  ], [language, text.gas]);

  if (compact) {
    return (
      <button type="button" onClick={refresh} disabled={loading} className="flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-700/40 bg-slate-800/60 px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60" aria-label={text.refresh}>
        {loading ? <RefreshCw className="h-3 w-3 animate-spin text-slate-400" /> : healthy ? <Wifi className="h-3 w-3 text-emerald-400" /> : <WifiOff className="h-3 w-3 text-yellow-400" />}
        <span className={`text-[10px] font-semibold ${healthy ? 'text-emerald-400' : 'text-yellow-400'}`}>{data?.summary ? `${healthPct}%` : '—'}</span>
        <span className="text-[10px] text-slate-500">{text.network}</span>
      </button>
    );
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-sky-500/15 bg-gradient-to-b from-[#081421]/95 to-slate-950/90 shadow-[0_24px_70px_-44px_rgba(14,165,233,.8)]" aria-labelledby="network-status-title">
      <div className="flex flex-col gap-3 border-b border-slate-800/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10"><Globe2 className="h-5 w-5 text-sky-300" /></div>
          <div>
            <h2 id="network-status-title" className="text-sm font-black text-white">{text.title}</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{text.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {lastUpdated && <span className="text-[9px] text-slate-600">{text.checked} {lastUpdated.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>}
          <button type="button" onClick={refresh} disabled={loading} className="flex min-h-9 min-w-9 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60" aria-label={text.refresh} title={text.refresh}><RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {data?.summary && <div className="border-b border-slate-800/80 px-4 py-4">
        <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-400">{text.health}</span><span className={`text-lg font-black ${healthy ? 'text-emerald-300' : 'text-yellow-300'}`}>{healthPct}%</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, healthPct))}%` }} /></div>
        <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold"><span className="rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-emerald-300">{data.summary.online} {text.online}</span><span className="rounded-full border border-red-500/20 bg-red-500/8 px-2.5 py-1 text-red-300">{data.summary.offline} {text.offline}</span><span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-500">{text.total} {data.summary.total}</span></div>
      </div>}

      <div className="grid grid-cols-3 border-b border-slate-800/80" role="tablist" aria-label={text.title}>
        {tabs.map(([id,label,Icon]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-h-11 px-2 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/60 ${tab === id ? 'border-b-2 border-sky-400 bg-sky-500/5 text-sky-300' : 'text-slate-500 hover:text-slate-300'}`}><span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</span></button>)}
      </div>

      <div className="p-4 sm:p-5">
        {tab === 'networks' && <div className="space-y-5">
          <div><p className="mb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">{text.blockchain}</p><div className="divide-y divide-slate-800/80">{byCategory('blockchain').map(item => <NetworkRow key={item.name} item={item} />)}</div></div>
          <div><p className="mb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">{text.market}</p><div className="divide-y divide-slate-800/80">{byCategory('market').map(item => <NetworkRow key={item.name} item={item} />)}</div></div>
          <p className="rounded-2xl border border-slate-800 bg-slate-950/45 p-3 text-[9px] leading-relaxed text-slate-600">{text.note}</p>
        </div>}

        {tab === 'banking' && <div className="space-y-4">
          {bankRates?.idr_rate?.rate ? <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">USD/IDR</p><p className="mt-1 text-xl font-black text-white">Rp {Number(bankRates.idr_rate.rate).toLocaleString(locale)}</p><p className="mt-1 text-[9px] text-slate-600">{language === 'en' ? 'Source' : 'Sumber'}: {bankRates.idr_rate.source}</p></div> : <p className="text-xs text-slate-500">{text.rateUnavailable}</p>}
          <div><p className="mb-2 text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">{text.banking}</p><div className="divide-y divide-slate-800/80">{byCategory('banking').map(item => <NetworkRow key={item.name} item={item} />)}</div></div>
        </div>}

        {tab === 'gas' && <div className="space-y-2">
          {gasData?.gas_prices?.length ? gasData.gas_prices.map(item => <div key={item.name} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2.5"><span className="text-xs font-semibold text-slate-300">{item.name}</span><span className={`text-xs font-black ${item.status === 'online' ? 'text-white' : 'text-yellow-300'}`}>{item.status === 'online' ? `${item.gwei} Gwei` : text.unavailable}</span></div>) : <p className="text-xs text-slate-500">{text.gasUnavailable}</p>}
        </div>}
      </div>
    </section>
  );
}

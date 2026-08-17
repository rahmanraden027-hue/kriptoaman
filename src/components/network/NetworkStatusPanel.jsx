/**
 * NetworkStatusPanel — Real-time status semua jaringan blockchain & perbankan
 */
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Wifi, WifiOff, RefreshCw, Building2, Globe, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react';

const NETWORK_ICONS = {
  'Ethereum RPC': '⟠', 'BNB Chain RPC': '🔶', 'Polygon RPC': '🟣',
  'Arbitrum RPC': '🔵', 'Optimism RPC': '🔴', 'Base RPC': '🔷',
  'Avalanche RPC': '🔺', 'Solana RPC': '🟢', 'BlockCypher BTC': '₿',
  'TRON Grid': '⚡', 'Binance WS': '🟡', 'CoinGecko': '🦎',
  'ExchangeRate API': '🏦', 'Open ER API': '💱', 'Frankfurter': '🇩🇪',
};

const CATEGORIES = {
  blockchain: ['Ethereum RPC','BNB Chain RPC','Polygon RPC','Arbitrum RPC','Optimism RPC','Base RPC','Avalanche RPC','Solana RPC','BlockCypher BTC','TRON Grid'],
  market: ['Binance WS','CoinGecko'],
  banking: ['ExchangeRate API','Open ER API','Frankfurter'],
};

const FALLBACK_NETWORKS = Object.values(CATEGORIES).flat().map(name => ({
  name,
  status: 'unknown',
  latency: null,
}));

function NetworkRow({ item }) {
  const isOnline = item.status === 'online';
  const isOffline = item.status === 'offline';
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">{NETWORK_ICONS[item.name] || '🌐'}</span>
        <span className="text-xs text-slate-300">{item.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {item.latency != null && (
          <span className={`text-[10px] font-mono ${item.latency < 300 ? 'text-green-400' : item.latency < 800 ? 'text-yellow-400' : 'text-red-400'}`}>
            {item.latency}ms
          </span>
        )}
        {isOnline ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        ) : isOffline ? (
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="w-3.5 h-3.5" /> Menunggu data
          </span>
        )}
      </div>
    </div>
  );
}

async function fetchFirstPartyGas() {
  const response = await fetch('/api/network-gas', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Gas API HTTP ${response.status}`);
  return response.json();
}

export default function NetworkStatusPanel({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [bankRates, setBankRates] = useState(null);
  const [gasData, setGasData] = useState(null);
  const [activeTab, setActiveTab] = useState('networks');

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, ratesRes, gasRes] = await Promise.allSettled([
        base44.functions.invoke('networkConnector', { action: 'status' }),
        base44.functions.invoke('networkConnector', { action: 'bankrates' }),
        fetchFirstPartyGas(),
      ]);
      if (statusRes.status === 'fulfilled' && statusRes.value?.data) setData(statusRes.value.data);
      if (ratesRes.status === 'fulfilled' && ratesRes.value?.data) setBankRates(ratesRes.value.data);
      if (gasRes.status === 'fulfilled') setGasData(gasRes.value);
      else setGasData({ gas_prices: [], summary: { status: 'unavailable' } });
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Network status fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const availableNetworks = data?.networks?.length ? data.networks : FALLBACK_NETWORKS;
  const getNetworksByCategory = (cat) =>
    availableNetworks.filter(n => CATEGORIES[cat]?.includes(n.name));

  if (compact) {
    return (
      <button
        onClick={fetchStatus}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 hover:bg-slate-700/60 transition-colors"
      >
        {loading ? (
          <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
        ) : data?.summary?.health_pct >= 80 ? (
          <Wifi className="w-3 h-3 text-green-400" />
        ) : (
          <WifiOff className="w-3 h-3 text-yellow-400" />
        )}
        <span className={`text-[10px] font-semibold ${data?.summary?.health_pct >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
          {data?.summary ? `${data.summary.health_pct}%` : '—'}
        </span>
        <span className="text-slate-500 text-[10px]">Network</span>
      </button>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="text-white font-semibold text-sm">Status Jaringan Real-time</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-slate-500 text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button onClick={fetchStatus} disabled={loading} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors" aria-label="Perbarui status jaringan">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {data?.summary && (
        <div className="px-4 py-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Kesehatan Jaringan</span>
            <span className={`text-sm font-bold ${data.summary.health_pct >= 80 ? 'text-green-400' : data.summary.health_pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {data.summary.health_pct}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div className={`h-full rounded-full transition-all ${data.summary.health_pct >= 80 ? 'bg-green-500' : data.summary.health_pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${data.summary.health_pct}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-[10px]">
            <span className="text-green-400">● {data.summary.online} Online</span>
            <span className="text-red-400">● {data.summary.offline} Offline</span>
            <span className="text-slate-500">Total: {data.summary.total}</span>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-700/50">
        {[
          { id: 'networks', label: 'Blockchain', icon: Globe },
          { id: 'banking', label: 'Perbankan', icon: Building2 },
          { id: 'gas', label: 'Gas Price', icon: Zap },
        ].map(({ id, label, icon: TabIcon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${activeTab === id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}>
            <TabIcon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'networks' && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Blockchain Networks</p>
              <div className="divide-y divide-slate-800">
                {getNetworksByCategory('blockchain').map(n => <NetworkRow key={n.name} item={n} />)}
              </div>
              {!data?.networks?.length && (
                <p className="mt-2 text-[10px] leading-relaxed text-slate-600">Daftar jaringan tetap ditampilkan. Status online dan latensi akan muncul setelah konektor jaringan memberikan data terverifikasi.</p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Market Data</p>
              <div className="divide-y divide-slate-800">
                {getNetworksByCategory('market').map(n => <NetworkRow key={n.name} item={n} />)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="space-y-3">
            {bankRates ? (
              <>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Kurs USD/IDR Real-time</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">Rp {bankRates.idr_rate?.rate?.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Live · {bankRates.idr_rate?.source}</span>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Harga Kripto dalam IDR</p>
                  <div className="space-y-2">
                    {Object.entries(bankRates.crypto_idr || {}).filter(([,v]) => v).map(([coin, val]) => (
                      <div key={coin} className="flex items-center justify-between">
                        <span className="text-slate-300 text-xs font-medium">{coin}</span>
                        <div className="text-right">
                          <p className="text-white text-xs font-bold">Rp {val.price_idr?.toLocaleString('id-ID')}</p>
                          <p className={`text-[10px] ${val.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>{val.change_24h >= 0 ? '▲' : '▼'}{Math.abs(val.change_24h || 0).toFixed(2)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Sumber Data Kurs</p>
                  <div className="divide-y divide-slate-800">{getNetworksByCategory('banking').map(n => <NetworkRow key={n.name} item={n} />)}</div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">{loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Klik refresh untuk memuat data'}</div>
            )}
          </div>
        )}

        {activeTab === 'gas' && (
          <div className="space-y-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Gas Price Real-time (Gwei)</p>
              {gasData?.summary && (
                <span className={`text-[10px] font-semibold ${gasData.summary.status === 'ok' ? 'text-green-400' : gasData.summary.status === 'degraded' ? 'text-yellow-400' : 'text-slate-500'}`}>
                  {gasData.summary.available}/{gasData.summary.total} tersedia
                </span>
              )}
            </div>
            {gasData?.gas_prices?.length ? (
              gasData.gas_prices.map((g) => (
                <div key={g.name} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2">
                  <div>
                    <span className="text-xs text-slate-300">{g.name}</span>
                    {g.latency != null && <p className="text-[9px] text-slate-600 mt-0.5">RPC {g.latency} ms</p>}
                  </div>
                  {g.status !== 'online' ? (
                    <span className="text-[10px] text-yellow-400">Tidak tersedia</span>
                  ) : (
                    <span className="text-xs font-bold text-slate-200">{g.gwei} Gwei</span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Data gas belum tersedia — tekan refresh'}
              </div>
            )}
            <p className="pt-2 text-[9px] leading-relaxed text-slate-600">Nilai berasal dari respons RPC jaringan saat pemeriksaan. Jaringan yang tidak merespons ditandai tidak tersedia, bukan diberi nilai perkiraan.</p>
          </div>
        )}
      </div>
    </div>
  );
}

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

function NetworkRow({ item }) {
  const isOnline = item.status === 'online';
  return (
    <div className="flex items-center justify-between py-1.5">
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
        {isOnline
          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          : <XCircle className="w-3.5 h-3.5 text-red-400" />
        }
      </div>
    </div>
  );
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
        base44.functions.invoke('networkConnector', { action: 'gasprice' }),
      ]);
      if (statusRes.status === 'fulfilled') setData(statusRes.value.data);
      if (ratesRes.status === 'fulfilled') setBankRates(ratesRes.value.data);
      if (gasRes.status === 'fulfilled') setGasData(gasRes.value.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Network status fetch error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // refresh tiap 1 menit
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const getNetworksByCategory = (cat) =>
    (data?.networks || []).filter(n => CATEGORIES[cat]?.includes(n.name));

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
      {/* Header */}
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
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {data?.summary && (
        <div className="px-4 py-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Kesehatan Jaringan</span>
            <span className={`text-sm font-bold ${data.summary.health_pct >= 80 ? 'text-green-400' : data.summary.health_pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {data.summary.health_pct}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className={`h-full rounded-full transition-all ${data.summary.health_pct >= 80 ? 'bg-green-500' : data.summary.health_pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${data.summary.health_pct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-[10px]">
            <span className="text-green-400">● {data.summary.online} Online</span>
            <span className="text-red-400">● {data.summary.offline} Offline</span>
            <span className="text-slate-500">Total: {data.summary.total}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        {[
          { id: 'networks', label: 'Blockchain', icon: Globe },
          { id: 'banking', label: 'Perbankan', icon: Building2 },
          { id: 'gas', label: 'Gas Price', icon: Zap },
        ].map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
              activeTab === id ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <TabIcon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Networks Tab */}
        {activeTab === 'networks' && (
          <div className="space-y-4">
            {/* Blockchain */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Blockchain Networks</p>
              <div className="divide-y divide-slate-800">
                {loading && !data ? (
                  <div className="py-4 text-center"><RefreshCw className="w-4 h-4 animate-spin text-slate-500 mx-auto" /></div>
                ) : (
                  getNetworksByCategory('blockchain').map((n, i) => <NetworkRow key={i} item={n} />)
                )}
              </div>
            </div>
            {/* Market */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Market Data</p>
              <div className="divide-y divide-slate-800">
                {getNetworksByCategory('market').map((n, i) => <NetworkRow key={i} item={n} />)}
              </div>
            </div>
          </div>
        )}

        {/* Banking Tab */}
        {activeTab === 'banking' && (
          <div className="space-y-3">
            {bankRates ? (
              <>
                {/* IDR Rate */}
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Kurs USD/IDR Real-time</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">
                      Rp {bankRates.idr_rate?.rate?.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      Live · {bankRates.idr_rate?.source}
                    </span>
                  </div>
                </div>

                {/* Crypto IDR Prices */}
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Harga Kripto dalam IDR</p>
                  <div className="space-y-2">
                    {Object.entries(bankRates.crypto_idr || {}).filter(([,v]) => v).map(([coin, val]) => (
                      <div key={coin} className="flex items-center justify-between">
                        <span className="text-slate-300 text-xs font-medium">{coin}</span>
                        <div className="text-right">
                          <p className="text-white text-xs font-bold">Rp {val.price_idr?.toLocaleString('id-ID')}</p>
                          <p className={`text-[10px] ${val.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {val.change_24h >= 0 ? '▲' : '▼'}{Math.abs(val.change_24h || 0).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BI-FAST Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Transfer Bank Indonesia</p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-300 font-semibold">BI-FAST</span>
                    <span className="text-xs text-green-300">✅ {bankRates.bi_fast?.hours}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Fee: Rp {bankRates.bi_fast?.fee_idr?.toLocaleString()} · Max Rp {(bankRates.bi_fast?.max_amount/1_000_000).toFixed(0)} juta</p>
                </div>

                {/* Bank Fees */}
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Biaya Transfer Bank</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(bankRates.bank_fees || {}).map(([bank, fees]) => (
                      <div key={bank} className="bg-slate-900/60 rounded-lg px-2 py-1.5">
                        <p className="text-white text-[11px] font-bold">{bank}</p>
                        <p className="text-[10px] text-slate-400">Onbank: Gratis</p>
                        <p className="text-[10px] text-slate-400">BI-FAST: Rp {fees.transfer_bi_fast?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rate Sources Status */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Sumber Data Kurs</p>
                  <div className="divide-y divide-slate-800">
                    {getNetworksByCategory('banking').map((n, i) => <NetworkRow key={i} item={n} />)}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Klik refresh untuk memuat data'}
              </div>
            )}
          </div>
        )}

        {/* Gas Tab */}
        {activeTab === 'gas' && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-3">Gas Price Real-time (Gwei)</p>
            {gasData ? (
              gasData.gas_prices.map((g, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2">
                  <span className="text-xs text-slate-300">{g.name || g.chain}</span>
                  {g.error ? (
                    <span className="text-[10px] text-red-400">Offline</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${
                        g.gwei < 5 ? 'text-green-400' : g.gwei < 30 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{g.gwei} Gwei</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        g.gwei < 5 ? 'bg-green-500/20 text-green-300' :
                        g.gwei < 30 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                      }`}>{g.gwei < 5 ? 'Murah' : g.gwei < 30 ? 'Normal' : 'Mahal'}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Klik refresh'}
              </div>
            )}
            {gasData && (
              <p className="text-[10px] text-slate-600 text-center mt-2">
                Diperbarui: {new Date(gasData.timestamp).toLocaleTimeString('id-ID')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
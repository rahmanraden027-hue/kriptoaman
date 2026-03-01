import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Globe, Gem } from 'lucide-react';
import { getForexRates, getCommodityRates } from './marketDataService';

const FOREX_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/IDR', 'AUD/USD', 'XAU/USD'];
const COMMODITY_PAIRS = ['XAU/USD', 'XAG/USD', 'OIL/USD'];

function formatRate(pair, rate) {
  if (!rate) return '—';
  if (pair.includes('JPY') || pair.includes('IDR') || pair.includes('KRW')) {
    return rate.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  if (pair.includes('XAU') || pair.includes('XAG') || pair.includes('OIL') || pair.includes('XPT')) {
    return '$' + rate.toFixed(2);
  }
  return rate.toFixed(4);
}

export default function ForexCommodityWidget() {
  const [forex, setForex] = useState({});
  const [commodities, setCommodities] = useState({});
  const [prevForex, setPrevForex] = useState({});
  const [tab, setTab] = useState('forex');

  useEffect(() => {
    const update = () => {
      const newForex = getForexRates();
      const newComm = getCommodityRates();
      setPrevForex(prev => ({ ...prev, ...forex }));
      setForex(newForex);
      setCommodities(newComm);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  const displayPairs = tab === 'forex' ? FOREX_PAIRS : COMMODITY_PAIRS;
  const displayData = tab === 'forex' ? forex : commodities;

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700/40">
        <button
          onClick={() => setTab('forex')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${tab === 'forex' ? 'bg-blue-500/10 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-300'}`}
        >
          <Globe className="w-3 h-3" /> Forex
        </button>
        <button
          onClick={() => setTab('commodity')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${tab === 'commodity' ? 'bg-yellow-500/10 text-yellow-400 border-b-2 border-yellow-500' : 'text-slate-400 hover:text-slate-300'}`}
        >
          <Gem className="w-3 h-3" /> Komoditas
        </button>
      </div>

      {/* Pairs */}
      <div className="divide-y divide-slate-700/30">
        {displayPairs.map(pair => {
          const rate = displayData[pair];
          const prev = prevForex[pair];
          const up = prev ? rate > prev : null;
          return (
            <div key={pair} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${up === true ? 'bg-green-400' : up === false ? 'bg-red-400' : 'bg-slate-500'}`} />
                <span className="text-white text-xs font-semibold">{pair}</span>
              </div>
              <span className={`text-sm font-bold transition-colors ${
                up === true ? 'text-green-300' : up === false ? 'text-red-300' : 'text-white'
              }`}>
                {formatRate(pair, rate)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-slate-600 text-[10px] py-1.5">Simulasi real-time</p>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Copy, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const KAM_TOKEN = {
  symbol: 'KAM',
  name: 'KriptoAman Token',
  logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69966c5817554cf31f7ec14b/dfa859cab_generated_image.png',
  description: 'Native token untuk ekosistem KriptoAman',
  color: 'from-indigo-600 to-blue-600',
  borderColor: 'border-indigo-500',
  bgColor: 'bg-indigo-900/20',
  textColor: 'text-indigo-400',
  chain: 'Multiple Chains',
  contracts: {
    'ETH': '0x...',
    'BNB': '0x...',
    'MATIC': '0x...',
  },
  supply: {
    total: '1,000,000,000',
    circulating: '250,000,000',
    staking: '120,000,000',
  },
  stats: {
    holders: '45,231',
    transfers24h: '12,548',
    volume24h: '$2,847,591',
  },
};

export default function KAMTokenCard({ userBalance = 0 }) {
  const [copied, setCopied] = useState(null);
  const [priceUsd, setPriceUsd] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchKAMPrice = async () => {
      setLoading(true);
      try {
        // Simulasi fetch price dari CoinGecko atau API lainnya
        // Untuk demo, gunakan price tetap
        setPriceUsd(2.45);
      } catch (err) {
        console.error('Error fetching KAM price:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKAMPrice();
  }, []);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalValueUsd = (userBalance * priceUsd).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className={`bg-gradient-to-r ${KAM_TOKEN.color} rounded-xl p-6 text-white shadow-lg border ${KAM_TOKEN.borderColor}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={KAM_TOKEN.logo} alt="KAM Token" className="w-14 h-14 rounded-full object-cover" />
            <div>
              <h2 className="text-2xl font-bold">{KAM_TOKEN.symbol}</h2>
              <p className="text-indigo-100 text-sm">{KAM_TOKEN.name}</p>
            </div>
          </div>
          <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-indigo-100 text-xs font-semibold uppercase mb-1">Your Balance</p>
            <p className="text-3xl font-bold">{userBalance.toLocaleString()}</p>
            <p className="text-indigo-100 text-sm mt-1">${totalValueUsd}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-xs font-semibold uppercase mb-1">Price</p>
            <p className="text-2xl font-bold">${priceUsd?.toFixed(2)}</p>
            <div className="flex items-center justify-end gap-1 text-green-300 text-sm mt-1">
              <TrendingUp className="w-4 h-4" />
              +12.5%
            </div>
          </div>
        </div>

        <p className="text-indigo-100 text-sm mt-4">{KAM_TOKEN.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${KAM_TOKEN.bgColor} border ${KAM_TOKEN.borderColor} rounded-lg p-3`}>
          <p className={`text-xs font-semibold ${KAM_TOKEN.textColor} uppercase mb-1`}>Holders</p>
          <p className="text-white font-bold text-lg">{KAM_TOKEN.stats.holders}</p>
        </div>
        <div className={`${KAM_TOKEN.bgColor} border ${KAM_TOKEN.borderColor} rounded-lg p-3`}>
          <p className={`text-xs font-semibold ${KAM_TOKEN.textColor} uppercase mb-1`}>Transfers/24h</p>
          <p className="text-white font-bold text-lg">{KAM_TOKEN.stats.transfers24h}</p>
        </div>
        <div className={`${KAM_TOKEN.bgColor} border ${KAM_TOKEN.borderColor} rounded-lg p-3`}>
          <p className={`text-xs font-semibold ${KAM_TOKEN.textColor} uppercase mb-1`}>Volume</p>
          <p className="text-white font-bold text-lg">{KAM_TOKEN.stats.volume24h}</p>
        </div>
      </div>

      {/* Supply Info */}
      <div className={`${KAM_TOKEN.bgColor} border ${KAM_TOKEN.borderColor} rounded-lg p-4 space-y-3`}>
        <h3 className={`text-sm font-bold ${KAM_TOKEN.textColor} uppercase`}>Token Supply</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-300">Total Supply</span>
            <span className="text-white font-semibold">{KAM_TOKEN.supply.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Circulating</span>
            <span className="text-white font-semibold">{KAM_TOKEN.supply.circulating}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Staking</span>
            <span className="text-white font-semibold">{KAM_TOKEN.supply.staking}</span>
          </div>
        </div>
      </div>

      {/* Contracts */}
      <div className={`${KAM_TOKEN.bgColor} border ${KAM_TOKEN.borderColor} rounded-lg p-4 space-y-2`}>
        <h3 className={`text-sm font-bold ${KAM_TOKEN.textColor} uppercase mb-3`}>Smart Contracts</h3>
        {Object.entries(KAM_TOKEN.contracts).map(([chain, address]) => (
          <div key={chain} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
            <div>
              <p className="text-slate-300 text-xs">{chain}</p>
              <p className="text-slate-400 font-mono text-xs mt-0.5">{address}</p>
            </div>
            <button
              onClick={() => copyToClipboard(address, chain)}
              className="p-1.5 hover:bg-slate-600 rounded transition-colors"
            >
              <Copy className={`w-4 h-4 ${copied === chain ? 'text-green-400' : 'text-slate-400'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors">
          Buy KAM
        </button>
        <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors">
          Stake KAM
        </button>
      </div>

      {/* Info Badge */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-center">
        <p className="text-blue-300 text-xs">
          ✓ Official native token dengan full transparency & on-chain verification
        </p>
      </div>
    </div>
  );
}
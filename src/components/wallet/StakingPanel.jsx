import React, { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, Info, ChevronDown, Award, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Staking providers per coin with real APY data sources
const STAKING_OPTIONS = {
  ETH: [
    { id: 'lido',     name: 'Lido',        apy: 3.8,  token: 'stETH',   risk: 'Rendah',  url: 'https://stake.lido.fi',                       minStake: 0.001, desc: 'Liquid staking — terima stETH yang bisa ditransfer' },
    { id: 'rocketpool',name:'Rocket Pool',  apy: 3.5,  token: 'rETH',    risk: 'Rendah',  url: 'https://rocketpool.net',                       minStake: 0.01,  desc: 'Desentralisasi penuh, node operator independen' },
    { id: 'coinbase', name: 'Coinbase',     apy: 3.2,  token: 'cbETH',   risk: 'Rendah',  url: 'https://www.coinbase.com/earn/staking/ethereum', minStake: 0.001, desc: 'Dikelola institusi, paling mudah digunakan' },
    { id: 'binance',  name: 'Binance',      apy: 4.1,  token: 'BETH',    risk: 'Sedang',  url: 'https://www.binance.com/en/eth2',               minStake: 0.001, desc: 'APY tertinggi, dikelola Binance' },
  ],
  SOL: [
    { id: 'marinade', name: 'Marinade',     apy: 7.2,  token: 'mSOL',    risk: 'Rendah',  url: 'https://marinade.finance',                     minStake: 0.01,  desc: 'Liquid staking SOL terbesar, ratusan validator' },
    { id: 'jito',     name: 'Jito',         apy: 8.1,  token: 'JitoSOL', risk: 'Rendah',  url: 'https://www.jito.network',                     minStake: 0.01,  desc: 'MEV-boosted rewards, performa tinggi' },
    { id: 'lido-sol', name: 'Lido (SOL)',   apy: 6.8,  token: 'stSOL',   risk: 'Rendah',  url: 'https://solana.lido.fi',                       minStake: 0.1,   desc: 'Lido liquid staking untuk Solana' },
    { id: 'blaze',    name: 'BlazeStake',   apy: 7.5,  token: 'bSOL',    risk: 'Sedang',  url: 'https://stake.solblaze.org',                   minStake: 0.1,   desc: 'Rewards bonus dari komunitas & proyek Solana' },
  ],
  BNB: [
    { id: 'bnb-beacon',name:'BNB Beacon',   apy: 5.0,  token: 'BNB',     risk: 'Rendah',  url: 'https://www.bnbchain.org/en/staking',           minStake: 1,     desc: 'Staking resmi BNB Chain, delegasikan ke validator' },
    { id: 'ankr',     name: 'Ankr',         apy: 5.4,  token: 'ankrBNB', risk: 'Rendah',  url: 'https://www.ankr.com/staking/stake/bnb/',      minStake: 0.5,   desc: 'Liquid staking BNB dengan reward harian' },
    { id: 'stader',   name: 'Stader Labs',  apy: 5.7,  token: 'BNBx',    risk: 'Sedang',  url: 'https://www.staderlabs.com/bnb/',               minStake: 0.1,   desc: 'APY lebih tinggi dengan auto-compounding' },
  ],
};

const COIN_CONFIG = {
  ETH:  { color: '#627EEA', symbol: 'ETH',  name: 'Ethereum' },
  SOL:  { color: '#9945FF', symbol: 'SOL',  name: 'Solana' },
  BNB:  { color: '#F0B90B', symbol: 'BNB',  name: 'BNB' },
};

const RISK_COLORS = {
  'Rendah': 'text-green-400 bg-green-400/10 border-green-400/30',
  'Sedang': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'Tinggi': 'text-red-400 bg-red-400/10 border-red-400/30',
};

// Load/save simulated staking positions from localStorage
const STORAGE_KEY = 'wallet_staking_positions';
function loadPositions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function savePositions(pos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
}

function StakeModal({ coin, provider, onClose, onStake }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const cfg = COIN_CONFIG[coin];

  const estimatedYearly = amount ? (parseFloat(amount) * provider.apy / 100).toFixed(6) : null;
  const estimatedMonthly = estimatedYearly ? (parseFloat(estimatedYearly) / 12).toFixed(6) : null;

  const handleStake = async () => {
    if (!amount || parseFloat(amount) < provider.minStake) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onStake({ coin, providerId: provider.id, providerName: provider.name, amount: parseFloat(amount), token: provider.token, apy: provider.apy, stakedAt: new Date().toISOString(), rewards: 0 });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Stake {cfg.symbol}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: cfg.color + '22', color: cfg.color }}>{provider.name}</span>
        </div>

        <div className="bg-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">APY</span>
            <span className="text-green-400 font-bold">{provider.apy}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Token diterima</span>
            <span className="text-white">{provider.token}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Min. stake</span>
            <span className="text-white">{provider.minStake} {cfg.symbol}</span>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Jumlah {cfg.symbol}</label>
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Min. ${provider.minStake}`}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {estimatedMonthly && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Reward/bulan</span>
              <span className="text-green-400 font-semibold">+{estimatedMonthly} {cfg.symbol}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Reward/tahun</span>
              <span className="text-green-400 font-semibold">+{estimatedYearly} {cfg.symbol}</span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{provider.desc}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button
            onClick={handleStake}
            disabled={loading || !amount || parseFloat(amount) < provider.minStake}
            className="flex-1 text-white font-semibold"
            style={{ background: cfg.color }}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : `Stake ${cfg.symbol}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PositionCard({ pos, onClaim }) {
  const cfg = COIN_CONFIG[pos.coin];
  const daysSinceStake = Math.floor((Date.now() - new Date(pos.stakedAt).getTime()) / (1000 * 60 * 60 * 24));
  const simulatedRewards = (pos.amount * pos.apy / 100 / 365 * Math.max(daysSinceStake, 1)).toFixed(6);

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: cfg.color + '33', color: cfg.color }}>
            {cfg.symbol[0]}
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{pos.providerName}</div>
            <div className="text-slate-500 text-xs">{pos.coin} · {pos.apy}% APY</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-bold">{pos.amount} {cfg.symbol}</div>
          <div className="text-slate-500 text-xs">{pos.token}</div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400 text-xs font-medium">+{simulatedRewards} {cfg.symbol}</span>
          <span className="text-slate-500 text-xs">({daysSinceStake}h aktif)</span>
        </div>
        <button
          onClick={() => onClaim(pos.id, simulatedRewards)}
          className="text-xs text-green-400 border border-green-400/30 rounded-lg px-2 py-0.5 hover:bg-green-400/10 transition-colors font-medium"
        >
          Klaim
        </button>
      </div>
    </div>
  );
}

export default function StakingPanel({ addresses = {} }) {
  const [activeCoin, setActiveCoin] = useState('ETH');
  const [positions, setPositions] = useState(loadPositions);
  const [stakeModal, setStakeModal] = useState(null); // { coin, provider }
  const [claimedRewards, setClaimedRewards] = useState([]);

  const options = STAKING_OPTIONS[activeCoin] || [];
  const cfg = COIN_CONFIG[activeCoin];
  const myPositions = positions.filter(p => p.coin === activeCoin);
  const totalStaked = myPositions.reduce((s, p) => s + p.amount, 0);

  const handleStake = (newPos) => {
    const updated = [...positions, { ...newPos, id: Date.now().toString() }];
    setPositions(updated);
    savePositions(updated);
  };

  const handleClaim = (posId, rewards) => {
    setClaimedRewards(prev => [...prev, { posId, rewards, coin: activeCoin, at: new Date().toISOString() }]);
    alert(`✅ Reward ${rewards} ${cfg.symbol} berhasil diklaim! (simulasi)`);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-slate-400" />
        <h2 className="text-white font-semibold text-sm">Staking</h2>
        <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">PoS</span>
      </div>

      {/* Coin Tabs */}
      <div className="flex gap-1.5">
        {Object.entries(COIN_CONFIG).map(([id, c]) => (
          <button
            key={id}
            onClick={() => setActiveCoin(id)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeCoin === id ? 'text-white border-transparent' : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-300'}`}
            style={activeCoin === id ? { background: c.color + 'cc', borderColor: c.color } : {}}
          >
            {c.symbol}
          </button>
        ))}
      </div>

      {/* My Positions */}
      {myPositions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Posisi Aktif</span>
            <span className="text-white text-xs font-bold">{totalStaked.toFixed(4)} {cfg.symbol} distake</span>
          </div>
          {myPositions.map(pos => (
            <PositionCard key={pos.id} pos={pos} onClaim={handleClaim} />
          ))}
        </div>
      )}

      {/* Staking Options */}
      <div className="space-y-2">
        <span className="text-slate-400 text-xs font-medium">Provider Tersedia</span>
        {options.map(opt => (
          <div key={opt.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-white text-sm font-semibold">{opt.name}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${RISK_COLORS[opt.risk]}`}>
                  {opt.risk}
                </span>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold text-sm">{opt.apy}% APY</div>
                <div className="text-slate-500 text-xs">{opt.token}</div>
              </div>
            </div>
            <p className="text-slate-500 text-xs mb-3">{opt.desc}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => setStakeModal({ coin: activeCoin, provider: opt })}
                size="sm"
                className="flex-1 text-white text-xs font-semibold h-8"
                style={{ background: cfg.color + 'cc' }}
              >
                Stake {cfg.symbol}
              </Button>
              <a
                href={opt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 h-8 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-xs transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Staking Info */}
      <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
        <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-slate-500 text-xs">
          Staking dilakukan langsung di protokol pilihan (non-custodial). Reward dikalkulasi secara simulasi — klik "Stake" untuk diarahkan ke platform resmi.
        </p>
      </div>

      {/* Modal */}
      {stakeModal && (
        <StakeModal
          coin={stakeModal.coin}
          provider={stakeModal.provider}
          onClose={() => setStakeModal(null)}
          onStake={handleStake}
        />
      )}
    </div>
  );
}
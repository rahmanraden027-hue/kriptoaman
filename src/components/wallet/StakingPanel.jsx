import React, { useState, useMemo } from 'react';
import { ExternalLink, Info, Award, Lock, RefreshCw, BarChart2, GitCompare, RotateCcw, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STAKING_OPTIONS = {
  ETH: [
    { id: 'lido',      name: 'Lido',        apy: 3.8,  fee: 10, token: 'stETH',   risk: 'Rendah', url: 'https://stake.lido.fi',                        minStake: 0.001, desc: 'Liquid staking — terima stETH yang bisa ditransfer' },
    { id: 'rocketpool',name: 'Rocket Pool', apy: 3.5,  fee: 15, token: 'rETH',    risk: 'Rendah', url: 'https://rocketpool.net',                        minStake: 0.01,  desc: 'Desentralisasi penuh, node operator independen' },
    { id: 'coinbase',  name: 'Coinbase',    apy: 3.2,  fee: 25, token: 'cbETH',   risk: 'Rendah', url: 'https://www.coinbase.com/earn/staking/ethereum', minStake: 0.001, desc: 'Dikelola institusi, paling mudah digunakan' },
    { id: 'binance',   name: 'Binance',     apy: 4.1,  fee: 10, token: 'BETH',    risk: 'Sedang', url: 'https://www.binance.com/en/eth2',                minStake: 0.001, desc: 'APY tertinggi, dikelola Binance' },
  ],
  SOL: [
    { id: 'marinade',  name: 'Marinade',    apy: 7.2,  fee: 0,  token: 'mSOL',    risk: 'Rendah', url: 'https://marinade.finance',                      minStake: 0.01,  desc: 'Liquid staking SOL terbesar, ratusan validator' },
    { id: 'jito',      name: 'Jito',        apy: 8.1,  fee: 4,  token: 'JitoSOL', risk: 'Rendah', url: 'https://www.jito.network',                      minStake: 0.01,  desc: 'MEV-boosted rewards, performa tinggi' },
    { id: 'lido-sol',  name: 'Lido (SOL)',  apy: 6.8,  fee: 10, token: 'stSOL',   risk: 'Rendah', url: 'https://solana.lido.fi',                        minStake: 0.1,   desc: 'Lido liquid staking untuk Solana' },
    { id: 'blaze',     name: 'BlazeStake', apy: 7.5,  fee: 6,  token: 'bSOL',    risk: 'Sedang', url: 'https://stake.solblaze.org',                    minStake: 0.1,   desc: 'Rewards bonus dari komunitas & proyek Solana' },
  ],
  BNB: [
    { id: 'bnb-beacon',name: 'BNB Beacon', apy: 5.0,  fee: 0,  token: 'BNB',     risk: 'Rendah', url: 'https://www.bnbchain.org/en/staking',            minStake: 1,     desc: 'Staking resmi BNB Chain, delegasikan ke validator' },
    { id: 'ankr',      name: 'Ankr',       apy: 5.4,  fee: 2,  token: 'ankrBNB', risk: 'Rendah', url: 'https://www.ankr.com/staking/stake/bnb/',        minStake: 0.5,   desc: 'Liquid staking BNB dengan reward harian' },
    { id: 'stader',    name: 'Stader Labs', apy: 5.7, fee: 5,  token: 'BNBx',    risk: 'Sedang', url: 'https://www.staderlabs.com/bnb/',                minStake: 0.1,   desc: 'APY lebih tinggi dengan auto-compounding' },
  ],
};

const COIN_CONFIG = {
  ETH: { color: '#627EEA', symbol: 'ETH', name: 'Ethereum' },
  SOL: { color: '#9945FF', symbol: 'SOL', name: 'Solana' },
  BNB: { color: '#F0B90B', symbol: 'BNB', name: 'BNB' },
};

const RISK_COLORS = {
  'Rendah': 'text-green-400 bg-green-400/10 border-green-400/30',
  'Sedang': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
};

const STORAGE_KEY = 'wallet_staking_positions_v2';
const HISTORY_KEY = 'wallet_staking_history';

function loadPositions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function savePositions(pos) { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); }
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

// Generate simulated historical data for chart
function generateHistory(positions) {
  const now = Date.now();
  const days = 30;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * 86400000);
    const label = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    let staked = 0, rewards = 0;
    positions.forEach(pos => {
      const age = Math.max(0, (d.getTime() - new Date(pos.stakedAt).getTime()) / 86400000);
      if (age >= 0) {
        staked += pos.amount;
        // Add claimed rewards restaked
        rewards += parseFloat((pos.amount * pos.apy / 100 / 365 * age).toFixed(6));
        if (pos.autoRestake) staked += rewards * 0.8; // restaked rewards add to principal
      }
    });
    return { date: label, staked: parseFloat(staked.toFixed(4)), rewards: parseFloat(rewards.toFixed(6)) };
  });
}

// ── Modal Stake ──────────────────────────────────────────────────────────────
function StakeModal({ coin, provider, onClose, onStake }) {
  const [amount, setAmount] = useState('');
  const [autoRestake, setAutoRestake] = useState(false);
  const [loading, setLoading] = useState(false);
  const cfg = COIN_CONFIG[coin];

  const estYearly  = amount ? (parseFloat(amount) * provider.apy / 100).toFixed(6) : null;
  const estMonthly = estYearly ? (parseFloat(estYearly) / 12).toFixed(6) : null;
  const netApy     = (provider.apy * (1 - provider.fee / 100)).toFixed(2);

  const handleStake = async () => {
    if (!amount || parseFloat(amount) < provider.minStake) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    onStake({ coin, providerId: provider.id, providerName: provider.name, amount: parseFloat(amount), token: provider.token, apy: provider.apy, fee: provider.fee, autoRestake, stakedAt: new Date().toISOString() });
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

        <div className="bg-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-slate-400">APY Kotor</span><span className="text-green-400 font-bold">{provider.apy}%</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Biaya Provider</span><span className="text-yellow-400">{provider.fee}%</span></div>
          <div className="flex justify-between border-t border-slate-700 pt-1.5"><span className="text-slate-300 font-medium">APY Bersih</span><span className="text-green-300 font-bold">{netApy}%</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Token diterima</span><span className="text-white">{provider.token}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Min. stake</span><span className="text-white">{provider.minStake} {cfg.symbol}</span></div>
        </div>

        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Jumlah {cfg.symbol}</label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min. ${provider.minStake}`} className="bg-slate-800 border-slate-700 text-white" />
        </div>

        {/* Auto-Restake Toggle */}
        <div
          onClick={() => setAutoRestake(v => !v)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${autoRestake ? 'border-purple-500/40 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50'}`}
        >
          <div className="flex items-center gap-2">
            <RotateCcw className={`w-4 h-4 ${autoRestake ? 'text-purple-400' : 'text-slate-500'}`} />
            <div>
              <div className={`text-xs font-semibold ${autoRestake ? 'text-purple-300' : 'text-slate-300'}`}>Auto Re-Stake Reward</div>
              <div className="text-slate-500 text-xs">Reward otomatis di-compound ke posisi ini</div>
            </div>
          </div>
          <div className={`w-9 h-5 rounded-full transition-colors relative ${autoRestake ? 'bg-purple-500' : 'bg-slate-600'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoRestake ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </div>

        {estMonthly && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-400"><span>Reward/bulan (net)</span><span className="text-green-400 font-semibold">+{(parseFloat(amount) * parseFloat(netApy) / 100 / 12).toFixed(6)} {cfg.symbol}</span></div>
            <div className="flex justify-between text-slate-400"><span>Reward/tahun (net)</span><span className="text-green-400 font-semibold">+{(parseFloat(amount) * parseFloat(netApy) / 100).toFixed(6)} {cfg.symbol}</span></div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleStake} disabled={loading || !amount || parseFloat(amount) < provider.minStake} className="flex-1 text-white font-semibold" style={{ background: cfg.color }}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : `Stake ${cfg.symbol}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Position Card ─────────────────────────────────────────────────────────────
function PositionCard({ pos, onClaim, onRestake }) {
  const cfg = COIN_CONFIG[pos.coin];
  const daysActive = Math.max(1, Math.floor((Date.now() - new Date(pos.stakedAt).getTime()) / 86400000));
  const netApy = pos.apy * (1 - (pos.fee || 0) / 100);
  const simulatedRewards = parseFloat((pos.amount * netApy / 100 / 365 * daysActive).toFixed(6));
  const totalStaked = pos.amount + (pos.restakedRewards || 0);

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: cfg.color + '33', color: cfg.color }}>
            {cfg.symbol[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-sm font-semibold">{pos.providerName}</span>
              {pos.autoRestake && <span className="flex items-center gap-0.5 text-purple-400 text-xs bg-purple-400/10 border border-purple-400/20 rounded px-1"><RotateCcw className="w-2.5 h-2.5" />Auto</span>}
            </div>
            <div className="text-slate-500 text-xs">{pos.coin} · {netApy.toFixed(2)}% APY net · {daysActive}h aktif</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-bold">{totalStaked.toFixed(4)} {cfg.symbol}</div>
          {pos.restakedRewards > 0 && <div className="text-purple-400 text-xs">+{pos.restakedRewards.toFixed(4)} re-stake</div>}
        </div>
      </div>
      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 gap-2">
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400 text-xs font-medium">+{simulatedRewards} {cfg.symbol}</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onRestake(pos.id, simulatedRewards)} className="text-xs text-purple-400 border border-purple-400/30 rounded-lg px-2 py-0.5 hover:bg-purple-400/10 transition-colors font-medium">
            Re-stake
          </button>
          <button onClick={() => onClaim(pos.id, simulatedRewards)} className="text-xs text-green-400 border border-green-400/30 rounded-lg px-2 py-0.5 hover:bg-green-400/10 transition-colors font-medium">
            Klaim
          </button>
        </div>
      </div>
    </div>
  );
}

// ── APY Comparison Chart ───────────────────────────────────────────────────────
function APYCompareView({ coin }) {
  const options = STAKING_OPTIONS[coin] || [];
  const cfg = COIN_CONFIG[coin];
  const data = options.map(o => ({
    name: o.name,
    'APY Kotor': o.apy,
    'APY Bersih': parseFloat((o.apy * (1 - o.fee / 100)).toFixed(2)),
    'Biaya (%)': o.fee,
  }));
  const maxApy = options.reduce((m, o) => o.apy > m.apy ? o : m, options[0]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        <GitCompare className="w-3.5 h-3.5" />
        <span>Perbandingan Provider {cfg.symbol}</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#fff' }}
            formatter={(v, n) => [`${v}%`, n]}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
          <Bar dataKey="APY Kotor" fill={cfg.color + '88'} radius={[4, 4, 0, 0]} />
          <Bar dataKey="APY Bersih" fill={cfg.color} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Biaya (%)" fill="#f43f5e88" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Detail Table */}
      <div className="space-y-1.5">
        {[...options].sort((a, b) => b.apy - a.apy).map(opt => {
          const netApy = (opt.apy * (1 - opt.fee / 100)).toFixed(2);
          const isBest = opt.id === maxApy.id;
          return (
            <div key={opt.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${isBest ? 'border-green-500/30 bg-green-500/5' : 'border-slate-700/40 bg-slate-800/30'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-medium">{opt.name}</span>
                {isBest && <span className="text-green-400 text-xs bg-green-400/10 border border-green-400/20 px-1 rounded">Terbaik</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Biaya <span className="text-yellow-400">{opt.fee}%</span></span>
                <span className="text-slate-400">Net <span className="text-green-400 font-bold">{netApy}%</span></span>
                <a href={opt.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white"><ExternalLink className="w-3 h-3" /></a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── History Chart ─────────────────────────────────────────────────────────────
function HistoryChartView({ positions, coin }) {
  const cfg = COIN_CONFIG[coin];
  const data = useMemo(() => generateHistory(positions), [positions]);
  const totalRewards = data[data.length - 1]?.rewards || 0;
  const totalStaked  = data[data.length - 1]?.staked  || 0;

  if (positions.length === 0) {
    return <div className="py-8 text-center text-slate-500 text-xs">Belum ada posisi staking untuk {cfg.symbol}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
          <div className="text-slate-400 text-xs mb-0.5">Total Distake</div>
          <div className="text-white font-bold text-sm">{totalStaked.toFixed(4)} {cfg.symbol}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <div className="text-slate-400 text-xs mb-0.5">Total Reward (30h)</div>
          <div className="text-green-400 font-bold text-sm">+{totalRewards.toFixed(6)} {cfg.symbol}</div>
        </div>
      </div>

      <div>
        <div className="text-slate-400 text-xs mb-2">Jumlah Distake (30 Hari)</div>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="stakeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} interval={6} />
            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} formatter={v => [`${v} ${cfg.symbol}`, 'Distake']} />
            <Area type="monotone" dataKey="staked" stroke={cfg.color} strokeWidth={2} fill="url(#stakeGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="text-slate-400 text-xs mb-2">Akumulasi Reward (30 Hari)</div>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="rewardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} interval={6} />
            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} formatter={v => [`${v} ${cfg.symbol}`, 'Reward']} />
            <Area type="monotone" dataKey="rewards" stroke="#22c55e" strokeWidth={2} fill="url(#rewardGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Provider List ─────────────────────────────────────────────────────────────
function ProviderListView({ coin, cfg, options, onStakeClick }) {
  return (
    <div className="space-y-2">
      {options.map(opt => {
        const netApy = (opt.apy * (1 - opt.fee / 100)).toFixed(2);
        return (
          <div key={opt.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-semibold">{opt.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${RISK_COLORS[opt.risk]}`}>{opt.risk}</span>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold text-sm">{netApy}%</div>
                <div className="text-slate-500 text-xs">net APY · fee {opt.fee}%</div>
              </div>
            </div>
            <p className="text-slate-500 text-xs mb-2.5">{opt.desc}</p>
            <div className="flex gap-2">
              <Button onClick={() => onStakeClick({ coin, provider: opt })} size="sm" className="flex-1 text-white text-xs font-semibold h-8" style={{ background: cfg.color + 'cc' }}>
                Stake {cfg.symbol}
              </Button>
              <a href={opt.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 h-8 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-xs transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StakingPanel({ addresses = {} }) {
  const [activeCoin, setActiveCoin] = useState('ETH');
  const [activeTab, setActiveTab] = useState('stake'); // 'stake' | 'compare' | 'history'
  const [positions, setPositions] = useState(loadPositions);
  const [stakeModal, setStakeModal] = useState(null);

  const options  = STAKING_OPTIONS[activeCoin] || [];
  const cfg      = COIN_CONFIG[activeCoin];
  const myPos    = positions.filter(p => p.coin === activeCoin);
  const totalStaked = myPos.reduce((s, p) => s + p.amount + (p.restakedRewards || 0), 0);

  const handleStake = (newPos) => {
    const updated = [...positions, { ...newPos, id: Date.now().toString(), restakedRewards: 0 }];
    setPositions(updated);
    savePositions(updated);
  };

  const handleClaim = (posId, rewards) => {
    alert(`✅ Reward ${rewards} ${cfg.symbol} berhasil diklaim! (simulasi)`);
    // record in history
    const h = [...loadHistory(), { posId, rewards, coin: activeCoin, type: 'claim', at: new Date().toISOString() }];
    saveHistory(h.slice(-200));
  };

  const handleRestake = (posId, rewards) => {
    const updated = positions.map(p => p.id === posId ? { ...p, restakedRewards: parseFloat(((p.restakedRewards || 0) + parseFloat(rewards)).toFixed(6)) } : p);
    setPositions(updated);
    savePositions(updated);
    alert(`♻️ ${rewards} ${cfg.symbol} berhasil di-restake ke posisi! (simulasi)`);
    const h = [...loadHistory(), { posId, rewards, coin: activeCoin, type: 'restake', at: new Date().toISOString() }];
    saveHistory(h.slice(-200));
  };

  const TABS = [
    { id: 'stake',   label: 'Stake',    icon: Lock },
    { id: 'compare', label: 'Bandingkan', icon: GitCompare },
    { id: 'history', label: 'Grafik',   icon: BarChart2 },
  ];

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
          <button key={id} onClick={() => setActiveCoin(id)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeCoin === id ? 'text-white border-transparent' : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-300'}`}
            style={activeCoin === id ? { background: c.color + 'cc', borderColor: c.color } : {}}
          >{c.symbol}</button>
        ))}
      </div>

      {/* Feature Tabs */}
      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
          >
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {/* My Positions (always visible on stake tab) */}
      {activeTab === 'stake' && myPos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Posisi Aktif</span>
            <span className="text-white text-xs font-bold">{totalStaked.toFixed(4)} {cfg.symbol}</span>
          </div>
          {myPos.map(pos => (
            <PositionCard key={pos.id} pos={pos} onClaim={handleClaim} onRestake={handleRestake} />
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'stake' && (
        <>
          <div className="text-slate-400 text-xs font-medium">Provider Tersedia</div>
          <ProviderListView coin={activeCoin} cfg={cfg} options={options} onStakeClick={setStakeModal} />
        </>
      )}

      {activeTab === 'compare' && <APYCompareView coin={activeCoin} />}

      {activeTab === 'history' && <HistoryChartView positions={myPos} coin={activeCoin} />}

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
        <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-slate-500 text-xs">Staking non-custodial via protokol pilihan. Reward & grafik bersifat simulasi.</p>
      </div>

      {stakeModal && (
        <StakeModal coin={stakeModal.coin} provider={stakeModal.provider} onClose={() => setStakeModal(null)} onStake={handleStake} />
      )}
    </div>
  );
}
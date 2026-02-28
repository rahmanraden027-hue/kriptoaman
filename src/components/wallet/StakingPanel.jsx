import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ExternalLink, Info, Award, Lock, RefreshCw, BarChart2, GitCompare,
  RotateCcw, CheckCircle2, TrendingUp, Bell, BellOff, ArrowDownToLine,
  Wallet, Zap, X, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

// ── Data ──────────────────────────────────────────────────────────────────────
const STAKING_OPTIONS = {
  ETH: [
    { id: 'lido',       name: 'Lido',        apy: 3.8, fee: 10, token: 'stETH',    risk: 'Rendah', url: 'https://stake.lido.fi',                        minStake: 0.001, desc: 'Liquid staking — terima stETH yang bisa ditransfer' },
    { id: 'rocketpool', name: 'Rocket Pool', apy: 3.5, fee: 15, token: 'rETH',     risk: 'Rendah', url: 'https://rocketpool.net',                        minStake: 0.01,  desc: 'Desentralisasi penuh, node operator independen' },
    { id: 'coinbase',   name: 'Coinbase',    apy: 3.2, fee: 25, token: 'cbETH',    risk: 'Rendah', url: 'https://www.coinbase.com/earn/staking/ethereum', minStake: 0.001, desc: 'Dikelola institusi, paling mudah digunakan' },
    { id: 'binance',    name: 'Binance',     apy: 4.1, fee: 10, token: 'BETH',     risk: 'Sedang', url: 'https://www.binance.com/en/eth2',                minStake: 0.001, desc: 'APY tertinggi, dikelola Binance' },
  ],
  SOL: [
    { id: 'marinade',   name: 'Marinade',    apy: 7.2, fee: 0,  token: 'mSOL',     risk: 'Rendah', url: 'https://marinade.finance',                      minStake: 0.01,  desc: 'Liquid staking SOL terbesar, ratusan validator' },
    { id: 'jito',       name: 'Jito',        apy: 8.1, fee: 4,  token: 'JitoSOL',  risk: 'Rendah', url: 'https://www.jito.network',                      minStake: 0.01,  desc: 'MEV-boosted rewards, performa tinggi' },
    { id: 'lido-sol',   name: 'Lido (SOL)',  apy: 6.8, fee: 10, token: 'stSOL',    risk: 'Rendah', url: 'https://solana.lido.fi',                        minStake: 0.1,   desc: 'Lido liquid staking untuk Solana' },
    { id: 'blaze',      name: 'BlazeStake', apy: 7.5, fee: 6,  token: 'bSOL',     risk: 'Sedang', url: 'https://stake.solblaze.org',                    minStake: 0.1,   desc: 'Rewards bonus dari komunitas & proyek Solana' },
  ],
  BNB: [
    { id: 'bnb-beacon', name: 'BNB Beacon', apy: 5.0, fee: 0,  token: 'BNB',      risk: 'Rendah', url: 'https://www.bnbchain.org/en/staking',            minStake: 1,     desc: 'Staking resmi BNB Chain, delegasikan ke validator' },
    { id: 'ankr',       name: 'Ankr',       apy: 5.4, fee: 2,  token: 'ankrBNB',  risk: 'Rendah', url: 'https://www.ankr.com/staking/stake/bnb/',        minStake: 0.5,   desc: 'Liquid staking BNB dengan reward harian' },
    { id: 'stader',     name: 'Stader Labs', apy: 5.7, fee: 5, token: 'BNBx',     risk: 'Sedang', url: 'https://www.staderlabs.com/bnb/',                minStake: 0.1,   desc: 'APY lebih tinggi dengan auto-compounding' },
  ],
};

const COIN_CONFIG = {
  ETH: { color: '#627EEA', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  SOL: { color: '#9945FF', symbol: 'SOL', name: 'Solana',   icon: '◎' },
  BNB: { color: '#F0B90B', symbol: 'BNB', name: 'BNB',      icon: 'B' },
};

const RISK_COLORS = {
  'Rendah': 'text-green-400 bg-green-400/10 border-green-400/30',
  'Sedang': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
};

const STORAGE_KEY = 'wallet_staking_positions_v2';
const HISTORY_KEY = 'wallet_staking_history';
const NOTIF_KEY   = 'wallet_staking_notifs';

// ── Storage ───────────────────────────────────────────────────────────────────
function loadPositions() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function savePositions(pos) { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); }
function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; } }
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }
function loadNotifs() { try { return JSON.parse(localStorage.getItem(NOTIF_KEY)) || []; } catch { return []; } }
function saveNotifs(n) { localStorage.setItem(NOTIF_KEY, JSON.stringify(n)); }

// ── Utilities ─────────────────────────────────────────────────────────────────
function computeRewards(pos) {
  const daysActive = Math.max(1, (Date.now() - new Date(pos.stakedAt).getTime()) / 86400000);
  const netApy = pos.apy * (1 - (pos.fee || 0) / 100);
  return parseFloat((pos.amount * netApy / 100 / 365 * daysActive).toFixed(6));
}

function generateHistory(positions) {
  const days = 30;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const label = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    let staked = 0, rewards = 0;
    positions.forEach(pos => {
      const age = Math.max(0, (d.getTime() - new Date(pos.stakedAt).getTime()) / 86400000);
      staked += pos.amount + (pos.restakedRewards || 0);
      rewards += parseFloat((pos.amount * pos.apy * (1 - pos.fee / 100) / 100 / 365 * age).toFixed(6));
    });
    return { date: label, staked: parseFloat(staked.toFixed(4)), rewards: parseFloat(rewards.toFixed(6)) };
  });
}

// ── Notification Toast ────────────────────────────────────────────────────────
function NotifToast({ notif, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-start gap-3 bg-slate-800 border border-green-500/40 rounded-2xl px-4 py-3 shadow-2xl min-w-[260px] max-w-[340px] animate-in slide-in-from-bottom-4">
      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Award className="w-4 h-4 text-green-400" />
      </div>
      <div className="flex-1">
        <div className="text-white text-sm font-semibold">{notif.title}</div>
        <div className="text-slate-400 text-xs mt-0.5">{notif.body}</div>
      </div>
      <button onClick={onDismiss} className="text-slate-500 hover:text-white mt-0.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotifBell({ notifs, onClear }) {
  const [open, setOpen] = useState(false);
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
        <Bell className="w-3.5 h-3.5 text-slate-400" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-slate-900 border border-slate-700 rounded-xl w-72 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <span className="text-white text-xs font-semibold">Notifikasi Staking</span>
            <button onClick={() => { onClear(); setOpen(false); }} className="text-slate-500 text-xs hover:text-slate-300">Hapus semua</button>
          </div>
          {notifs.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">Belum ada notifikasi</div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800">
              {[...notifs].reverse().map((n, i) => (
                <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 ${n.read ? 'opacity-60' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.type === 'reward' ? 'bg-green-500/20' : n.type === 'withdraw' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                    {n.type === 'reward' ? <Award className="w-3 h-3 text-green-400" /> : n.type === 'withdraw' ? <ArrowDownToLine className="w-3 h-3 text-orange-400" /> : <Zap className="w-3 h-3 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium">{n.title}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{n.body}</div>
                    <div className="text-slate-600 text-[10px]">{new Date(n.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stake Modal ───────────────────────────────────────────────────────────────
function StakeModal({ coin, provider, onClose, onStake }) {
  const [amount, setAmount] = useState('');
  const [autoRestake, setAutoRestake] = useState(false);
  const [loading, setLoading] = useState(false);
  const cfg = COIN_CONFIG[coin];
  const netApy = (provider.apy * (1 - provider.fee / 100)).toFixed(2);

  const handleStake = async () => {
    if (!amount || parseFloat(amount) < provider.minStake) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    onStake({ coin, providerId: provider.id, providerName: provider.name, amount: parseFloat(amount), token: provider.token, apy: provider.apy, fee: provider.fee, autoRestake, stakedAt: new Date().toISOString() });
    setLoading(false);
    onClose();
  };

  const monthly = amount ? (parseFloat(amount) * parseFloat(netApy) / 100 / 12).toFixed(6) : null;
  const yearly  = amount ? (parseFloat(amount) * parseFloat(netApy) / 100).toFixed(6) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Stake {cfg.symbol}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: cfg.color + '22', color: cfg.color }}>{provider.name}</span>
        </div>

        {/* APY Breakdown */}
        <div className="bg-slate-800 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">APY Kotor</span>
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-green-400" style={{ width: `${Math.min(provider.apy / 10 * 100, 100)}%` }} />
              </div>
              <span className="text-green-400 font-bold">{provider.apy}%</span>
            </div>
          </div>
          <div className="flex justify-between"><span className="text-slate-400">Biaya Provider</span><span className="text-yellow-400">-{provider.fee}%</span></div>
          <div className="flex justify-between border-t border-slate-700 pt-2">
            <span className="text-slate-300 font-medium">APY Bersih</span>
            <span className="text-green-300 font-bold text-sm">{netApy}%</span>
          </div>
          <div className="flex justify-between"><span className="text-slate-400">Token diterima</span><span className="text-white">{provider.token}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Min. stake</span><span className="text-white">{provider.minStake} {cfg.symbol}</span></div>
        </div>

        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">Jumlah {cfg.symbol}</label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min. ${provider.minStake}`} className="bg-slate-800 border-slate-700 text-white" />
        </div>

        {/* Auto-Restake Toggle */}
        <div onClick={() => setAutoRestake(v => !v)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${autoRestake ? 'border-purple-500/40 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
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

        {monthly && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-slate-400">Reward/bulan</span><span className="text-green-400 font-semibold">+{monthly} {cfg.symbol}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Reward/tahun</span><span className="text-green-400 font-semibold">+{yearly} {cfg.symbol}</span></div>
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

// ── Withdraw Modal ────────────────────────────────────────────────────────────
function WithdrawModal({ pos, onClose, onWithdraw }) {
  const cfg = COIN_CONFIG[pos.coin];
  const rewards = computeRewards(pos);
  const total = pos.amount + (pos.restakedRewards || 0) + rewards;
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onWithdraw(pos.id, total, rewards);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-semibold">Withdraw Staking</h3>

        <div className="bg-slate-800 rounded-xl p-4 space-y-2.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Provider</span><span className="text-white">{pos.providerName}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Pokok</span><span className="text-white">{pos.amount.toFixed(6)} {cfg.symbol}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Re-staked</span><span className="text-purple-400">+{(pos.restakedRewards || 0).toFixed(6)} {cfg.symbol}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Reward terakrual</span><span className="text-green-400">+{rewards.toFixed(6)} {cfg.symbol}</span></div>
          <div className="flex justify-between border-t border-slate-700 pt-2.5">
            <span className="text-white font-semibold">Total diterima</span>
            <span className="text-green-400 font-bold">{total.toFixed(6)} {cfg.symbol}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-yellow-300 text-xs">Withdraw akan menutup posisi staking ini. Reward belum diklaim akan ikut ditarik. (simulasi)</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Batal</Button>
          <Button onClick={handleWithdraw} disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Withdraw'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Position Card ─────────────────────────────────────────────────────────────
function PositionCard({ pos, onClaim, onRestake, onWithdraw }) {
  const cfg = COIN_CONFIG[pos.coin];
  const daysActive = Math.max(1, Math.floor((Date.now() - new Date(pos.stakedAt).getTime()) / 86400000));
  const netApy = pos.apy * (1 - (pos.fee || 0) / 100);
  const rewards = computeRewards(pos);
  const totalStaked = pos.amount + (pos.restakedRewards || 0);
  const rewardPct = totalStaked > 0 ? Math.min((rewards / totalStaked) * 100, 100) : 0;

  // Mini pie data: principal vs rewards
  const pieData = [
    { value: totalStaked, label: 'Pokok' },
    { value: rewards,     label: 'Reward' },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-base" style={{ background: cfg.color + '33', color: cfg.color }}>
            {cfg.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-sm font-semibold">{pos.providerName}</span>
              {pos.autoRestake && (
                <span className="flex items-center gap-0.5 text-purple-400 text-[10px] bg-purple-400/10 border border-purple-400/20 rounded px-1">
                  <RotateCcw className="w-2.5 h-2.5" />Auto
                </span>
              )}
            </div>
            <div className="text-slate-500 text-xs">{pos.coin} · {netApy.toFixed(2)}% APY net · {daysActive}h aktif</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-bold">{totalStaked.toFixed(4)}</div>
          <div className="text-slate-500 text-xs">{cfg.symbol}</div>
        </div>
      </div>

      {/* Visualization: staked vs rewards bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Pokok</span>
            <span>Reward</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden flex">
            <div className="h-full rounded-l-full transition-all" style={{ width: `${100 - rewardPct}%`, background: cfg.color }} />
            <div className="h-full rounded-r-full bg-green-500 transition-all" style={{ width: `${rewardPct}%` }} />
          </div>
        </div>
        <div className="w-12 h-12 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={14} outerRadius={22} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                <Cell fill={cfg.color} />
                <Cell fill="#22c55e" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* APY badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1">
          <TrendingUp className="w-3 h-3 text-green-400" />
          <span className="text-green-400 font-semibold">{netApy.toFixed(2)}% APY</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-slate-700/60 border border-slate-600/30 rounded-lg px-2 py-1">
          <span className="text-slate-400">Token:</span>
          <span className="text-white font-medium">{pos.token}</span>
        </div>
      </div>

      {/* Reward row */}
      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5 gap-2">
        <div className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-green-400 shrink-0" />
          <div>
            <div className="text-green-400 text-xs font-bold">+{rewards} {cfg.symbol}</div>
            <div className="text-slate-500 text-[10px]">Reward terakrual</div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onRestake(pos.id, rewards)} className="text-xs text-purple-400 border border-purple-400/30 rounded-lg px-2 py-1 hover:bg-purple-400/10 transition-colors font-medium">
            Re-stake
          </button>
          <button onClick={() => onClaim(pos.id, rewards)} className="text-xs text-green-400 border border-green-400/30 rounded-lg px-2 py-1 hover:bg-green-400/10 transition-colors font-medium">
            Klaim
          </button>
        </div>
      </div>

      {/* Withdraw */}
      <button onClick={() => onWithdraw(pos)} className="w-full flex items-center justify-center gap-2 text-xs text-orange-400 border border-orange-400/30 rounded-xl py-2 hover:bg-orange-400/10 transition-colors font-medium">
        <ArrowDownToLine className="w-3.5 h-3.5" /> Withdraw Semua
      </button>
    </div>
  );
}

// ── APY Compare View ──────────────────────────────────────────────────────────
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
      <div className="text-slate-400 text-xs mb-1">Perbandingan APY — {cfg.symbol}</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff' }} formatter={(v, n) => [`${v}%`, n]} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
          <Bar dataKey="APY Kotor" fill={cfg.color + '88'} radius={[4, 4, 0, 0]} />
          <Bar dataKey="APY Bersih" fill={cfg.color} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Biaya (%)" fill="#f43f5e88" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="space-y-1.5">
        {[...options].sort((a, b) => b.apy - a.apy).map(opt => {
          const netApy = (opt.apy * (1 - opt.fee / 100)).toFixed(2);
          const isBest = opt.id === maxApy.id;
          return (
            <div key={opt.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs ${isBest ? 'border-green-500/30 bg-green-500/5' : 'border-slate-700/40 bg-slate-800/30'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-medium">{opt.name}</span>
                {isBest && <span className="text-green-400 text-[10px] bg-green-400/10 border border-green-400/20 px-1 rounded">Terbaik</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Fee <span className="text-yellow-400">{opt.fee}%</span></span>
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

// ── History Chart View ────────────────────────────────────────────────────────
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
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1"><Wallet className="w-3 h-3" /> Total Distake</div>
          <div className="text-white font-bold text-sm">{totalStaked.toFixed(4)} <span className="text-slate-400 font-normal text-xs">{cfg.symbol}</span></div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1"><Award className="w-3 h-3 text-green-400" /> Total Reward</div>
          <div className="text-green-400 font-bold text-sm">+{totalRewards.toFixed(6)} <span className="text-slate-400 font-normal text-xs">{cfg.symbol}</span></div>
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

// ── Provider List View ────────────────────────────────────────────────────────
function ProviderListView({ coin, cfg, options, onStakeClick }) {
  return (
    <div className="space-y-2">
      {options.map(opt => {
        const netApy = (opt.apy * (1 - opt.fee / 100)).toFixed(2);
        return (
          <div key={opt.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-semibold">{opt.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${RISK_COLORS[opt.risk]}`}>{opt.risk}</span>
              </div>
              <div className="text-right">
                {/* Clear APY display */}
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-bold text-base">{netApy}%</span>
                </div>
                <div className="text-slate-500 text-[10px]">net APY · fee {opt.fee}%</div>
              </div>
            </div>

            {/* APY visual bar */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                <span>APY Bersih</span><span>{netApy}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
                  style={{ width: `${Math.min(parseFloat(netApy) / 10 * 100, 100)}%` }} />
              </div>
            </div>

            <p className="text-slate-500 text-xs mb-2.5">{opt.desc}</p>
            <div className="flex gap-2">
              <Button onClick={() => onStakeClick({ coin, provider: opt })} size="sm" className="flex-1 text-white text-xs font-semibold h-8" style={{ background: cfg.color + 'cc' }}>
                Stake {cfg.symbol}
              </Button>
              <a href={opt.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 h-8 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-xs transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main StakingPanel ─────────────────────────────────────────────────────────
export default function StakingPanel({ addresses = {} }) {
  const [activeCoin, setActiveCoin] = useState('ETH');
  const [activeTab, setActiveTab] = useState('stake');
  const [positions, setPositions] = useState(loadPositions);
  const [stakeModal, setStakeModal] = useState(null);
  const [withdrawModal, setWithdrawModal] = useState(null);
  const [notifs, setNotifs] = useState(loadNotifs);
  const [toast, setToast] = useState(null);

  const options = STAKING_OPTIONS[activeCoin] || [];
  const cfg     = COIN_CONFIG[activeCoin];
  const myPos   = positions.filter(p => p.coin === activeCoin);
  const totalStaked  = myPos.reduce((s, p) => s + p.amount + (p.restakedRewards || 0), 0);
  const totalRewards = myPos.reduce((s, p) => s + computeRewards(p), 0);

  const addNotif = useCallback((n) => {
    const entry = { ...n, at: new Date().toISOString(), read: false };
    setNotifs(prev => {
      const updated = [...prev, entry].slice(-50);
      saveNotifs(updated);
      return updated;
    });
    setToast(entry);
  }, []);

  const handleStake = (newPos) => {
    const updated = [...positions, { ...newPos, id: Date.now().toString(), restakedRewards: 0 }];
    setPositions(updated);
    savePositions(updated);
    addNotif({ type: 'stake', title: `Staking ${newPos.coin} berhasil`, body: `${newPos.amount} ${newPos.coin} distake ke ${newPos.providerName} (${newPos.apy}% APY)` });
  };

  const handleClaim = (posId, rewards) => {
    const pos = positions.find(p => p.id === posId);
    addNotif({ type: 'reward', title: `Reward ${pos?.coin} diklaim`, body: `+${rewards} ${pos?.coin} berhasil diklaim dari ${pos?.providerName}` });
    const h = [...loadHistory(), { posId, rewards, coin: activeCoin, type: 'claim', at: new Date().toISOString() }];
    saveHistory(h.slice(-200));
  };

  const handleRestake = (posId, rewards) => {
    const updated = positions.map(p => p.id === posId
      ? { ...p, restakedRewards: parseFloat(((p.restakedRewards || 0) + parseFloat(rewards)).toFixed(6)) }
      : p);
    setPositions(updated);
    savePositions(updated);
    const pos = positions.find(p => p.id === posId);
    addNotif({ type: 'reward', title: `Reward di-restake`, body: `${rewards} ${pos?.coin} ditambahkan ke posisi ${pos?.providerName}` });
    const h = [...loadHistory(), { posId, rewards, coin: activeCoin, type: 'restake', at: new Date().toISOString() }];
    saveHistory(h.slice(-200));
  };

  const handleWithdraw = (posId, total, rewards) => {
    const pos = positions.find(p => p.id === posId);
    const updated = positions.filter(p => p.id !== posId);
    setPositions(updated);
    savePositions(updated);
    addNotif({ type: 'withdraw', title: `Withdraw ${pos?.coin} berhasil`, body: `${total.toFixed(6)} ${pos?.coin} berhasil ditarik dari ${pos?.providerName} (reward: +${rewards.toFixed(6)})` });
  };

  const TABS = [
    { id: 'stake',   label: 'Stake',      icon: Lock },
    { id: 'compare', label: 'Bandingkan', icon: GitCompare },
    { id: 'history', label: 'Grafik',     icon: BarChart2 },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <h2 className="text-white font-semibold text-sm">Staking</h2>
          <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">PoS</span>
        </div>
        <NotifBell notifs={notifs} onClear={() => { setNotifs([]); saveNotifs([]); }} />
      </div>

      {/* Portfolio summary if positions exist */}
      {positions.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-1"><Wallet className="w-3 h-3" /> Total Distake ({activeCoin})</div>
            <div className="text-white font-bold text-sm">{totalStaked.toFixed(4)} <span className="text-slate-500 text-xs">{cfg.symbol}</span></div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-1"><Award className="w-3 h-3 text-green-400" /> Reward ({activeCoin})</div>
            <div className="text-green-400 font-bold text-sm">+{totalRewards.toFixed(6)} <span className="text-slate-500 text-xs">{cfg.symbol}</span></div>
          </div>
        </div>
      )}

      {/* Coin Tabs */}
      <div className="flex gap-1.5">
        {Object.entries(COIN_CONFIG).map(([id, c]) => (
          <button key={id} onClick={() => setActiveCoin(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${activeCoin === id ? 'text-white border-transparent' : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-300'}`}
            style={activeCoin === id ? { background: c.color + 'cc', borderColor: c.color } : {}}
          >
            <span>{c.icon}</span>{c.symbol}
          </button>
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

      {/* My Positions */}
      {activeTab === 'stake' && myPos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Posisi Aktif ({myPos.length})</span>
            <span className="text-white text-xs font-bold">{totalStaked.toFixed(4)} {cfg.symbol}</span>
          </div>
          {myPos.map(pos => (
            <PositionCard key={pos.id} pos={pos} onClaim={handleClaim} onRestake={handleRestake} onWithdraw={setWithdrawModal} />
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

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
        <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-slate-500 text-xs">Staking non-custodial via protokol pilihan. Reward & grafik bersifat simulasi.</p>
      </div>

      {/* Modals */}
      {stakeModal && (
        <StakeModal coin={stakeModal.coin} provider={stakeModal.provider} onClose={() => setStakeModal(null)} onStake={handleStake} />
      )}
      {withdrawModal && (
        <WithdrawModal pos={withdrawModal} onClose={() => setWithdrawModal(null)} onWithdraw={handleWithdraw} />
      )}

      {/* Notification Toast */}
      {toast && <NotifToast notif={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import {
  PiggyBank, TrendingUp, ArrowLeftRight, Shield, Zap,
  Plus, Minus, CheckCircle2, Info, ChevronDown, Clock,
  Coins, Wallet, RefreshCw, AlertTriangle, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DEXMarket from '../components/wallet/DEXMarket';

// ── USDT Savings Protocols ────────────────────────────────────────────────────
const SAVINGS_PROTOCOLS = [
  {
    id: 'aave',
    name: 'Aave',
    logo: '👻',
    color: '#B6509E',
    apy: 5.82,
    apyType: 'variable',
    network: 'Ethereum',
    netColor: '#627EEA',
    tvl: '$12.4B',
    risk: 'low',
    desc: 'Protocol lending terdesentralisasi terbesar. USDT otomatis menghasilkan bunga.',
    minDeposit: 10,
  },
  {
    id: 'compound',
    name: 'Compound',
    logo: '🌿',
    color: '#00D395',
    apy: 4.91,
    apyType: 'variable',
    network: 'Ethereum',
    netColor: '#627EEA',
    tvl: '$3.1B',
    risk: 'low',
    desc: 'Protocol DeFi OG. Bunga dihitung per block Ethereum.',
    minDeposit: 1,
  },
  {
    id: 'curve',
    name: 'Curve 3Pool',
    logo: '📈',
    color: '#40649F',
    apy: 7.24,
    apyType: 'stable',
    network: 'Multi-chain',
    netColor: '#8247E5',
    tvl: '$4.7B',
    risk: 'low',
    desc: '3Pool stablecoin (USDT/USDC/DAI). APY dari trading fee + CRV rewards.',
    minDeposit: 100,
  },
  {
    id: 'yearn',
    name: 'Yearn Finance',
    logo: '💙',
    color: '#0057FF',
    apy: 8.15,
    apyType: 'optimized',
    network: 'Ethereum',
    netColor: '#627EEA',
    tvl: '$680M',
    risk: 'medium',
    desc: 'Vault otomatis mengoptimalkan yield USDT di berbagai protocol.',
    minDeposit: 50,
  },
  {
    id: 'beefy',
    name: 'Beefy Finance',
    logo: '🐮',
    color: '#F5A623',
    apy: 9.38,
    apyType: 'auto-compound',
    network: 'BNB Chain',
    netColor: '#F0B90B',
    tvl: '$290M',
    risk: 'medium',
    desc: 'Auto-compounder cross-chain. Reinvest reward otomatis tiap jam.',
    minDeposit: 10,
  },
];

const RISK_COLOR = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-red-400' };
const RISK_BG = { low: 'bg-green-500/10 border-green-500/20', medium: 'bg-yellow-500/10 border-yellow-500/20', high: 'bg-red-500/10 border-red-500/20' };
const APY_TYPE_LABEL = { variable: 'Variable APY', stable: 'Stable APY', optimized: 'Optimized', 'auto-compound': 'Auto-Compound' };
const SAVINGS_KEY = 'usdt_savings_positions';

function loadPositions() { try { return JSON.parse(localStorage.getItem(SAVINGS_KEY)) || []; } catch { return []; } }
function savePositions(p) { localStorage.setItem(SAVINGS_KEY, JSON.stringify(p)); }

// ── DepositModal ──────────────────────────────────────────────────────────────
function DepositModal({ protocol, onConfirm, onClose }) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) < protocol.minDeposit) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setStep('success');
  };

  const estYearlyEarnings = amount ? (parseFloat(amount) * protocol.apy / 100).toFixed(2) : '0';
  const estMonthlyEarnings = amount ? (parseFloat(amount) * protocol.apy / 100 / 12).toFixed(2) : '0';

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        {step === 'form' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{protocol.logo}</span>
                <div>
                  <div className="text-white font-bold">{protocol.name}</div>
                  <div className="text-green-400 text-sm font-semibold">{protocol.apy}% APY</div>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
              <label className="text-slate-400 text-xs">Jumlah USDT</label>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">$</span>
                <Input type="number" placeholder={`Min. $${protocol.minDeposit}`} value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="bg-transparent border-0 text-white text-2xl font-bold p-0 h-auto focus-visible:ring-0 flex-1" />
                <span className="text-slate-400 font-semibold">USDT</span>
              </div>
              <div className="flex gap-2">
                {['100', '500', '1000', '5000'].map(v => (
                  <button key={v} onClick={() => setAmount(v)}
                    className="flex-1 text-xs py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors">${v}</button>
                ))}
              </div>
            </div>

            {amount && parseFloat(amount) >= protocol.minDeposit && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 space-y-2">
                <div className="text-green-400 text-xs font-semibold">Estimasi Pendapatan</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 rounded-lg p-2">
                    <div className="text-slate-500">Per Bulan</div>
                    <div className="text-white font-bold">${estMonthlyEarnings} USDT</div>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-2">
                    <div className="text-slate-500">Per Tahun</div>
                    <div className="text-green-400 font-bold">${estYearlyEarnings} USDT</div>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleConfirm} disabled={loading || !amount || parseFloat(amount) < protocol.minDeposit}
              className="w-full h-12 font-bold text-white text-base"
              style={{ background: `linear-gradient(135deg, ${protocol.color}, ${protocol.color}88)` }}>
              {loading
                ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Memproses...</span>
                : <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Simpan di {protocol.name}</span>
              }
            </Button>
          </>
        )}

        {step === 'success' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Berhasil Disimpan!</h3>
              <p className="text-slate-400 text-sm mt-1">${amount} USDT didepositkan ke {protocol.name}</p>
            </div>
            <div className="flex justify-center gap-4 text-sm bg-slate-800 rounded-xl p-3">
              <div className="text-center">
                <div className="text-slate-500 text-xs">APY</div>
                <div className="text-green-400 font-bold">{protocol.apy}%</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 text-xs">Est. Bulanan</div>
                <div className="text-white font-bold">${estMonthlyEarnings}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 text-xs">Est. Tahunan</div>
                <div className="text-green-400 font-bold">${estYearlyEarnings}</div>
              </div>
            </div>
            <Button onClick={() => { onConfirm({ protocol, amount: parseFloat(amount), date: new Date().toISOString() }); onClose(); }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
              Lihat Posisi Saya
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PositionCard ──────────────────────────────────────────────────────────────
function PositionCard({ pos, onWithdraw }) {
  const protocol = SAVINGS_PROTOCOLS.find(p => p.id === pos.protocol.id) || pos.protocol;
  const days = Math.max(1, Math.floor((Date.now() - new Date(pos.date).getTime()) / 86400000));
  const earned = (pos.amount * protocol.apy / 100 / 365 * days).toFixed(4);
  const total = (pos.amount + parseFloat(earned)).toFixed(2);

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{protocol.logo}</span>
          <div>
            <div className="text-white font-semibold text-sm">{protocol.name}</div>
            <div className="text-slate-500 text-xs">{protocol.network}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold">${total}</div>
          <div className="text-green-400 text-xs">+${earned} reward</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-900/60 rounded-xl p-2 text-center">
          <div className="text-slate-500">Disimpan</div>
          <div className="text-white font-bold">${pos.amount.toFixed(0)}</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-2 text-center">
          <div className="text-slate-500">APY</div>
          <div className="text-green-400 font-bold">{protocol.apy}%</div>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-2 text-center">
          <div className="text-slate-500">Hari</div>
          <div className="text-blue-400 font-bold">{days}h</div>
        </div>
      </div>

      <Button onClick={() => onWithdraw(pos)} variant="outline"
        className="w-full h-9 text-xs border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/40">
        <Minus className="w-3.5 h-3.5 mr-1.5" /> Tarik Dana
      </Button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DEXSavings() {
  const [tab, setTab] = useState('savings'); // savings | dex
  const [positions, setPositions] = useState(loadPositions);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [apyTick, setApyTick] = useState({});

  // Simulate APY fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setApyTick(prev => {
        const t = {};
        SAVINGS_PROTOCOLS.forEach(p => {
          const delta = (Math.random() - 0.5) * 0.06;
          t[p.id] = (prev[p.id] || p.apy) + delta;
        });
        return t;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleDeposit = (data) => {
    const updated = [...positions, { ...data, id: Date.now() }];
    setPositions(updated);
    savePositions(updated);
  };

  const handleWithdraw = (pos) => {
    const updated = positions.filter(p => p.id !== pos.id);
    setPositions(updated);
    savePositions(updated);
  };

  const totalSaved = positions.reduce((s, p) => s + p.amount, 0);
  const totalEarned = positions.reduce((s, p) => {
    const proto = SAVINGS_PROTOCOLS.find(x => x.id === p.protocol.id) || p.protocol;
    const days = Math.max(1, Math.floor((Date.now() - new Date(p.date).getTime()) / 86400000));
    return s + (p.amount * proto.apy / 100 / 365 * days);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md mx-auto p-4 pb-24 space-y-4">

        {/* Header */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">DEX & Savings</h1>
              <div className="text-slate-500 text-[10px]">USDT Yield · Swap Langsung</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs">Live</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/60 border border-slate-700/40 rounded-2xl p-1">
          <button onClick={() => setTab('savings')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'savings' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
            <PiggyBank className="w-4 h-4" /> USDT Savings
          </button>
          <button onClick={() => setTab('dex')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'dex' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
            <ArrowLeftRight className="w-4 h-4" /> DEX Market
          </button>
        </div>

        {tab === 'savings' && (
          <>
            {/* Portfolio Summary */}
            {positions.length > 0 && (
              <div className="bg-gradient-to-br from-green-900/40 to-teal-900/30 border border-green-500/20 rounded-2xl p-4">
                <div className="text-slate-400 text-xs mb-3 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Portofolio Savings Saya
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-500 text-xs">Total Disimpan</div>
                    <div className="text-white font-bold text-xl">${totalSaved.toLocaleString('en-US', { maximumFractionDigits: 2 })} <span className="text-slate-400 text-sm font-normal">USDT</span></div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs">Total Reward</div>
                    <div className="text-green-400 font-bold text-xl">+${totalEarned.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Positions */}
            {positions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-white font-semibold text-sm">Posisi Aktif ({positions.length})</span>
                </div>
                {positions.map(pos => (
                  <PositionCard key={pos.id} pos={pos} onWithdraw={handleWithdraw} />
                ))}
              </div>
            )}

            {/* Available Protocols */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-white font-semibold text-sm">Pilih Protocol Savings</span>
              </div>

              {SAVINGS_PROTOCOLS.map(proto => {
                const liveApy = apyTick[proto.id] || proto.apy;
                return (
                  <div key={proto.id}
                    className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-3 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: proto.color + '22', border: `1px solid ${proto.color}44` }}>
                          {proto.logo}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{proto.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${RISK_BG[proto.risk]}`}
                              style={{ color: proto.risk === 'low' ? '#4ade80' : '#facc15' }}>
                              {proto.risk === 'low' ? 'Aman' : 'Sedang'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-xs">{proto.network} · {APY_TYPE_LABEL[proto.apyType]}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-lg">{liveApy.toFixed(2)}%</div>
                        <div className="text-slate-500 text-[10px]">APY · TVL {proto.tvl}</div>
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed">{proto.desc}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-xs">Min. deposit: ${proto.minDeposit} USDT</span>
                      <Button onClick={() => setSelectedProtocol(proto)}
                        className="h-9 px-4 text-xs font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${proto.color}cc, ${proto.color}88)` }}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Simpan USDT
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
              <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-slate-500 text-xs">Semua protocol adalah DeFi non-custodial. APY bersifat variabel. Demo simulasi — integrasi wallet diperlukan untuk eksekusi nyata.</p>
            </div>
          </>
        )}

        {tab === 'dex' && (
          <DEXMarket addresses={{}} />
        )}
      </div>

      {selectedProtocol && (
        <DepositModal
          protocol={selectedProtocol}
          onConfirm={handleDeposit}
          onClose={() => setSelectedProtocol(null)}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PiggyBank, TrendingUp, ArrowLeftRight, Shield, Zap,
  Plus, Minus, CheckCircle2, Info, ChevronDown, Clock,
  Coins, Wallet, RefreshCw, AlertTriangle, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DEXMarket from '../components/wallet/DEXMarket';
import WalletConnectPanel from '../components/wallet/WalletConnectPanel';
import DEXScreener from '../components/market/DEXScreener';
import { addTransaction } from './TxHistory';

// DeFi Llama pool IDs for real APY data
const DEFI_LLAMA_IDS = {
  aave: 'a349fea4-d780-4e16-973e-70ca9b606db2',       // Aave v3 USDT Ethereum
  compound: 'cefa9bb8-c230-459a-a855-3e19d6f13a0e',   // Compound v3 USDT Ethereum
  curve: '7294cb4a-e37b-4b9c-9e4a-77ad76b5b4b1',      // Curve 3pool Ethereum
  yearn: 'b4c5f5e0-d3f3-47ef-8f06-4d5e0e6bdfaa',      // Yearn USDT vault
  beefy: '5f6f5d4c-e7a2-4d3b-b8a1-2e9c0f1d3e5f',     // Beefy USDT BNB
  marinade: '4f8e3d2c-1b9a-4e5f-8c7d-6a3b2e1f4d8c',  // Marinade SOL staking
  kamino: '3e7d2c1b-9a8f-4e5d-7c6b-5a4d3e2f1c0b',    // Kamino USDT Solana
  save: '2d6c1b0a-8f7e-4d5c-6b5a-4c3e2d1f0b9a',      // Save/Solend USDT
};

// Fallback base APYs
const BASE_APY = { aave: 5.82, compound: 4.91, curve: 7.24, yearn: 8.15, beefy: 9.38, marinade: 7.92, kamino: 11.4, save: 6.15 };

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
  {
    id: 'marinade',
    name: 'Marinade Finance',
    logo: '🥩',
    color: '#9945FF',
    apy: 7.92,
    apyType: 'liquid-staking',
    network: 'Solana',
    netColor: '#9945FF',
    tvl: '$1.2B',
    risk: 'low',
    desc: 'Liquid staking SOL terbesar. Simpan USDC/USDT via Solana dengan kecepatan tinggi & biaya rendah.',
    minDeposit: 5,
  },
  {
    id: 'kamino',
    name: 'Kamino Finance',
    logo: '🌊',
    color: '#00C2FF',
    apy: 11.4,
    apyType: 'concentrated-lp',
    network: 'Solana',
    netColor: '#9945FF',
    tvl: '$420M',
    risk: 'medium',
    desc: 'Automated concentrated liquidity di Solana. APY tinggi dari USDT/USDC pool dengan auto-rebalance.',
    minDeposit: 20,
  },
  {
    id: 'save',
    name: 'Save (Solend)',
    logo: '☀️',
    color: '#F5A623',
    apy: 6.15,
    apyType: 'variable',
    network: 'Solana',
    netColor: '#9945FF',
    tvl: '$380M',
    risk: 'low',
    desc: 'Protocol lending USDT/USDC di Solana. Transaksi ~$0.001, konfirmasi <1 detik.',
    minDeposit: 1,
  },
];

const RISK_COLOR = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-red-400' };
const RISK_BG = { low: 'bg-green-500/10 border-green-500/20', medium: 'bg-yellow-500/10 border-yellow-500/20', high: 'bg-red-500/10 border-red-500/20' };
const APY_TYPE_LABEL = { variable: 'Variable APY', stable: 'Stable APY', optimized: 'Optimized', 'auto-compound': 'Auto-Compound', 'liquid-staking': 'Liquid Staking', 'concentrated-lp': 'Concentrated LP' };
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
  const [tab, setTab] = useState('savings'); // savings | dex | screener
  const [positions, setPositions] = useState(loadPositions);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [liveApys, setLiveApys] = useState({});
  const [apyLoading, setApyLoading] = useState(false);
  const [apyLastUpdated, setApyLastUpdated] = useState(null);
  const [cryptoPrices, setCryptoPrices] = useState({});
  const apyIntervalRef = useRef(null);
  const priceIntervalRef = useRef(null);

  // Fetch real APYs from DeFiLlama
  const fetchRealApys = useCallback(async () => {
    setApyLoading(true);
    try {
      const res = await fetch('https://yields.llama.fi/pools');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const pools = data.data || [];
      const apyMap = {};
      // Try to match by protocol name + stablecoin
      const protocolMap = {
        aave: ['aave-v3', 'aave'],
        compound: ['compound-v3', 'compound'],
        curve: ['curve'],
        yearn: ['yearn-finance', 'yearn'],
        beefy: ['beefy'],
        marinade: ['marinade'],
        kamino: ['kamino'],
        save: ['save', 'solend'],
      };
      const stableSymbols = ['USDT', 'USDC', 'DAI'];
      SAVINGS_PROTOCOLS.forEach(proto => {
        const aliases = protocolMap[proto.id] || [proto.id];
        const match = pools.find(pool =>
          aliases.some(alias => pool.project?.toLowerCase().includes(alias)) &&
          stableSymbols.some(sym => pool.symbol?.toUpperCase().includes(sym)) &&
          pool.apy != null && pool.apy > 0
        );
        if (match) apyMap[proto.id] = parseFloat(match.apy.toFixed(2));
      });
      if (Object.keys(apyMap).length > 0) {
        setLiveApys(apyMap);
        setApyLastUpdated(new Date());
      }
    } catch {
      // fallback — keep previous values
    } finally {
      setApyLoading(false);
    }
  }, []);

  // Fetch crypto prices for portfolio value context
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin,ethereum,solana&vs_currencies=usd&include_24hr_change=true');
      if (!res.ok) return;
      const data = await res.json();
      setCryptoPrices(data);
    } catch { /* silent */ }
  }, []);

  // Start polling on mount
  useEffect(() => {
    fetchRealApys();
    fetchPrices();
    apyIntervalRef.current = setInterval(fetchRealApys, 30000); // every 30s
    priceIntervalRef.current = setInterval(fetchPrices, 20000); // every 20s
    return () => {
      clearInterval(apyIntervalRef.current);
      clearInterval(priceIntervalRef.current);
    };
  }, [fetchRealApys, fetchPrices]);

  // Merge live APY with fallback
  const getApy = (proto) => liveApys[proto.id] ?? proto.apy;

  const handleDeposit = (data) => {
    const updated = [...positions, { ...data, id: Date.now() }];
    setPositions(updated);
    savePositions(updated);
    addTransaction({ type: 'deposit', protocol: data.protocol.name, amount: data.amount, token: 'USDT', network: data.protocol.network, apy: data.protocol.apy });
  };

  const handleWithdraw = (pos) => {
    const proto = SAVINGS_PROTOCOLS.find(p => p.id === pos.protocol.id) || pos.protocol;
    const days = Math.max(1, Math.floor((Date.now() - new Date(pos.date).getTime()) / 86400000));
    const earned = (pos.amount * proto.apy / 100 / 365 * days).toFixed(4);
    const updated = positions.filter(p => p.id !== pos.id);
    setPositions(updated);
    savePositions(updated);
    addTransaction({ type: 'withdraw', protocol: proto.name, amount: pos.amount, token: 'USDT', network: proto.network, earned: parseFloat(earned) });
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">DEX & Savings</h1>
              <div className="text-slate-500 text-[10px]">USDT Yield · Swap Langsung</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {apyLastUpdated && (
              <span className="text-slate-500 text-[10px]">
                {apyLastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-2.5 py-1">
              <div className={`w-1.5 h-1.5 rounded-full ${apyLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
              <span className="text-green-400 text-xs">{apyLoading ? 'Updating...' : 'Live'}</span>
            </div>
          </div>
        </div>

        {/* WalletConnect */}
        <WalletConnectPanel />

        {/* Info Banner */}
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <span className="text-blue-400 text-sm shrink-0">💡</span>
          <p className="text-blue-300 text-xs leading-relaxed">
            <strong>Savings</strong> = Simpan USDT untuk dapat bunga otomatis. <strong>DEX</strong> = Swap koin langsung tanpa CEX. Semua non-custodial.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/60 border border-slate-700/40 rounded-2xl p-1 gap-0.5">
          <button onClick={() => setTab('savings')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === 'savings' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
            <PiggyBank className="w-3.5 h-3.5" /> Savings
          </button>
          <button onClick={() => setTab('screener')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === 'screener' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
            <Zap className="w-3.5 h-3.5" /> Screener
          </button>
          <button onClick={() => setTab('dex')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === 'dex' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
            <ArrowLeftRight className="w-3.5 h-3.5" /> DEX
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
                const liveApy = getApy(proto);
                const hasLiveData = liveApys[proto.id] != null;
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
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="text-green-400 font-bold text-lg">{liveApy.toFixed(2)}%</div>
                          {hasLiveData && <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" title="Live data" />}
                        </div>
                        <div className="text-slate-500 text-[10px]">{hasLiveData ? '🟢 Live APY' : 'APY (est.)'} · TVL {proto.tvl}</div>
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

        {tab === 'screener' && (
          <DEXScreener />
        )}

        {tab === 'dex' && (
          <>
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <span className="text-purple-400 text-sm shrink-0">🔄</span>
              <p className="text-purple-300 text-xs leading-relaxed">
                Pilih chain, masukkan jumlah, dan swap koin langsung via 1inch agregator. Tidak perlu login atau KYC.
              </p>
            </div>
            <DEXMarket addresses={{}} />
          </>
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
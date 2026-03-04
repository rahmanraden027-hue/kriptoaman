import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PiggyBank, TrendingUp, ArrowLeftRight, Shield, Zap,
  Plus, Minus, CheckCircle2, ChevronDown,
  Coins, Wallet, RefreshCw, AlertTriangle, Star, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DEXMarket from '../components/wallet/DEXMarket';
import WalletConnectPanel from '../components/wallet/WalletConnectPanel';
import DEXScreener from '../components/market/DEXScreener';
import { addTransaction } from './TxHistory';

// ── Supported Networks ────────────────────────────────────────────────────────
const NETWORKS = [
  { id: 'all',       label: '🌐 Semua',      color: '#94a3b8', cgId: null },
  { id: 'ethereum',  label: '⟠ Ethereum',    color: '#627EEA', cgId: 'ethereum' },
  { id: 'bnb',       label: '⬡ BNB Chain',   color: '#F0B90B', cgId: 'binancecoin' },
  { id: 'solana',    label: '◎ Solana',       color: '#9945FF', cgId: 'solana' },
  { id: 'polygon',   label: '🟣 Polygon',     color: '#8247E5', cgId: 'matic-network' },
  { id: 'arbitrum',  label: '🔷 Arbitrum',    color: '#28A0F0', cgId: 'arbitrum' },
  { id: 'avalanche', label: '🔺 Avalanche',   color: '#E84142', cgId: 'avalanche-2' },
  { id: 'optimism',  label: '🔴 Optimism',    color: '#FF0420', cgId: 'optimism' },
  { id: 'base',      label: '🔵 Base',        color: '#0052FF', cgId: null },
];

// ── Savings Protocols per Chain ───────────────────────────────────────────────
const SAVINGS_PROTOCOLS = [
  // ── Ethereum
  {
    id: 'aave-eth',
    name: 'Aave v3',
    logo: '👻',
    color: '#B6509E',
    apy: 5.82,
    apyType: 'variable',
    network: 'ethereum',
    networkLabel: 'Ethereum',
    netColor: '#627EEA',
    tvl: '$12.4B',
    risk: 'low',
    desc: 'Protocol lending terdesentralisasi terbesar. USDT otomatis menghasilkan bunga tiap block.',
    minDeposit: 10,
    projectAlias: ['aave-v3', 'aave'],
  },
  {
    id: 'compound-eth',
    name: 'Compound v3',
    logo: '🌿',
    color: '#00D395',
    apy: 4.91,
    apyType: 'variable',
    network: 'ethereum',
    networkLabel: 'Ethereum',
    netColor: '#627EEA',
    tvl: '$3.1B',
    risk: 'low',
    desc: 'Protocol DeFi OG. Bunga dihitung per block Ethereum. USDT & USDC.',
    minDeposit: 1,
    projectAlias: ['compound-v3', 'compound'],
  },
  {
    id: 'curve-eth',
    name: 'Curve 3Pool',
    logo: '📈',
    color: '#40649F',
    apy: 7.24,
    apyType: 'stable',
    network: 'ethereum',
    networkLabel: 'Ethereum',
    netColor: '#627EEA',
    tvl: '$4.7B',
    risk: 'low',
    desc: '3Pool stablecoin (USDT/USDC/DAI). APY dari trading fee + CRV rewards.',
    minDeposit: 100,
    projectAlias: ['curve'],
  },
  {
    id: 'yearn-eth',
    name: 'Yearn Finance',
    logo: '💙',
    color: '#0057FF',
    apy: 8.15,
    apyType: 'optimized',
    network: 'ethereum',
    networkLabel: 'Ethereum',
    netColor: '#627EEA',
    tvl: '$680M',
    risk: 'medium',
    desc: 'Vault otomatis mengoptimalkan yield USDT di berbagai protocol Ethereum.',
    minDeposit: 50,
    projectAlias: ['yearn-finance', 'yearn'],
  },
  // ── BNB Chain
  {
    id: 'beefy-bnb',
    name: 'Beefy Finance',
    logo: '🐮',
    color: '#F5A623',
    apy: 9.38,
    apyType: 'auto-compound',
    network: 'bnb',
    networkLabel: 'BNB Chain',
    netColor: '#F0B90B',
    tvl: '$290M',
    risk: 'medium',
    desc: 'Auto-compounder cross-chain di BNB. Reinvest reward otomatis tiap jam.',
    minDeposit: 10,
    projectAlias: ['beefy'],
  },
  {
    id: 'venus-bnb',
    name: 'Venus Protocol',
    logo: '♀️',
    color: '#D4AF37',
    apy: 6.5,
    apyType: 'variable',
    network: 'bnb',
    networkLabel: 'BNB Chain',
    netColor: '#F0B90B',
    tvl: '$1.8B',
    risk: 'low',
    desc: 'Protocol lending terbesar di BNB Chain. Supply USDT, USDC, atau BUSD.',
    minDeposit: 5,
    projectAlias: ['venus'],
  },
  {
    id: 'pancake-bnb',
    name: 'PancakeSwap',
    logo: '🥞',
    color: '#1FC7D4',
    apy: 10.2,
    apyType: 'lp',
    network: 'bnb',
    networkLabel: 'BNB Chain',
    netColor: '#F0B90B',
    tvl: '$1.5B',
    risk: 'medium',
    desc: 'DEX terbesar BNB Chain. Stable LP USDT-USDC dengan APY dari trading fee + CAKE.',
    minDeposit: 20,
    projectAlias: ['pancakeswap'],
  },
  // ── Solana
  {
    id: 'marinade-sol',
    name: 'Marinade Finance',
    logo: '🥩',
    color: '#9945FF',
    apy: 7.92,
    apyType: 'liquid-staking',
    network: 'solana',
    networkLabel: 'Solana',
    netColor: '#9945FF',
    tvl: '$1.2B',
    risk: 'low',
    desc: 'Liquid staking SOL terbesar. Simpan USDC/USDT via Solana dengan kecepatan tinggi & biaya rendah.',
    minDeposit: 5,
    projectAlias: ['marinade'],
  },
  {
    id: 'kamino-sol',
    name: 'Kamino Finance',
    logo: '🌊',
    color: '#00C2FF',
    apy: 11.4,
    apyType: 'concentrated-lp',
    network: 'solana',
    networkLabel: 'Solana',
    netColor: '#9945FF',
    tvl: '$420M',
    risk: 'medium',
    desc: 'Automated concentrated liquidity di Solana. APY tinggi dari USDT/USDC pool.',
    minDeposit: 20,
    projectAlias: ['kamino'],
  },
  {
    id: 'save-sol',
    name: 'Save (Solend)',
    logo: '☀️',
    color: '#F5A623',
    apy: 6.15,
    apyType: 'variable',
    network: 'solana',
    networkLabel: 'Solana',
    netColor: '#9945FF',
    tvl: '$380M',
    risk: 'low',
    desc: 'Protocol lending USDT/USDC di Solana. Transaksi ~$0.001, konfirmasi <1 detik.',
    minDeposit: 1,
    projectAlias: ['save', 'solend'],
  },
  // ── Polygon
  {
    id: 'aave-polygon',
    name: 'Aave v3 (Polygon)',
    logo: '👻',
    color: '#B6509E',
    apy: 6.1,
    apyType: 'variable',
    network: 'polygon',
    networkLabel: 'Polygon',
    netColor: '#8247E5',
    tvl: '$2.3B',
    risk: 'low',
    desc: 'Aave di Polygon — biaya gas sangat murah, APY kompetitif untuk USDT & USDC.',
    minDeposit: 5,
    projectAlias: ['aave-v3', 'aave'],
  },
  {
    id: 'quickswap-polygon',
    name: 'QuickSwap',
    logo: '⚡',
    color: '#6B3FA0',
    apy: 8.8,
    apyType: 'lp',
    network: 'polygon',
    networkLabel: 'Polygon',
    netColor: '#8247E5',
    tvl: '$320M',
    risk: 'medium',
    desc: 'DEX utama Polygon. Stable LP USDT-USDC dengan reward QUICK + trading fee.',
    minDeposit: 10,
    projectAlias: ['quickswap'],
  },
  // ── Arbitrum
  {
    id: 'aave-arb',
    name: 'Aave v3 (Arbitrum)',
    logo: '👻',
    color: '#B6509E',
    apy: 5.95,
    apyType: 'variable',
    network: 'arbitrum',
    networkLabel: 'Arbitrum',
    netColor: '#28A0F0',
    tvl: '$1.9B',
    risk: 'low',
    desc: 'Aave di Arbitrum L2 — gas murah, settlement cepat, APY USDT kompetitif.',
    minDeposit: 5,
    projectAlias: ['aave-v3', 'aave'],
  },
  {
    id: 'gmx-arb',
    name: 'GMX GLP',
    logo: '🔷',
    color: '#28A0F0',
    apy: 12.5,
    apyType: 'lp',
    network: 'arbitrum',
    networkLabel: 'Arbitrum',
    netColor: '#28A0F0',
    tvl: '$560M',
    risk: 'medium',
    desc: 'GLP pool di Arbitrum. Earn ETH/USDC dari trading fee. APY volatil namun historis tinggi.',
    minDeposit: 50,
    projectAlias: ['gmx'],
  },
  // ── Avalanche
  {
    id: 'aave-avax',
    name: 'Aave v3 (Avalanche)',
    logo: '👻',
    color: '#B6509E',
    apy: 6.4,
    apyType: 'variable',
    network: 'avalanche',
    networkLabel: 'Avalanche',
    netColor: '#E84142',
    tvl: '$890M',
    risk: 'low',
    desc: 'Aave di Avalanche C-Chain. Finality <2 detik, USDT & USDC dengan APY baik.',
    minDeposit: 5,
    projectAlias: ['aave-v3', 'aave'],
  },
  {
    id: 'traderjoe-avax',
    name: 'Trader Joe',
    logo: '☕',
    color: '#E84142',
    apy: 9.7,
    apyType: 'lp',
    network: 'avalanche',
    networkLabel: 'Avalanche',
    netColor: '#E84142',
    tvl: '$180M',
    risk: 'medium',
    desc: 'DEX terbesar Avalanche. USDT-USDC stable LP + JOE reward.',
    minDeposit: 10,
    projectAlias: ['trader-joe'],
  },
  // ── Optimism
  {
    id: 'aave-op',
    name: 'Aave v3 (Optimism)',
    logo: '👻',
    color: '#B6509E',
    apy: 5.7,
    apyType: 'variable',
    network: 'optimism',
    networkLabel: 'Optimism',
    netColor: '#FF0420',
    tvl: '$750M',
    risk: 'low',
    desc: 'Aave di Optimism L2. Gas sangat murah, USDT/USDC/DAI.',
    minDeposit: 5,
    projectAlias: ['aave-v3', 'aave'],
  },
  // ── Base
  {
    id: 'aerodrome-base',
    name: 'Aerodrome',
    logo: '🛫',
    color: '#0052FF',
    apy: 13.2,
    apyType: 'lp',
    network: 'base',
    networkLabel: 'Base',
    netColor: '#0052FF',
    tvl: '$680M',
    risk: 'medium',
    desc: 'AMM terbesar di Base L2. USDC stable pool dengan APY AERO sangat kompetitif.',
    minDeposit: 10,
    projectAlias: ['aerodrome'],
  },
  {
    id: 'moonwell-base',
    name: 'Moonwell',
    logo: '🌕',
    color: '#7C3AED',
    apy: 7.1,
    apyType: 'variable',
    network: 'base',
    networkLabel: 'Base',
    netColor: '#0052FF',
    tvl: '$430M',
    risk: 'low',
    desc: 'Protocol lending di Base. USDC supply earning dengan reward WELL + base APY.',
    minDeposit: 5,
    projectAlias: ['moonwell'],
  },
];

// CoinGecko IDs for native gas tokens per chain (for price display)
const CHAIN_PRICE_IDS = {
  ethereum: 'ethereum',
  bnb: 'binancecoin',
  solana: 'solana',
  polygon: 'matic-network',
  arbitrum: 'arbitrum',
  avalanche: 'avalanche-2',
  optimism: 'optimism',
  base: 'ethereum', // Base uses ETH
};

const RISK_BG = { low: 'bg-green-500/10 border-green-500/20', medium: 'bg-yellow-500/10 border-yellow-500/20', high: 'bg-red-500/10 border-red-500/20' };
const APY_TYPE_LABEL = { variable: 'Variable APY', stable: 'Stable APY', optimized: 'Optimized', 'auto-compound': 'Auto-Compound', 'liquid-staking': 'Liquid Staking', 'concentrated-lp': 'Conc. LP', lp: 'LP Pool' };
const SAVINGS_KEY = 'usdt_savings_positions_v2';

function loadPositions() { try { return JSON.parse(localStorage.getItem(SAVINGS_KEY)) || []; } catch { return []; } }
function savePositions(p) { localStorage.setItem(SAVINGS_KEY, JSON.stringify(p)); }

// ── DepositModal ──────────────────────────────────────────────────────────────
function DepositModal({ protocol, liveApy, onConfirm, onClose }) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const apy = liveApy ?? protocol.apy;

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) < protocol.minDeposit) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setStep('success');
  };

  const estYearlyEarnings = amount ? (parseFloat(amount) * apy / 100).toFixed(2) : '0';
  const estMonthlyEarnings = amount ? (parseFloat(amount) * apy / 100 / 12).toFixed(2) : '0';

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
                  <div className="flex items-center gap-1.5">
                    <div className="text-green-400 text-sm font-semibold">{apy.toFixed(2)}% APY</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full text-slate-300" style={{ background: protocol.netColor + '33' }}>{protocol.networkLabel}</span>
                  </div>
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
                <div className="text-green-400 text-xs font-semibold">Estimasi Pendapatan ({apy.toFixed(2)}% APY)</div>
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
              <p className="text-slate-500 text-xs mt-0.5">via {protocol.networkLabel}</p>
            </div>
            <div className="flex justify-center gap-4 text-sm bg-slate-800 rounded-xl p-3">
              <div className="text-center">
                <div className="text-slate-500 text-xs">APY</div>
                <div className="text-green-400 font-bold">{apy.toFixed(2)}%</div>
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
function PositionCard({ pos, onWithdraw, liveApys }) {
  const protocol = SAVINGS_PROTOCOLS.find(p => p.id === pos.protocol.id) || pos.protocol;
  const apy = liveApys?.[protocol.id] ?? protocol.apy;
  const days = Math.max(1, Math.floor((Date.now() - new Date(pos.date).getTime()) / 86400000));
  const earned = (pos.amount * apy / 100 / 365 * days).toFixed(4);
  const total = (pos.amount + parseFloat(earned)).toFixed(2);

  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{protocol.logo}</span>
          <div>
            <div className="text-white font-semibold text-sm">{protocol.name}</div>
            <div className="flex items-center gap-1.5">
              <div className="text-slate-500 text-xs">{protocol.networkLabel || protocol.network}</div>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <div className="text-xs" style={{ color: protocol.netColor }}>{protocol.networkLabel || protocol.network}</div>
            </div>
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
          <div className="text-green-400 font-bold">{apy.toFixed(2)}%</div>
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

// ── Network Selector ──────────────────────────────────────────────────────────
function NetworkSelector({ selected, onChange, chainPrices }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {NETWORKS.map(net => {
        const price = net.cgId && chainPrices[net.cgId];
        return (
          <button key={net.id} onClick={() => onChange(net.id)}
            className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              selected === net.id
                ? 'text-white border-transparent'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-white'
            }`}
            style={selected === net.id ? { background: (net.color + '30'), borderColor: net.color + '80' } : {}}>
            <span>{net.label}</span>
            {price && <span className="text-[9px] text-slate-400 mt-0.5">${price.usd?.toFixed(0)}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DEXSavings() {
  const [tab, setTab] = useState('savings');
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [positions, setPositions] = useState(loadPositions);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [liveApys, setLiveApys] = useState({});
  const [apyLoading, setApyLoading] = useState(false);
  const [apyLastUpdated, setApyLastUpdated] = useState(null);
  const [chainPrices, setChainPrices] = useState({});
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
      const stableSymbols = ['USDT', 'USDC', 'DAI', 'BUSD'];
      SAVINGS_PROTOCOLS.forEach(proto => {
        const aliases = proto.projectAlias || [proto.id];
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
    } catch { /* keep previous */ }
    finally { setApyLoading(false); }
  }, []);

  // Fetch native gas token prices for chain selector
  const fetchChainPrices = useCallback(async () => {
    try {
      const ids = Object.values(CHAIN_PRICE_IDS).filter(Boolean).join(',');
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      if (!res.ok) return;
      const data = await res.json();
      setChainPrices(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchRealApys();
    fetchChainPrices();
    apyIntervalRef.current = setInterval(fetchRealApys, 30000);
    priceIntervalRef.current = setInterval(fetchChainPrices, 20000);
    return () => {
      clearInterval(apyIntervalRef.current);
      clearInterval(priceIntervalRef.current);
    };
  }, [fetchRealApys, fetchChainPrices]);

  const getApy = (proto) => liveApys[proto.id] ?? proto.apy;

  const filteredProtocols = selectedNetwork === 'all'
    ? SAVINGS_PROTOCOLS
    : SAVINGS_PROTOCOLS.filter(p => p.network === selectedNetwork);

  const handleDeposit = (data) => {
    const updated = [...positions, { ...data, id: Date.now() }];
    setPositions(updated);
    savePositions(updated);
    addTransaction({ type: 'deposit', protocol: data.protocol.name, amount: data.amount, token: 'USDT', network: data.protocol.networkLabel, apy: data.protocol.apy });
  };

  const handleWithdraw = (pos) => {
    const proto = SAVINGS_PROTOCOLS.find(p => p.id === pos.protocol.id) || pos.protocol;
    const days = Math.max(1, Math.floor((Date.now() - new Date(pos.date).getTime()) / 86400000));
    const apy = liveApys[proto.id] ?? proto.apy;
    const earned = (pos.amount * apy / 100 / 365 * days).toFixed(4);
    const updated = positions.filter(p => p.id !== pos.id);
    setPositions(updated);
    savePositions(updated);
    addTransaction({ type: 'withdraw', protocol: proto.name, amount: pos.amount, token: 'USDT', network: proto.networkLabel, earned: parseFloat(earned) });
  };

  const totalSaved = positions.reduce((s, p) => s + p.amount, 0);
  const totalEarned = positions.reduce((s, p) => {
    const proto = SAVINGS_PROTOCOLS.find(x => x.id === p.protocol.id) || p.protocol;
    const days = Math.max(1, Math.floor((Date.now() - new Date(p.date).getTime()) / 86400000));
    const apy = liveApys[proto.id] ?? proto.apy;
    return s + (p.amount * apy / 100 / 365 * days);
  }, 0);

  const networkInfo = NETWORKS.find(n => n.id === selectedNetwork);

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
              <div className="text-slate-500 text-[10px]">Multi-Chain Yield · Swap Langsung</div>
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
                  <PositionCard key={pos.id} pos={pos} onWithdraw={handleWithdraw} liveApys={liveApys} />
                ))}
              </div>
            )}

            {/* Network Selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-white font-semibold text-sm">Pilih Jaringan</span>
                {selectedNetwork !== 'all' && networkInfo && (
                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: networkInfo.color + '44', border: `1px solid ${networkInfo.color}66` }}>
                    {networkInfo.label}
                  </span>
                )}
              </div>
              <NetworkSelector selected={selectedNetwork} onChange={setSelectedNetwork} chainPrices={chainPrices} />
            </div>

            {/* Available Protocols */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-white font-semibold text-sm">
                    Protocol Savings {selectedNetwork !== 'all' ? `(${filteredProtocols.length})` : `(${SAVINGS_PROTOCOLS.length})`}
                  </span>
                </div>
                {filteredProtocols.length > 0 && (
                  <span className="text-slate-500 text-xs">APY tertinggi: {Math.max(...filteredProtocols.map(p => getApy(p))).toFixed(2)}%</span>
                )}
              </div>

              {filteredProtocols.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Tidak ada protocol untuk jaringan ini.
                </div>
              ) : (
                filteredProtocols.map(proto => {
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-bold">{proto.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${RISK_BG[proto.risk]}`}
                                style={{ color: proto.risk === 'low' ? '#4ade80' : '#facc15' }}>
                                {proto.risk === 'low' ? 'Aman' : 'Sedang'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ background: proto.netColor + '33', border: `1px solid ${proto.netColor}55` }}>{proto.networkLabel}</span>
                              <span className="text-slate-500 text-[10px]">{APY_TYPE_LABEL[proto.apyType]}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <div className="text-green-400 font-bold text-lg">{liveApy.toFixed(2)}%</div>
                            {hasLiveData && <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                          </div>
                          <div className="text-slate-500 text-[10px]">{hasLiveData ? '🟢 Live APY' : 'APY (est.)'} · {proto.tvl}</div>
                        </div>
                      </div>

                      <p className="text-slate-400 text-xs leading-relaxed">{proto.desc}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-xs">Min. ${proto.minDeposit} USDT</span>
                        <Button onClick={() => setSelectedProtocol(proto)}
                          className="h-9 px-4 text-xs font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${proto.color}cc, ${proto.color}88)` }}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Simpan USDT
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
              <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-slate-500 text-xs">Semua protocol adalah DeFi non-custodial. APY bersifat variabel. Demo simulasi — integrasi wallet diperlukan untuk eksekusi nyata.</p>
            </div>
          </>
        )}

        {tab === 'screener' && <DEXScreener />}

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
          liveApy={liveApys[selectedProtocol.id]}
          onConfirm={handleDeposit}
          onClose={() => setSelectedProtocol(null)}
        />
      )}
    </div>
  );
}
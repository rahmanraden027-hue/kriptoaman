import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeftRight, RefreshCw, TrendingUp, ChevronDown,
  Info, Zap, Shield, AlertTriangle, CheckCircle2, Search,
  Star, StarOff, X, Flame, Clock, Fuel, Percent, BarChart2,
  ArrowDown, BookOpen, History, LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DEXPriceChart from './DEXPriceChart';
import DEXOrderBook from './DEXOrderBook';
import DEXTradeHistory from './DEXTradeHistory';
import TxApprovalModal from './TxApprovalModal';
import DEXOrderForm from './DEXOrderForm';
import DEXOrderManager from './DEXOrderManager';

// ── Chains ────────────────────────────────────────────────────────────────────
const CHAINS = {
  ETH:   { chainId: 1,     name: 'Ethereum',  shortName: 'ETH',  color: '#627EEA', icon: 'Ξ',  dexName: 'Uniswap V3',   gasUnit: 'Gwei', gasPrice: 28 },
  BNB:   { chainId: 56,    name: 'BNB Chain', shortName: 'BNB',  color: '#F0B90B', icon: 'B',  dexName: 'PancakeSwap',  gasUnit: 'Gwei', gasPrice: 5 },
  MATIC: { chainId: 137,   name: 'Polygon',   shortName: 'POL',  color: '#8247E5', icon: 'P',  dexName: 'QuickSwap',    gasUnit: 'Gwei', gasPrice: 80 },
  ARB:   { chainId: 42161, name: 'Arbitrum',  shortName: 'ARB',  color: '#28A0F0', icon: 'A',  dexName: 'Camelot DEX',  gasUnit: 'Gwei', gasPrice: 0.1 },
  OP:    { chainId: 10,    name: 'Optimism',  shortName: 'OP',   color: '#FF0420', icon: 'O',  dexName: 'Velodrome',    gasUnit: 'Gwei', gasPrice: 0.001 },
  BASE:  { chainId: 8453,  name: 'Base',      shortName: 'BASE', color: '#0052FF', icon: 'B',  dexName: 'BaseSwap',     gasUnit: 'Gwei', gasPrice: 0.001 },
  AVAX:  { chainId: 43114, name: 'Avalanche', shortName: 'AVAX', color: '#E84142', icon: '▲',  dexName: 'Trader Joe',   gasUnit: 'nAVAX', gasPrice: 25 },
  FTM:   { chainId: 250,   name: 'Fantom',    shortName: 'FTM',  color: '#1969FF', icon: 'F',  dexName: 'SpookySwap',   gasUnit: 'Gwei', gasPrice: 100 },
};

// ── Tokens ────────────────────────────────────────────────────────────────────
const TOKENS = {
  1: [
    { address: '0xEeee', symbol: 'ETH',   decimals: 18, name: 'Ethereum',    logo: '🔷' },
    { address: '0xdAC1', symbol: 'USDT',  decimals: 6,  name: 'Tether',      logo: '💵' },
    { address: '0xA0b8', symbol: 'USDC',  decimals: 6,  name: 'USD Coin',    logo: '🔵' },
    { address: '0x2260', symbol: 'WBTC',  decimals: 8,  name: 'Wrapped BTC', logo: '🟠' },
    { address: '0x1f98', symbol: 'UNI',   decimals: 18, name: 'Uniswap',     logo: '🦄' },
    { address: '0x5149', symbol: 'LINK',  decimals: 18, name: 'Chainlink',   logo: '🔗' },
    { address: '0x7D1A', symbol: 'MATIC', decimals: 18, name: 'Polygon',     logo: '🟣' },
    { address: '0xae7a', symbol: 'stETH', decimals: 18, name: 'Lido stETH',  logo: '💧' },
  ],
  56: [
    { address: '0xEeee', symbol: 'BNB',  decimals: 18, name: 'BNB',         logo: '🟡' },
    { address: '0x55d3', symbol: 'USDT', decimals: 18, name: 'Tether',      logo: '💵' },
    { address: '0x8AC7', symbol: 'USDC', decimals: 18, name: 'USD Coin',    logo: '🔵' },
    { address: '0x2170', symbol: 'ETH',  decimals: 18, name: 'Ethereum',    logo: '🔷' },
    { address: '0x7130', symbol: 'BTCB', decimals: 18, name: 'BTCB',        logo: '🟠' },
    { address: '0x0E09', symbol: 'CAKE', decimals: 18, name: 'PancakeSwap', logo: '🥞' },
    { address: '0x1D2F', symbol: 'XRP',  decimals: 18, name: 'XRP Token',   logo: '⚡' },
    { address: '0xbA2a', symbol: 'DOGE', decimals: 8,  name: 'Dogecoin',    logo: '🐶' },
  ],
  137: [
    { address: '0xEeee', symbol: 'POL',   decimals: 18, name: 'Polygon',     logo: '🟣' },
    { address: '0xc213', symbol: 'USDT',  decimals: 6,  name: 'Tether',      logo: '💵' },
    { address: '0x2791', symbol: 'USDC',  decimals: 6,  name: 'USD Coin',    logo: '🔵' },
    { address: '0x7ceB', symbol: 'ETH',   decimals: 18, name: 'Ethereum',    logo: '🔷' },
    { address: '0x1BFD', symbol: 'WBTC',  decimals: 8,  name: 'Wrapped BTC', logo: '🟠' },
    { address: '0xb33E', symbol: 'UNI',   decimals: 18, name: 'Uniswap',     logo: '🦄' },
  ],
  42161: [
    { address: '0xEeee', symbol: 'ETH',  decimals: 18, name: 'Ethereum',    logo: '🔷' },
    { address: '0xFd08', symbol: 'USDT', decimals: 6,  name: 'Tether',      logo: '💵' },
    { address: '0xFF97', symbol: 'USDC', decimals: 6,  name: 'USD Coin',    logo: '🔵' },
    { address: '0x2f2a', symbol: 'WBTC', decimals: 8,  name: 'Wrapped BTC', logo: '🟠' },
    { address: '0x912C', symbol: 'ARB',  decimals: 18, name: 'Arbitrum',    logo: '🔵' },
    { address: '0xf97f', symbol: 'LINK', decimals: 18, name: 'Chainlink',   logo: '🔗' },
  ],
  10: [
    { address: '0xEeee', symbol: 'ETH',  decimals: 18, name: 'Ethereum',    logo: '🔷' },
    { address: '0x94b0', symbol: 'USDT', decimals: 6,  name: 'Tether',      logo: '💵' },
    { address: '0x7F5c', symbol: 'USDC', decimals: 6,  name: 'USD Coin',    logo: '🔵' },
    { address: '0x68f1', symbol: 'WBTC', decimals: 8,  name: 'Wrapped BTC', logo: '🟠' },
    { address: '0x4200', symbol: 'OP',   decimals: 18, name: 'Optimism',    logo: '🔴' },
  ],
  8453: [
    { address: '0xEeee', symbol: 'ETH',   decimals: 18, name: 'Ethereum',    logo: '🔷' },
    { address: '0xfde4', symbol: 'USDT',  decimals: 6,  name: 'Tether',      logo: '💵' },
    { address: '0x8335', symbol: 'USDC',  decimals: 6,  name: 'USD Coin',    logo: '🔵' },
    { address: '0xcbB7', symbol: 'cbBTC', decimals: 8,  name: 'Coinbase BTC',logo: '🟠' },
  ],
  43114: [
    { address: '0xEeee', symbol: 'AVAX', decimals: 18, name: 'Avalanche',   logo: '🔺' },
    { address: '0x9702', symbol: 'USDT', decimals: 6,  name: 'Tether',      logo: '💵' },
    { address: '0xB97E', symbol: 'USDC', decimals: 6,  name: 'USD Coin',    logo: '🔵' },
    { address: '0x50b7', symbol: 'WBTC', decimals: 8,  name: 'Wrapped BTC', logo: '🟠' },
    { address: '0x6e84', symbol: 'JOE',  decimals: 18, name: 'Trader Joe',  logo: '☕' },
  ],
  250: [
    { address: '0xEeee', symbol: 'FTM',  decimals: 18, name: 'Fantom',      logo: '👻' },
    { address: '0x049d', symbol: 'USDT', decimals: 6,  name: 'Tether',      logo: '💵' },
    { address: '0x0406', symbol: 'USDC', decimals: 6,  name: 'USD Coin',    logo: '🔵' },
    { address: '0x21be', symbol: 'WFTM', decimals: 18, name: 'Wrapped FTM', logo: '👻' },
    { address: '0x841F', symbol: 'BOO',  decimals: 18, name: 'SpookySwap',  logo: '👻' },
  ],
};

// ── Base prices ───────────────────────────────────────────────────────────────
const BASE_PRICES = {
  ETH: 3400, BNB: 580, USDT: 1, USDC: 1, WBTC: 95000, BTCB: 95000, cbBTC: 95000,
  POL: 0.45, MATIC: 0.45, UNI: 8.2, LINK: 14.5, AVAX: 38, FTM: 0.55,
  ARB: 1.1, OP: 1.8, CAKE: 2.3, XRP: 0.55, DOGE: 0.12, JOE: 0.32,
  BOO: 2.1, stETH: 3390, WFTM: 0.55, CRV: 0.5, ENS: 22,
};

const FAV_KEY = 'dex_fav_pairs_v2';

function loadFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; } }
function saveFavs(f) { localStorage.setItem(FAV_KEY, JSON.stringify(f)); }

function formatAmt(amount, decimals) {
  const val = Number(BigInt(amount)) / Math.pow(10, decimals);
  return val < 0.000001 ? val.toExponential(4) : val.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function fmtPrice(p) {
  if (!p) return '—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return '$' + p.toFixed(p < 1 ? 4 : 2);
}

// ── TokenSelector ─────────────────────────────────────────────────────────────
function TokenSelector({ tokens, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const token = tokens.find(t => t.address === value);
  const filtered = tokens.filter(t =>
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 bg-slate-700/80 hover:bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm font-medium transition-colors min-w-[110px]">
        <span className="text-base leading-none">{token?.logo}</span>
        <span className="font-bold">{token?.symbol || '—'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[70]" onClick={() => { setOpen(false); setSearch(''); }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-60 bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <span className="text-white text-sm font-semibold">Pilih Token</span>
              <button onClick={() => { setOpen(false); setSearch(''); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-2 py-1.5">
                <Search className="w-3 h-3 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." autoFocus
                  className="bg-transparent text-white text-xs outline-none flex-1 placeholder:text-slate-600" />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-700/50">
              {filtered.map(t => (
                <button key={t.address} onClick={() => { onChange(t.address); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-700 transition-colors text-left ${t.address === value ? 'bg-slate-700/60' : ''}`}>
                  <span className="text-xl leading-none">{t.logo}</span>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.symbol}</div>
                    <div className="text-slate-500 text-xs">{t.name}</div>
                  </div>
                  {t.address === value && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FeeBreakdown ──────────────────────────────────────────────────────────────
function FeeBreakdown({ quote, chain, fromTok, toTok, dstAmount, amount }) {
  const [expanded, setExpanded] = useState(false);
  const gasETH = (quote.gas * chain.gasPrice * 1e-9);
  const gasUSD = (gasETH * (BASE_PRICES.ETH || 3400)).toFixed(2);
  const protocolFee = parseFloat(amount) * 0.0008; // 0.08% typical 1inch fee
  const protocolFeeUSD = (protocolFee * (BASE_PRICES[fromTok?.symbol] || 1)).toFixed(4);
  const slippage = parseFloat(quote.priceImpact || 0);
  const minOut   = parseFloat(dstAmount) * (1 - 0.005); // 0.5% slippage tolerance
  const rate = parseFloat(dstAmount) / parseFloat(amount);

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-slate-800/40 transition-colors">
        <div className="flex items-center gap-1.5 text-slate-400">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>1 {fromTok?.symbol} ≈ {rate.toFixed(6)} {toTok?.symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">≈ ${gasUSD} biaya</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/40 px-3 py-3 space-y-2">
          {/* Gas Fee */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Fuel className="w-3 h-3 text-orange-400" />
              <span>Gas Estimasi</span>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">{parseInt(quote.gas).toLocaleString()} units</div>
              <div className="text-slate-500">{chain.gasPrice} {chain.gasUnit} · ≈ ${gasUSD}</div>
            </div>
          </div>

          {/* Protocol Fee */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Percent className="w-3 h-3 text-blue-400" />
              <span>Biaya Protokol (1inch)</span>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">0.08%</div>
              <div className="text-slate-500">≈ {protocolFeeUSD} {fromTok?.symbol}</div>
            </div>
          </div>

          {/* Price Impact / Slippage */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <TrendingUp className="w-3 h-3 text-yellow-400" />
              <span>Price Impact</span>
            </div>
            <span className={`font-semibold ${Math.abs(slippage) < 1 ? 'text-green-400' : Math.abs(slippage) < 3 ? 'text-yellow-400' : 'text-red-400'}`}>
              {slippage > 0 ? '+' : ''}{slippage.toFixed(2)}%
            </span>
          </div>

          {/* Slippage Tolerance */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3 h-3 text-purple-400" />
              <span>Toleransi Slippage</span>
            </div>
            <span className="text-white font-medium">0.5%</span>
          </div>

          {/* Minimum Received */}
          <div className="flex justify-between items-center text-xs border-t border-slate-700/40 pt-2">
            <span className="text-slate-400 font-medium">Min. Diterima</span>
            <span className="text-white font-bold">{minOut.toFixed(6)} {toTok?.symbol}</span>
          </div>

          {/* Route */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Rute</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-300">{fromTok?.symbol}</span>
              <span className="text-slate-600">→</span>
              <span className="text-blue-400 font-medium">{quote.protocols?.[0]?.[0]?.name || chain.dexName}</span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-300">{toTok?.symbol}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── QuickSwap Card ────────────────────────────────────────────────────────────
function QuickSwapCard({ pair, onClick, onRemove }) {
  const { fromSym, toSym, chainKey, fromLogo, toLogo } = pair;
  const chain = CHAINS[chainKey];
  return (
    <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2.5 flex items-center gap-2 min-w-[130px] group relative">
      <button onClick={() => onClick(pair)} className="flex items-center gap-2 flex-1">
        <div className="flex -space-x-1.5">
          <span className="text-base leading-none z-10">{fromLogo}</span>
          <span className="text-base leading-none">{toLogo}</span>
        </div>
        <div>
          <div className="text-white text-xs font-bold">{fromSym}→{toSym}</div>
          <div className="text-[10px] font-medium" style={{ color: chain?.color }}>{chain?.shortName}</div>
        </div>
      </button>
      <button onClick={() => onRemove(pair)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── SwapSuccessModal ──────────────────────────────────────────────────────────
function SwapSuccessModal({ fromTok, toTok, amount, dstAmount, chain, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 text-center space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Swap Berhasil!</h3>
          <p className="text-slate-400 text-sm mt-1">Transaksi dikirim ke {chain.name}</p>
        </div>
        <div className="flex items-center justify-center gap-4 bg-slate-800 rounded-xl p-4">
          <div className="text-center">
            <div className="text-2xl">{fromTok?.logo}</div>
            <div className="text-white font-bold text-sm">{amount}</div>
            <div className="text-slate-400 text-xs">{fromTok?.symbol}</div>
          </div>
          <ArrowDown className="w-5 h-5 text-green-400 rotate-[-90deg]" />
          <div className="text-center">
            <div className="text-2xl">{toTok?.logo}</div>
            <div className="text-green-400 font-bold text-sm">{parseFloat(dstAmount).toFixed(6)}</div>
            <div className="text-slate-400 text-xs">{toTok?.symbol}</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Konfirmasi dalam ~15-30 detik</span>
        </div>
        <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
          Selesai
        </Button>
      </div>
    </div>
  );
}

// ── Main DEXMarket ─────────────────────────────────────────────────────────────
export default function DEXMarket({ addresses = {} }) {
  const chainKeys = Object.keys(CHAINS);
  const [selectedChain, setSelectedChain] = useState('ETH');
  const chain   = CHAINS[selectedChain];
  const chainId = chain.chainId;
  const tokens  = TOKENS[chainId] || TOKENS[1];

  const [fromToken, setFromToken] = useState(tokens[0].address);
  const [toToken, setToToken]     = useState(tokens[1].address);
  const [amount, setAmount]       = useState('1');
  const [quote, setQuote]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [swapping, setSwapping]   = useState(false);
  const [error, setError]         = useState('');
  const [livePrices, setLivePrices] = useState({});
  const [favPairs, setFavPairs]   = useState(loadFavs);
  const [success, setSuccess]     = useState(null);
  const [txApproval, setTxApproval] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const priceTimer = useRef(null);

  // Reset tokens on chain change
  useEffect(() => {
    const t = TOKENS[CHAINS[selectedChain].chainId] || TOKENS[1];
    setFromToken(t[0].address);
    setToToken(t[1].address);
    setQuote(null); setError('');
  }, [selectedChain]);

  // Live price updates
  useEffect(() => {
    const updatePrices = () => {
      const updated = {};
      (tokens).forEach(t => {
        const base = BASE_PRICES[t.symbol] || 1;
        const prev = updated[t.symbol]?.price || livePrices[t.symbol]?.price || base;
        const delta = (Math.random() - 0.5) * 0.004;
        const newP = Math.max(prev * (1 + delta), 0.0001);
        updated[t.symbol] = { price: newP, change: ((newP - base) / base) * 100, tick: delta > 0 ? 'up' : 'down' };
      });
      setLivePrices(updated);
    };
    updatePrices();
    priceTimer.current = setInterval(updatePrices, 2500);
    return () => clearInterval(priceTimer.current);
  }, [selectedChain]);

  const fromTok   = tokens.find(t => t.address === fromToken);
  const toTok     = tokens.find(t => t.address === toToken);
  const dstAmount = quote ? formatAmt(quote.dstAmount, toTok?.decimals || 18) : null;
  const fromP     = livePrices[fromTok?.symbol]?.price;
  const toP       = livePrices[toTok?.symbol]?.price;
  const fromUSD   = fromP && amount ? (parseFloat(amount) * fromP).toLocaleString('en-US', { maximumFractionDigits: 2 }) : null;
  const toUSD     = toP && dstAmount ? (parseFloat(dstAmount) * toP).toLocaleString('en-US', { maximumFractionDigits: 2 }) : null;

  const getQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) { setError('Masukkan jumlah yang valid'); return; }
    setLoading(true); setError(''); setQuote(null);
    await new Promise(r => setTimeout(r, 800));
    const fp = livePrices[fromTok?.symbol]?.price || BASE_PRICES[fromTok?.symbol] || 1;
    const tp = livePrices[toTok?.symbol]?.price   || BASE_PRICES[toTok?.symbol]   || 1;
    const out = (parseFloat(amount) * fp / tp) * 0.9972;
    const dec = toTok?.decimals || 18;
    const dstBig = BigInt(Math.floor(out * Math.pow(10, dec))).toString();
    const gasUnits = 120000 + Math.floor(Math.random() * 80000);
    const impact = -((Math.random() * 0.4)).toFixed(2);
    setQuote({ dstAmount: dstBig, gas: gasUnits, protocols: [[{ name: chain.dexName }]], priceImpact: impact });
    setLoading(false);
  }, [fromToken, toToken, amount, tokens, livePrices, chain]);

  const handleSwap = async () => {
    if (!quote) return;
    // Show approval modal instead of swapping directly
    const txData = {
      type: 'swap',
      hash: '0x' + Math.random().toString(16).slice(2, 66),
      fromToken: fromTok?.symbol,
      toToken: toTok?.symbol,
      amount: amount,
      toAmount: dstAmount,
      network: chain.name,
      gasLimit: '150000',
      gasPrice: 'Standard',
    };
    setTxApproval(txData);
  };

  const handleTxApproved = async () => {
    setSwapping(true);
    await new Promise(r => setTimeout(r, 1500));
    setSwapping(false);
    setSuccess({ fromTok, toTok, amount, dstAmount, chain });
    setQuote(null);
    setAmount('1');
  };

  const handleTxRejected = () => {
    setTxApproval(null);
  };

  const swapDir = () => { setFromToken(toToken); setToToken(fromToken); setQuote(null); };

  const addFav = () => {
    const pair = { fromSym: fromTok?.symbol, toSym: toTok?.symbol, chainKey: selectedChain, fromLogo: fromTok?.logo, toLogo: toTok?.logo, fromAddr: fromToken, toAddr: toToken };
    const key = `${selectedChain}:${fromToken}:${toToken}`;
    if (favPairs.some(f => `${f.chainKey}:${f.fromAddr}:${f.toAddr}` === key)) return;
    const updated = [...favPairs, { ...pair, key }].slice(-6);
    setFavPairs(updated); saveFavs(updated);
  };

  const removeFav = (pair) => {
    const updated = favPairs.filter(f => f.key !== pair.key);
    setFavPairs(updated); saveFavs(updated);
  };

  const loadFavPair = (pair) => {
    const newChain = pair.chainKey;
    setSelectedChain(newChain);
    setTimeout(() => { setFromToken(pair.fromAddr); setToToken(pair.toAddr); setQuote(null); }, 50);
  };

  const alreadyFav = favPairs.some(f => f.fromAddr === fromToken && f.toAddr === toToken && f.chainKey === selectedChain);
  const midPrice = fromP && toP ? fromP / toP : 1;
  const [marketTab, setMarketTab] = useState('chart'); // chart | orderbook | trades

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-slate-400" />
          <h2 className="text-white font-semibold text-sm">DEX Semua Jaringan</h2>
        </div>
        <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Real-time
        </span>
      </div>

      {/* Swap Favorit */}
      {favPairs.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400 text-xs font-semibold">Swap Cepat</span>
          </div>
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              {favPairs.map(pair => (
                <QuickSwapCard key={pair.key} pair={pair} onClick={loadFavPair} onRemove={removeFav} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Price Ticker */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
          {tokens.slice(0, 5).map(t => {
            const lp = livePrices[t.symbol];
            const isUp = lp?.tick === 'up';
            return (
              <div key={t.symbol} className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2 min-w-[88px]">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm leading-none">{t.logo}</span>
                  <span className="text-white text-xs font-bold">{t.symbol}</span>
                </div>
                <div className={`text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {lp ? fmtPrice(lp.price) : '—'}
                </div>
                <div className={`text-[10px] ${isUp ? 'text-green-400/70' : 'text-red-400/70'}`}>
                  {isUp ? '▲' : '▼'} {lp ? Math.abs(lp.change).toFixed(2) : '0.00'}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chain Selector */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
          {chainKeys.map(id => {
            const c = CHAINS[id];
            return (
              <button key={id} onClick={() => setSelectedChain(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${selectedChain === id ? 'text-white border-transparent' : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-300'}`}
                style={selectedChain === id ? { background: c.color + 'cc', borderColor: c.color } : {}}>
                <span>{c.icon}</span>{c.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chain badge */}
      <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: chain.color }}>{chain.icon}</div>
        <span className="text-white text-xs font-semibold">{chain.name}</span>
        <span className="text-slate-500 text-xs">via {chain.dexName} · 1inch</span>
        <div className="ml-auto flex items-center gap-1 text-green-400 text-xs"><Zap className="w-3 h-3" /> Live</div>
      </div>

      {/* Swap Form */}
      <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-2">

        {/* FROM */}
        <div className="bg-slate-900/60 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs">Dari</span>
            {fromUSD && <span className="text-slate-500 text-xs">≈ ${fromUSD}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" value={amount} onChange={e => { setAmount(e.target.value); setQuote(null); }}
              placeholder="0.0" className="bg-transparent border-0 text-white text-2xl font-bold p-0 h-auto focus-visible:ring-0 flex-1" />
            <TokenSelector tokens={tokens} value={fromToken} onChange={addr => { setFromToken(addr); setQuote(null); }} />
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {['25%', '50%', 'Max'].map(p => (
              <button key={p} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">{p}</button>
            ))}
            {fromP && (
              <span className={`ml-auto text-[10px] font-medium ${livePrices[fromTok?.symbol]?.tick === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {fmtPrice(fromP)} <span className="w-1.5 h-1.5 inline-block rounded-full bg-green-400 animate-pulse" />
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center -my-1 relative z-10">
          <button onClick={swapDir}
            className="w-9 h-9 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 hover:rotate-180 transition-all duration-300">
            <ArrowDown className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* TO */}
        <div className="bg-slate-900/60 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs">Ke</span>
            {toUSD && <span className="text-slate-500 text-xs">≈ ${toUSD}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-2xl font-bold text-white/60">{dstAmount || '—'}</div>
            <TokenSelector tokens={tokens} value={toToken} onChange={addr => { setToToken(addr); setQuote(null); }} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Fee Breakdown */}
        {quote && !error && (
          <FeeBreakdown quote={quote} chain={chain} fromTok={fromTok} toTok={toTok} dstAmount={dstAmount} amount={amount} />
        )}

        {/* Buttons */}
        {!quote ? (
          <Button onClick={getQuote} disabled={loading} className="w-full text-white font-semibold h-11"
            style={{ background: chain.color + 'cc' }}>
            {loading
              ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Mengambil quote...</span>
              : <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Dapatkan Quote</span>
            }
          </Button>
        ) : (
          <div className="space-y-2">
            {/* Swap Langsung */}
            <Button onClick={handleSwap} disabled={swapping} className="w-full text-white font-bold h-12 text-base"
              style={{ background: `linear-gradient(135deg, ${chain.color}, ${chain.color}99)` }}>
              {swapping
                ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Memproses Swap...</span>
                : <span className="flex items-center gap-2"><Zap className="w-4 h-4" />Swap Langsung — {chain.dexName}</span>
              }
            </Button>

            {/* Save as favorite + Re-quote */}
            <div className="flex gap-2">
              <button onClick={addFav} disabled={alreadyFav}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${alreadyFav ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' : 'border-slate-600 text-slate-400 hover:text-yellow-400 hover:border-yellow-500/40'}`}>
                {alreadyFav ? <Star className="w-3.5 h-3.5" fill="currentColor" /> : <StarOff className="w-3.5 h-3.5" />}
                {alreadyFav ? 'Disimpan' : 'Simpan Pasangan'}
              </button>
              <button onClick={() => { setQuote(null); }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-white text-xs font-medium transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Quote Baru
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Market Data Tabs */}
      <div className="space-y-2">
        <div className="flex bg-slate-800/60 border border-slate-700/40 rounded-xl p-1 gap-1">
          {[
            { key: 'chart', label: 'Grafik', icon: LineChart },
            { key: 'orderbook', label: 'Order Book', icon: BookOpen },
            { key: 'trades', label: 'Riwayat', icon: History },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setMarketTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${marketTab === key ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {marketTab === 'chart' && (
          <DEXPriceChart
            fromToken={fromTok}
            toToken={toTok}
            basePrice={midPrice}
            color={chain.color}
          />
        )}
        {marketTab === 'orderbook' && (
          <DEXOrderBook
            midPrice={midPrice}
            fromSymbol={fromTok?.symbol}
            toSymbol={toTok?.symbol}
          />
        )}
        {marketTab === 'trades' && (
          <DEXTradeHistory
            midPrice={midPrice}
            fromSymbol={fromTok?.symbol}
            toSymbol={toTok?.symbol}
          />
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
        <Shield className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-slate-500 text-xs">Swap langsung via 1inch aggregator — menggabungkan 300+ DEX. Non-custodial, simulasi untuk demo.</p>
      </div>

      {/* Success Modal */}
      {success && <SwapSuccessModal {...success} onClose={() => setSuccess(null)} />}

      {/* Tx Approval Modal */}
      {txApproval && (
        <TxApprovalModal
          tx={txApproval}
          onApprove={handleTxApproved}
          onReject={handleTxRejected}
          onClose={() => setTxApproval(null)}
        />
      )}
    </div>
  );
}
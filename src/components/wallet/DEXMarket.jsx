import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, RefreshCw, TrendingUp, ExternalLink, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 1inch supported chains
const CHAINS = {
  ETH:   { chainId: 1,    name: 'Ethereum',   color: '#627EEA', explorer: 'https://etherscan.io/tx/' },
  BNB:   { chainId: 56,   name: 'BNB Chain',  color: '#F0B90B', explorer: 'https://bscscan.com/tx/' },
  MATIC: { chainId: 137,  name: 'Polygon',    color: '#8247E5', explorer: 'https://polygonscan.com/tx/' },
};

// Popular tokens per chain (address, symbol, decimals)
const TOKENS = {
  1: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH',  decimals: 18, name: 'Ethereum' },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6,  name: 'Tether' },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6,  name: 'USD Coin' },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8,  name: 'Wrapped BTC' },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI',  decimals: 18, name: 'Uniswap' },
    { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', decimals: 18, name: 'Chainlink' },
    { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', symbol: 'MATIC',decimals: 18, name: 'Polygon' },
    { address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', symbol: 'stETH',decimals: 18, name: 'Lido stETH' },
  ],
  56: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'BNB',  decimals: 18, name: 'BNB' },
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18, name: 'Tether' },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18, name: 'USD Coin' },
    { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH',  decimals: 18, name: 'Ethereum' },
    { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', symbol: 'BTCB', decimals: 18, name: 'BTCB' },
    { address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', symbol: 'XRP',  decimals: 18, name: 'XRP Token' },
    { address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', symbol: 'DOGE', decimals: 8,  name: 'Dogecoin' },
  ],
  137: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'POL',  decimals: 18, name: 'Polygon' },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6,  name: 'Tether' },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', decimals: 6,  name: 'USD Coin' },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'ETH',  decimals: 18, name: 'Ethereum' },
    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', decimals: 8,  name: 'Wrapped BTC' },
    { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC',decimals:18, name: 'Wrapped MATIC' },
  ],
};

const INCH_API = 'https://api.1inch.dev/swap/v6.0';
const API_KEY  = ''; // Public endpoint (rate-limited) – user can add own key via env

async function fetchQuote(chainId, fromToken, toToken, amount) {
  const url = `${INCH_API}/${chainId}/quote?src=${fromToken}&dst=${toToken}&amount=${amount}&includeGas=true`;
  const headers = API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.description || `HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchTokenPrice(chainId, tokenAddress) {
  try {
    const url = `https://api.1inch.dev/price/v1.1/${chainId}/${tokenAddress}?currency=USD`;
    const headers = API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data[tokenAddress.toLowerCase()] || null;
  } catch { return null; }
}

function formatTokenAmount(amount, decimals) {
  const val = Number(BigInt(amount)) / Math.pow(10, decimals);
  return val < 0.000001 ? val.toExponential(4) : val.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function TokenSelector({ tokens, value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const token = tokens.find(t => t.address === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm font-medium transition-colors min-w-[100px]"
      >
        <span className="font-bold">{token?.symbol || '—'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <div className="text-xs text-slate-500 px-3 pt-2 pb-1">{label}</div>
          <div className="max-h-56 overflow-y-auto">
            {tokens.map(t => (
              <button
                key={t.address}
                onClick={() => { onChange(t.address); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700 transition-colors text-left ${t.address === value ? 'bg-slate-700/60' : ''}`}
              >
                <div>
                  <div className="text-white text-sm font-semibold">{t.symbol}</div>
                  <div className="text-slate-500 text-xs">{t.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DEXMarket({ addresses = {} }) {
  const [selectedChain, setSelectedChain] = useState('ETH');
  const chainId = CHAINS[selectedChain].chainId;
  const tokens = TOKENS[chainId];

  const [fromToken, setFromToken] = useState(tokens[0].address);
  const [toToken, setToToken]     = useState(tokens[1].address);
  const [amount, setAmount]       = useState('1');
  const [quote, setQuote]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [fromPrice, setFromPrice] = useState(null);
  const [toPrice, setToPrice]     = useState(null);

  // Reset tokens when chain changes
  useEffect(() => {
    const t = TOKENS[CHAINS[selectedChain].chainId];
    setFromToken(t[0].address);
    setToToken(t[1].address);
    setQuote(null);
    setError('');
  }, [selectedChain]);

  const getQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) { setError('Masukkan jumlah yang valid'); return; }
    const fromTok = tokens.find(t => t.address === fromToken);
    if (!fromTok) return;

    setLoading(true);
    setError('');
    setQuote(null);

    const rawAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, fromTok.decimals))).toString();

    const [quoteData, fp, tp] = await Promise.all([
      fetchQuote(chainId, fromToken, toToken, rawAmount).catch(e => { setError(e.message); return null; }),
      fetchTokenPrice(chainId, fromToken),
      fetchTokenPrice(chainId, toToken),
    ]);

    setFromPrice(fp);
    setToPrice(tp);
    if (quoteData) setQuote(quoteData);
    setLoading(false);
  }, [chainId, fromToken, toToken, amount, tokens]);

  const swapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuote(null);
  };

  const fromTok = tokens.find(t => t.address === fromToken);
  const toTok   = tokens.find(t => t.address === toToken);
  const dstAmount = quote ? formatTokenAmount(quote.dstAmount, toTok?.decimals || 18) : null;
  const fromUSD = fromPrice && amount ? (parseFloat(amount) * parseFloat(fromPrice)).toFixed(2) : null;
  const toUSD   = toPrice && dstAmount ? (parseFloat(dstAmount) * parseFloat(toPrice)).toFixed(2) : null;
  const priceImpact = quote?.priceImpact ? Math.abs(parseFloat(quote.priceImpact)).toFixed(2) : null;

  const walletAddress = addresses[selectedChain]?.address;
  const swapURL = walletAddress
    ? `https://app.1inch.io/#/${chainId}/simple/swap/${fromToken}/${toToken}`
    : `https://app.1inch.io/#/${chainId}/simple/swap/${fromToken}/${toToken}`;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-slate-400" />
          <h2 className="text-white font-semibold text-sm">DEX Market</h2>
          <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">via 1inch</span>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="flex gap-1.5">
        {Object.entries(CHAINS).map(([id, chain]) => (
          <button
            key={id}
            onClick={() => setSelectedChain(id)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedChain === id
                ? 'text-white border-transparent'
                : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
            style={selectedChain === id ? { background: chain.color + 'cc', borderColor: chain.color } : {}}
          >
            {chain.name}
          </button>
        ))}
      </div>

      {/* Swap Form */}
      <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-3">
        {/* From */}
        <div className="bg-slate-900/60 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs">Dari</span>
            {fromUSD && <span className="text-slate-500 text-xs">≈ ${fromUSD}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.0"
              className="bg-transparent border-0 text-white text-xl font-bold p-0 h-auto focus-visible:ring-0 flex-1"
            />
            <TokenSelector tokens={tokens} value={fromToken} onChange={setFromToken} label="Pilih token asal" />
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <button
            onClick={swapTokens}
            className="w-8 h-8 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>

        {/* To */}
        <div className="bg-slate-900/60 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-xs">Ke</span>
            {toUSD && <span className="text-slate-500 text-xs">≈ ${toUSD}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xl font-bold text-white/60">
              {dstAmount || '—'}
            </div>
            <TokenSelector tokens={tokens} value={toToken} onChange={setToToken} label="Pilih token tujuan" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl">
            <Info className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Quote Details */}
        {quote && !error && (
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Rate</span>
              <span className="text-slate-300">1 {fromTok?.symbol} = {(parseFloat(dstAmount) / parseFloat(amount)).toLocaleString('en-US', { maximumFractionDigits: 6 })} {toTok?.symbol}</span>
            </div>
            {priceImpact && (
              <div className="flex justify-between text-slate-400">
                <span>Price Impact</span>
                <span className={parseFloat(priceImpact) > 2 ? 'text-red-400' : 'text-green-400'}>
                  {priceImpact}%
                </span>
              </div>
            )}
            {quote.gas && (
              <div className="flex justify-between text-slate-400">
                <span>Est. Gas</span>
                <span className="text-slate-300">{parseInt(quote.gas).toLocaleString()} units</span>
              </div>
            )}
            {quote.protocols?.length > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Protokol</span>
                <span className="text-slate-300 text-right max-w-[60%] truncate">
                  {quote.protocols[0]?.[0]?.[0]?.name || '1inch'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Get Quote Button */}
        <Button
          onClick={getQuote}
          disabled={loading}
          className="w-full text-white font-semibold"
          style={{ background: CHAINS[selectedChain].color + 'cc' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Mengambil quote...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Dapatkan Quote
            </span>
          )}
        </Button>

        {/* Execute on 1inch */}
        {quote && (
          <a
            href={swapURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Swap di 1inch App
          </a>
        )}
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
        <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-slate-500 text-xs">
          Quote dari 1inch aggregator — menggabungkan likuiditas dari Uniswap, Curve, Balancer, dan 300+ DEX lainnya.
          Eksekusi swap dilakukan langsung di aplikasi 1inch (non-custodial).
        </p>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useWeb3 } from './Web3Provider';
import { ArrowDownUp, Loader2, ExternalLink, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 1inch quote API (no key needed for basic)
const DEX_TOKENS = {
  1: [
    { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
  ],
  56: [
    { symbol: 'BNB', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
    { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 },
  ],
  137: [
    { symbol: 'MATIC', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
  ],
};

export default function Web3DEXSwap() {
  const { account, chainId, currentChain, isConnected } = useWeb3();
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slippage, setSlippage] = useState(0.5);

  const tokens = DEX_TOKENS[chainId] || DEX_TOKENS[1];

  useEffect(() => {
    if (tokens.length >= 2) {
      setFromToken(tokens[0]);
      setToToken(tokens[1]);
    }
  }, [chainId]);

  const getQuote = async () => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setQuote(null);
    try {
      const amountIn = BigInt(Math.floor(parseFloat(amount) * 10 ** fromToken.decimals));
      const res = await fetch(
        `https://api.1inch.dev/swap/v6.0/${chainId}/quote?src=${fromToken.address}&dst=${toToken.address}&amount=${amountIn}`,
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        const outAmount = parseFloat(data.dstAmount) / 10 ** toToken.decimals;
        setQuote({ outAmount, gas: data.gas, protocol: data.protocols?.[0]?.[0]?.[0]?.name || 'DEX' });
      } else {
        // Fallback: simulate quote
        const mockRate = fromToken.symbol === 'ETH' ? 3200 : toToken.symbol === 'ETH' ? 1 / 3200 : 1;
        setQuote({ outAmount: parseFloat(amount) * mockRate, gas: 150000, protocol: 'Uniswap V3 (sim)' });
      }
    } catch {
      const mockRate = 1;
      setQuote({ outAmount: parseFloat(amount) * mockRate, gas: 150000, protocol: 'Simulated' });
    }
    setLoading(false);
  };

  const swap = () => {
    if (!account) return;
    const url = `https://app.uniswap.org/#/swap?inputCurrency=${fromToken.address}&outputCurrency=${toToken.address}&exactAmount=${amount}&exactField=input&chain=${currentChain?.name?.toLowerCase() || 'mainnet'}`;
    window.open(url, '_blank');
  };

  if (!isConnected) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 text-center">
        <Zap className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <div className="text-slate-400 text-sm">Hubungkan wallet untuk DEX Swap</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-white font-semibold text-sm">DEX Swap (Onchain)</span>
        {currentChain && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto"
            style={{ background: currentChain.color + '22', color: currentChain.color }}>
            {currentChain.name}
          </span>
        )}
      </div>

      {/* From */}
      <div className="bg-slate-900/60 rounded-xl p-3 mb-2">
        <div className="text-slate-400 text-xs mb-2">Dari</div>
        <div className="flex items-center gap-2">
          <select
            value={fromToken?.symbol || ''}
            onChange={e => setFromToken(tokens.find(t => t.symbol === e.target.value))}
            className="bg-slate-700 text-white text-sm rounded-lg px-2 py-1.5 border-0 outline-none"
          >
            {tokens.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
          </select>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.0"
            type="number"
            min="0"
            className="flex-1 bg-transparent text-white text-right text-lg font-bold focus:outline-none"
          />
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center my-2">
        <button
          onClick={() => { const tmp = fromToken; setFromToken(toToken); setToToken(tmp); setQuote(null); }}
          className="bg-slate-700 hover:bg-slate-600 rounded-full p-2 transition-colors"
        >
          <ArrowDownUp className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* To */}
      <div className="bg-slate-900/60 rounded-xl p-3 mb-4">
        <div className="text-slate-400 text-xs mb-2">Ke</div>
        <div className="flex items-center gap-2">
          <select
            value={toToken?.symbol || ''}
            onChange={e => setToToken(tokens.find(t => t.symbol === e.target.value))}
            className="bg-slate-700 text-white text-sm rounded-lg px-2 py-1.5 border-0 outline-none"
          >
            {tokens.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
          </select>
          <div className="flex-1 text-right">
            {quote ? (
              <span className="text-white text-lg font-bold">{quote.outAmount.toFixed(6)}</span>
            ) : (
              <span className="text-slate-500 text-lg">0.0</span>
            )}
          </div>
        </div>
      </div>

      {/* Quote info */}
      {quote && (
        <div className="bg-slate-900/40 rounded-xl p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Via</span><span className="text-white">{quote.protocol}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Est. Gas</span><span className="text-white">{Number(quote.gas).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Slippage</span><span className="text-white">{slippage}%</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={getQuote} disabled={loading || !amount}
          variant="outline" className="flex-1 border-slate-600 text-white hover:bg-slate-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dapatkan Quote'}
        </Button>
        <Button onClick={swap} disabled={!quote}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1">
          Swap <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs">
        <Info className="w-3 h-3" />
        Swap dieksekusi di Uniswap/1inch secara langsung
      </div>
    </div>
  );
}
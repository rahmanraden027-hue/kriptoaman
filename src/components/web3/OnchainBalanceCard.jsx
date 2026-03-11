import React, { useState, useEffect } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet, bsc, polygon } from 'viem/chains';
import { useWeb3, SUPPORTED_CHAINS } from './Web3Provider';
import { RefreshCw, ExternalLink, TrendingUp } from 'lucide-react';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// Popular tokens per chain
const CHAIN_TOKENS = {
  1: [
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
  ],
  56: [
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
    { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
  ],
  137: [
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
  ],
};

export default function OnchainBalanceCard() {
  const { account, chainId, provider, balance, currentChain, refreshBalance } = useWeb3();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTokenBalances = async () => {
    if (!account || !chainId) return;
    setLoading(true);
    const tokenList = CHAIN_TOKENS[chainId] || [];
    const results = [];
    
    const chainMap = { 1: mainnet, 56: bsc, 137: polygon };
    const viemChain = chainMap[chainId];
    if (!viemChain) { setLoading(false); return; }

    const client = createPublicClient({ chain: viemChain, transport: http() });

    for (const token of tokenList) {
      try {
        const bal = await client.readContract({
          address: token.address,
          abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }],
          functionName: 'balanceOf',
          args: [account],
        });
        const formatted = parseFloat(formatUnits(bal, token.decimals));
        if (formatted > 0) {
          results.push({ ...token, balance: formatted });
        }
      } catch {}
    }
    setTokens(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchTokenBalances();
  }, [account, chainId, provider]);

  if (!account) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span className="text-white font-semibold text-sm">Saldo Onchain</span>
          {currentChain && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: currentChain.color + '22', color: currentChain.color }}>
              {currentChain.name}
            </span>
          )}
        </div>
        <button onClick={() => { refreshBalance(); fetchTokenBalances(); }}
          className={`text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Native balance */}
      <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: (currentChain?.color || '#627EEA') + '33', color: currentChain?.color || '#627EEA' }}>
            {currentChain?.symbol?.[0] || 'E'}
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{currentChain?.symbol || 'ETH'}</div>
            <div className="text-slate-400 text-xs">{currentChain?.name || 'Ethereum'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-bold">{parseFloat(balance).toFixed(6)}</div>
          <a href={`${currentChain?.explorer}/address/${account}`} target="_blank" rel="noreferrer"
            className="text-slate-500 hover:text-indigo-400 text-xs flex items-center gap-0.5 justify-end">
            Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ERC20 tokens */}
      {tokens.map(token => (
        <div key={token.symbol} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              {token.symbol[0]}
            </div>
            <div>
              <div className="text-white text-sm font-semibold">{token.symbol}</div>
              <div className="text-slate-400 text-xs">ERC-20</div>
            </div>
          </div>
          <div className="text-white text-sm font-bold">{token.balance.toFixed(4)}</div>
        </div>
      ))}

      {tokens.length === 0 && !loading && (
        <div className="text-slate-500 text-xs text-center py-2">Tidak ada token ERC-20 ditemukan</div>
      )}
    </div>
  );
}
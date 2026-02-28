import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

const EXPLORER_LINKS = {
  1: { name: 'Etherscan', url: 'https://etherscan.io' }, // Ethereum
  56: { name: 'BscScan', url: 'https://bscscan.com' }, // BSC
  137: { name: 'PolygonScan', url: 'https://polygonscan.com' }, // Polygon
  250: { name: 'FtmScan', url: 'https://ftmscan.com' }, // Fantom
  43114: { name: 'SnowTrace', url: 'https://snowtrace.io' }, // Avalanche
};

const SOLANA_EXPLORER = 'https://solscan.io';

function shortenAddr(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function generateMockTxs(address, chainId) {
  const txTypes = ['sent', 'received', 'contract'];
  const statuses = ['success', 'pending', 'failed'];
  const txs = [];

  for (let i = 0; i < 6; i++) {
    const isSuccess = Math.random() > 0.15;
    txs.push({
      hash: '0x' + Math.random().toString(16).slice(2, 66),
      type: txTypes[Math.floor(Math.random() * txTypes.length)],
      from: i % 2 === 0 ? address : generateAddress(),
      to: i % 2 === 0 ? generateAddress() : address,
      amount: (Math.random() * 10).toFixed(4),
      token: ['ETH', 'USDT', 'USDC'][Math.floor(Math.random() * 3)],
      status: isSuccess ? 'success' : (Math.random() > 0.6 ? 'pending' : 'failed'),
      timestamp: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      gasUsed: Math.floor(Math.random() * 150000),
      gasPrice: (Math.random() * 80).toFixed(2),
      blockNumber: 19000000 + Math.floor(Math.random() * 200000),
    });
  }
  return txs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function generateAddress() {
  const hex = () => Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
  return `0x${hex()}${hex()}${hex()}${hex()}${hex()}`.slice(0, 42);
}

function TxRow({ tx, explorer }) {
  const isReceived = tx.type === 'received';
  const isSent = tx.type === 'sent';
  const isSuccess = tx.status === 'success';
  const isPending = tx.status === 'pending';

  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl hover:bg-slate-900/60 transition-colors border border-slate-800/50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-slate-300 uppercase">
            {isSent ? '📤 Sent' : isReceived ? '📥 Received' : '⚙️ Contract'}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            isSuccess ? 'bg-green-500/20 text-green-400' :
            isPending ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {tx.status === 'success' ? '✓ Success' : tx.status === 'pending' ? '⏳ Pending' : '✗ Failed'}
          </span>
        </div>
        <div className="text-sm font-mono text-slate-500">{shortenAddr(tx.hash)}</div>
        <div className="text-[11px] text-slate-600 mt-1">
          {new Date(tx.timestamp).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="text-right mr-3">
        <div className={`text-sm font-bold ${isSent ? 'text-red-400' : 'text-green-400'}`}>
          {isSent ? '−' : '+'}{tx.amount} {tx.token}
        </div>
        <div className="text-[11px] text-slate-600 mt-0.5">
          Gas: {(tx.gasPrice * tx.gasUsed / 1e9).toFixed(6)} ETH
        </div>
      </div>

      <a href={`${explorer.url}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-2">
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

export default function WalletTxHistory({ address, chainId = 1 }) {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);

  const explorer = EXPLORER_LINKS[chainId] || EXPLORER_LINKS[1];
  const isSolana = chainId === 'solana';

  useEffect(() => {
    setTxs(generateMockTxs(address, chainId));
  }, [address, chainId]);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setTxs(generateMockTxs(address, chainId));
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
            ↗
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Riwayat Transaksi Blockchain</div>
            <div className="text-slate-500 text-xs">Terakhir di {explorer.name}</div>
          </div>
        </div>
        <button onClick={handleRefresh} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isSolana && (
        <div className="flex items-start gap-2 p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <span className="text-purple-400 text-xs mt-0.5">ℹ️</span>
          <span className="text-purple-300 text-xs">Lihat riwayat Solana di <a href={`${SOLANA_EXPLORER}/address/${address}`} target="_blank" rel="noreferrer" className="underline font-semibold hover:text-purple-200">Solscan</a></span>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {txs.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="w-5 h-5 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-slate-500 text-xs">Belum ada riwayat transaksi</p>
          </div>
        ) : (
          txs.map((tx, i) => <TxRow key={i} tx={tx} explorer={explorer} />)
        )}
      </div>

      {txs.length > 0 && (
        <a href={isSolana ? `${SOLANA_EXPLORER}/address/${address}` : `${explorer.url}/address/${address}`}
          target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-colors text-xs font-medium">
          Lihat Semua di {explorer.name} <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
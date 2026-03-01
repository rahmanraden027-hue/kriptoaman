import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { walletService } from './walletService';
import FeedbackToast from './FeedbackToast';

const AVAILABLE_COINS = {
  BTC: { label: 'Bitcoin', color: '#F7931A', symbol: '₿', price: 45000 },
  ETH: { label: 'Ethereum', color: '#627EEA', symbol: 'Ξ', price: 2500 },
  SOL: { label: 'Solana', color: '#9945FF', symbol: '◎', price: 150 },
  USDT: { label: 'USDT', color: '#26A17B', symbol: '₮', price: 1 },
  BNB: { label: 'BNB', color: '#F3BA2F', symbol: 'Ⓑ', price: 600 },
  XRP: { label: 'XRP', color: '#23292F', symbol: '✕', price: 2.5 },
};

const STORAGE_KEY = 'user_wallet_assets';

export default function UserWalletManagement() {
  const [assets, setAssets] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [expanded, setExpanded] = useState(true);

  // Load assets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAssets(JSON.parse(stored));
      } catch (e) {
        setAssets([]);
      }
    }
  }, []);

  // Save assets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  const handleAddAsset = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Masukkan jumlah yang valid');
      return;
    }

    const newAsset = {
      id: Date.now(),
      coin: selectedCoin,
      amount: parseFloat(amount),
      addedAt: new Date().toISOString(),
    };

    setAssets([...assets, newAsset]);
    setAmount('');
    setSelectedCoin('BTC');
  };

  const handleRemoveAsset = (id) => {
    setAssets(assets.filter((asset) => asset.id !== id));
  };

  const handleResetAll = () => {
    if (window.confirm('Hapus semua aset test? Aksi ini tidak dapat dibatalkan.')) {
      setAssets([]);
    }
  };

  // Calculate totals
  const assetsByType = {};
  assets.forEach((asset) => {
    if (!assetsByType[asset.coin]) {
      assetsByType[asset.coin] = 0;
    }
    assetsByType[asset.coin] += asset.amount;
  });

  const totalUSD = Object.entries(assetsByType).reduce((sum, [coin, amount]) => {
    const price = AVAILABLE_COINS[coin]?.price || 0;
    return sum + amount * price;
  }, 0);

  const sortedAssets = Object.entries(assetsByType)
    .map(([coin, amount]) => ({
      coin,
      amount,
      price: AVAILABLE_COINS[coin]?.price || 0,
      usdValue: amount * (AVAILABLE_COINS[coin]?.price || 0),
    }))
    .sort((a, b) => b.usdValue - a.usdValue);

  return (
    <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">👤</span>
          </div>
          <div className="text-left">
            <h3 className="text-white font-bold text-sm">Dompet Saya</h3>
            <p className="text-blue-300 text-[10px]">Aset Test</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-xs font-bold">
            ${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-blue-300 text-[10px]">{assets.length} aset</p>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-blue-700/50">
          {/* Add Asset Form */}
          <div className="bg-slate-900/50 border border-blue-700/30 rounded-lg p-4 space-y-3">
            <p className="text-slate-400 text-xs font-semibold">Tambah Aset Test</p>
            
            <div className="space-y-2">
              <label className="text-slate-400 text-[10px] font-semibold">Pilih Coin</label>
              <select
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {Object.entries(AVAILABLE_COINS).map(([coin, info]) => (
                  <option key={coin} value={coin}>
                    {coin} - {info.label} (${info.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-[10px] font-semibold">Jumlah</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleAddAsset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Tambah Aset
            </button>
          </div>

          {/* Assets Overview */}
          {sortedAssets.length > 0 ? (
            <div className="bg-slate-900/50 border border-blue-700/30 rounded-lg p-4 space-y-3">
              <p className="text-slate-400 text-xs font-semibold">Ringkasan Aset</p>
              
              {sortedAssets.map((asset) => {
                const percentage = ((asset.usdValue / (totalUSD || 1)) * 100).toFixed(1);
                return (
                  <div key={asset.coin} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: AVAILABLE_COINS[asset.coin].color }}
                        >
                          {AVAILABLE_COINS[asset.coin].symbol}
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">{asset.coin}</p>
                          <p className="text-slate-500 text-[10px]">
                            {asset.amount.toLocaleString('en-US', {
                              maximumFractionDigits: asset.coin === 'USDT' ? 0 : 4,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs font-bold">
                          ${asset.usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-blue-300 text-[10px]">{percentage}%</p>
                      </div>
                    </div>
                    
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${percentage}%`,
                          background: AVAILABLE_COINS[asset.coin].color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="border-t border-slate-700/50 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs font-semibold">Total Nilai</p>
                  <p className="text-white text-sm font-bold">
                    ${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-6 text-center">
              <p className="text-slate-500 text-xs">Belum ada aset. Mulai dengan menambahkan aset test.</p>
            </div>
          )}

          {/* Individual Assets List */}
          {assets.length > 0 && (
            <div className="bg-slate-900/50 border border-blue-700/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-semibold">Daftar Aset ({assets.length})</p>
                <button
                  onClick={handleResetAll}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Hapus semua"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assets.map((asset) => {
                  const coinInfo = AVAILABLE_COINS[asset.coin];
                  const usdValue = asset.amount * coinInfo.price;
                  const addedDate = new Date(asset.addedAt).toLocaleDateString('id-ID', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between bg-slate-800/50 border border-slate-700/30 rounded-lg p-2.5 hover:border-slate-700/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                            style={{ background: coinInfo.color }}
                          >
                            {coinInfo.symbol}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-xs font-semibold">{asset.coin}</p>
                            <p className="text-slate-500 text-[9px]">{addedDate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right mr-2 min-w-fit">
                        <p className="text-white text-xs font-bold">
                          ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-slate-500 text-[9px]">
                          {asset.amount.toLocaleString('en-US', {
                            maximumFractionDigits: 4,
                          })}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="text-red-400 hover:text-red-300 transition-colors shrink-0"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-slate-500 text-[10px] text-center py-2">
            Aset test disimpan secara lokal di perangkat Anda
          </p>
        </div>
      )}
    </div>
  );
}
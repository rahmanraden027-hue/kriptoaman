import React, { useState } from 'react';
import { X, Copy, Download, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COIN_ICONS = {
  BTC: '₿', ETH: 'Ξ', LTC: 'Ł', BNB: 'B', SOL: '◎',
  DOGE: 'Ð', MATIC: 'M', ARB: 'A', OP: 'O', BASE: 'Ⓑ',
  AVAX: '🔺', FTM: 'F'
};

const COIN_COLORS = {
  BTC: '#F7931A', ETH: '#627EEA', LTC: '#345D9D', BNB: '#F0B90B',
  SOL: '#14F195', DOGE: '#BA9F33', MATIC: '#8247E5', ARB: '#28A0F0',
  OP: '#FF0420', BASE: '#0052FF', AVAX: '#E84142', FTM: '#1969FF'
};

export default function AllReceiveAddressesModal({ addresses, onClose }) {
  const [copied, setCopied] = useState(null);

  if (!addresses || Object.keys(addresses).length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Alamat Penerima</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-400 text-sm">Tidak ada alamat yang tersedia.</p>
        </div>
      </div>
    );
  }

  const coinList = Object.entries(addresses).filter(([, data]) => data?.address);

  const handleCopy = (coin, address) => {
    navigator.clipboard.writeText(address);
    setCopied(coin);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Semua Alamat Penerima</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {coinList.map(([coin, data]) => (
            <div key={coin} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-3">
              {/* Coin Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                  style={{ background: COIN_COLORS[coin] || '#64748b' }}
                >
                  {COIN_ICONS[coin] || coin[0]}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{coin}</p>
                  <p className="text-slate-500 text-xs">Alamat penerima {coin}</p>
                </div>
              </div>

              {/* Address Display */}
              <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 break-all border border-slate-700">
                {data.address}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(coin, data.address)}
                  className={`flex-1 text-xs border-slate-700 transition-colors ${
                    copied === coin
                      ? 'bg-green-500/20 text-green-400 border-green-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {copied === coin ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Salin
                    </>
                  )}
                </Button>

                {/* Share Button - untuk mobile */}
                {navigator.share && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.share({
                        title: `Alamat ${coin}`,
                        text: `Kirim ${coin} ke: ${data.address}`,
                      }).catch(() => {});
                    }}
                    className="flex-1 text-xs border-slate-700 text-slate-400 hover:text-white"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Bagikan
                  </Button>
                )}
              </div>

              {/* QR Code Placeholder */}
              <div className="bg-slate-700/30 rounded-lg p-4 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                  <div className="text-center text-[10px] text-slate-400">
                    <div>Scan untuk</div>
                    <div>menerima {coin}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 py-4">
          <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
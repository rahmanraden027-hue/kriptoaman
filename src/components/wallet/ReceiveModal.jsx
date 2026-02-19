import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Copy, Check } from 'lucide-react';

export default function ReceiveModal({ address, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple QR-like display using address blocks
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}&bgcolor=1e293b&color=f97316&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Terima Bitcoin</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-400 text-sm">Bagikan alamat ini untuk menerima Bitcoin.</p>

        <div className="flex justify-center">
          <div className="bg-slate-800 rounded-xl p-3">
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-orange-400 font-mono text-sm break-all text-center">{address}</p>
        </div>

        <Button onClick={handleCopy} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
          {copied ? <><Check className="w-4 h-4 mr-2" />Tersalin!</> : <><Copy className="w-4 h-4 mr-2" />Salin Alamat</>}
        </Button>
      </div>
    </div>
  );
}
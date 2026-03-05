import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Copy, Check } from 'lucide-react';

function QRCodeCanvas({ value, size = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    // Generate QR using a simple data URL approach via a free QR API
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0f172a&color=ffffff&margin=2`;
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
    };
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-xl" />;
}

export default function WalletProfileCard({ user, address, coin = 'BTC', isLight }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '—';

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700/40'}`}>
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-sm select-none">
          {initials}
        </div>

        {/* Name & address */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-slate-500 text-[10px] font-mono truncate">{shortAddress}</span>
            {address && (
              <button onClick={handleCopy} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Badge role + QR button */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full capitalize">{user?.role || 'user'}</span>
          {address && (
            <button onClick={() => setShowQR(true)}
              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
              <QrCode className="w-3.5 h-3.5" />
              QR
            </button>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-bold text-base">{displayName}</p>
                <p className="text-slate-400 text-xs">Alamat {coin}</p>
              </div>
              <button onClick={() => setShowQR(false)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <div className="p-3 bg-slate-800 rounded-2xl">
                <QRCodeCanvas value={address} size={180} />
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-slate-400 text-[11px] font-mono break-all flex-1">{address}</span>
              <button onClick={handleCopy} className="shrink-0 text-slate-400 hover:text-white transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-center text-slate-600 text-[10px] mt-3">Scan QR ini untuk menerima {coin}</p>
          </div>
        </div>
      )}
    </>
  );
}
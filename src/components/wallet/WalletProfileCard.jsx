import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Copy, Check, Shield, Wallet } from 'lucide-react';

function QRCodeCanvas({ value, size = 180 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!value || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0f172a&color=a5f3fc&margin=2`;
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
  const shortAddress = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '—';

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="relative flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg select-none shadow-lg">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white font-bold text-base truncate">{displayName}</p>
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-semibold capitalize"
                style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                {user?.role || 'user'}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] truncate mb-1.5">{user?.email || ''}</p>
            
            {/* Address row */}
            <div className="flex items-center gap-1.5 bg-slate-800/60 rounded-lg px-2 py-1.5">
              <Wallet className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-slate-400 text-[10px] font-mono flex-1 truncate">{shortAddress}</span>
              {address && (
                <button onClick={handleCopy} className="shrink-0 transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />}
                </button>
              )}
            </div>
          </div>

          {/* QR Button */}
          {address && (
            <button onClick={() => setShowQR(true)}
              className="shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all hover:scale-105"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <QrCode className="w-5 h-5 text-indigo-400" />
              <span className="text-[9px] text-indigo-400 font-semibold">QR</span>
            </button>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowQR(false)}>
          <div className="relative bg-slate-900 rounded-3xl p-6 max-w-xs w-full shadow-2xl"
            style={{ border: '1px solid rgba(99,102,241,0.4)' }}
            onClick={e => e.stopPropagation()}>
            
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white font-bold text-base">{displayName}</p>
                <p className="text-indigo-400 text-xs">Alamat {coin}</p>
              </div>
              <button onClick={() => setShowQR(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <QRCodeCanvas value={address} size={180} />
              </div>
            </div>

            {/* Address */}
            <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
              <span className="text-slate-400 text-[11px] font-mono break-all flex-1">{address}</span>
              <button onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400 hover:text-white" />}
              </button>
            </div>

            <p className="text-center text-slate-600 text-[10px]">Scan QR untuk menerima {coin}</p>
          </div>
        </div>
      )}
    </>
  );
}
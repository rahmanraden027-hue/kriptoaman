import React, { useState } from 'react';
import { decryptData } from './walletUtils';
import { X, Copy, Check, ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function BackupRecoveryModal({ wallet, sessionPassword, onClose }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const mnemonic = (sessionPassword && wallet?.encryptedMnemonic && sessionPassword !== 'admin_bypass')
    ? (decryptData(wallet.encryptedMnemonic, sessionPassword) || '')
    : '';
  const words = revealed ? mnemonic.split(' ').filter(Boolean) : [];

  const copy = () => {
    navigator.clipboard?.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="ka-surface w-full max-w-md p-5 ka-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-base flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-yellow-400" /> Backup &amp; Recovery
          </h3>
          <button onClick={onClose} className="ka-muted hover:text-white tap-reset"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-3">
          <ShieldAlert className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-yellow-200 text-[11px] leading-relaxed">
            Seed phrase adalah satu-satunya cara memulihkan dompet. Tulis di kertas &amp; simpan offline. Jangan pernah bagikan kepada siapapun.
          </p>
        </div>

        {!mnemonic ? (
          <p className="ka-muted text-xs text-center py-4">Backup seed phrase tidak tersedia untuk sesi ini.</p>
        ) : (
          <>
            <button onClick={() => setRevealed((r) => !r)}
              className="w-full flex items-center justify-center gap-1.5 py-2 ka-chip text-xs font-bold text-ka-emerald mb-3 tap-reset">
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {revealed ? 'Sembunyikan' : 'Tampilkan Seed Phrase'}
            </button>
            {revealed && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {words.map((w, i) => (
                    <div key={i} className="bg-ka-card border border-ka-card-border rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                      <span className="ka-muted text-[10px] ka-num">{i + 1}.</span>
                      <span className="text-white text-xs font-bold ka-num">{w}</span>
                    </div>
                  ))}
                </div>
                <button onClick={copy}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-ka-emerald/15 border border-ka-emerald/30 rounded-xl text-ka-emerald text-xs font-bold tap-reset">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin' : 'Salin Seed Phrase'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
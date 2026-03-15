import React, { useState, useEffect, useRef } from 'react';
import {
  X, ArrowUpFromLine, ChevronRight, Loader2, CheckCircle2,
  AlertTriangle, ShieldCheck, Copy, Info, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import KYCWalletGate from '@/components/kyc/KYCWalletGate';

const COINS = {
  USDT: { label: 'Tether', network: 'Ethereum (ERC-20)', color: '#26A17B', icon: '₮', fee: 5, min: 20 },
  SOL:  { label: 'Solana', network: 'Solana',            color: '#9945FF', icon: '◎', fee: 0.01, min: 0.1 },
  ETH:  { label: 'Ethereum', network: 'Ethereum',        color: '#627EEA', icon: 'Ξ', fee: 0.002, min: 0.01 },
  BTC:  { label: 'Bitcoin', network: 'Bitcoin',          color: '#F7931A', icon: '₿', fee: 0.0001, min: 0.001 },
};

// Steps: form → otp → success
export default function WithdrawalModal({ onClose, userEmail }) {
  const [step, setStep] = useState('form');
  const [selectedCoin, setSelectedCoin] = useState('USDT');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [kycBlocked, setKycBlocked] = useState(true); // default block until KYC confirmed

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 min
  const timerRef = useRef(null);
  const inputRefs = useRef([]);

  const coin = COINS[selectedCoin];
  const amountNum = parseFloat(amount) || 0;
  const netAmount = Math.max(amountNum - coin.fee, 0);
  const canProceed = toAddress.trim().length > 10 && amountNum >= coin.min;

  // Countdown timer
  useEffect(() => {
    if (step === 'otp') {
      setCountdown(600);
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timerRef.current); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSendOTP = async () => {
    setError('');
    setSubmitting(true);
    const res = await base44.functions.invoke('sendWithdrawalOTP', {
      coin: selectedCoin,
      network: coin.network,
      toAddress,
      amount: amountNum,
      fee: coin.fee,
      netAmount,
    });
    setSubmitting(false);
    if (res.data?.error) {
      // Handle KYC specific errors
      if (res.data.error === 'KYC_REQUIRED') {
        setError('❌ Verifikasi KYC diperlukan. Selesaikan KYC terlebih dahulu untuk mengaktifkan withdrawal.');
      } else if (res.data.error === 'KYC_PENDING') {
        setError('⏳ KYC Anda masih dalam proses review. Silakan tunggu 1×24 jam.');
      } else if (res.data.error === 'DAILY_LIMIT_EXCEEDED') {
        setError(res.data.message);
      } else {
        setError(res.data.message || res.data.error);
      }
      return;
    }
    setRequestId(res.data.requestId);
    setStep('otp');
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[idx] = digit;
    setOtpDigits(newDigits);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
    // auto-verify when all 6 filled
    if (newDigits.every(d => d !== '') && newDigits.join('').length === 6) {
      verifyOTP(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const verifyOTP = async (code) => {
    setOtpError('');
    setOtpVerifying(true);
    const res = await base44.functions.invoke('verifyWithdrawalOTP', {
      requestId,
      otpInput: code || otpDigits.join(''),
    });
    setOtpVerifying(false);
    if (res.data?.error) {
      setOtpError(res.data.error);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      return;
    }
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
              <ArrowUpFromLine className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">Penarikan Dana</span>
              <div className="text-slate-500 text-[10px]">Withdraw kripto dari saldo platform</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== FORM STEP ===== */}
        {step === 'form' && (
          <div className="p-4 space-y-4">
            {/* KYC Gate Banner */}
            <KYCWalletGate compact onBlock={setKycBlocked} />

            {/* Coin selector */}
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-semibold">PILIH ASET</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(COINS).map(([id, info]) => (
                  <button key={id} onClick={() => setSelectedCoin(id)}
                    className={`flex flex-col items-center py-2.5 px-1 rounded-xl border transition-all ${
                      selectedCoin === id
                        ? 'border-blue-500/60 bg-blue-500/15'
                        : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800'
                    }`}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white mb-1"
                      style={{ background: info.color }}>{info.icon}</span>
                    <span className="text-white text-[11px] font-semibold">{id}</span>
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-[10px]">Jaringan: <span className="text-slate-300">{coin.network}</span></p>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">ALAMAT TUJUAN</label>
              <Input value={toAddress} onChange={e => setToAddress(e.target.value)}
                placeholder={`Alamat ${selectedCoin} tujuan...`}
                className="bg-slate-800 border-slate-700 text-white font-mono text-xs" />
              <p className="text-slate-600 text-[10px]">Pastikan alamat tujuan benar. Transaksi tidak bisa dibatalkan.</p>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">JUMLAH ({selectedCoin})</label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={`Min. ${coin.min} ${selectedCoin}`}
                className="bg-slate-800 border-slate-700 text-white text-lg font-bold" />
            </div>

            {/* Fee breakdown */}
            {amountNum > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Jumlah</span>
                  <span className="text-white font-semibold">{amountNum} {selectedCoin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Biaya jaringan</span>
                  <span className="text-red-400">- {coin.fee} {selectedCoin}</span>
                </div>
                <hr className="border-slate-700" />
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Diterima</span>
                  <span className="text-green-400 font-bold">{netAmount.toFixed(6)} {selectedCoin}</span>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs">Kode OTP akan dikirim ke email Anda untuk konfirmasi keamanan.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            <Button onClick={handleSendOTP} disabled={!canProceed || submitting || kycBlocked}
              className="w-full h-12 font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-40">
              {submitting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim OTP...</>
                : <><ShieldCheck className="w-4 h-4 mr-2" /> Lanjut & Kirim OTP</>}
            </Button>
          </div>
        )}

        {/* ===== OTP STEP ===== */}
        {step === 'otp' && (
          <div className="p-4 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-white font-bold text-base">Masukkan Kode OTP</h3>
              <p className="text-slate-400 text-sm">
                Kode 6 digit dikirim ke <span className="text-white font-semibold">{userEmail}</span>
              </p>
            </div>

            {/* Summary */}
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Aset</span>
                <span className="text-white font-bold">{amountNum} {selectedCoin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tujuan</span>
                <span className="text-white font-mono text-xs">{toAddress.slice(0, 12)}...{toAddress.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Diterima</span>
                <span className="text-green-400 font-bold">{netAmount.toFixed(6)} {selectedCoin}</span>
              </div>
            </div>

            {/* OTP boxes */}
            <div className="flex justify-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl border bg-slate-800 text-white focus:outline-none transition-all ${
                    otpError ? 'border-red-500' : digit ? 'border-blue-500' : 'border-slate-600 focus:border-blue-500'
                  }`}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-red-400 text-xs text-center">{otpError}</p>
            )}

            {/* Countdown */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-slate-400 text-xs">OTP berlaku selama <span className="text-blue-400 font-semibold">{formatCountdown(countdown)}</span></p>
              ) : (
                <p className="text-red-400 text-xs">OTP kadaluarsa. <button onClick={() => setStep('form')} className="underline">Ulangi proses</button></p>
              )}
            </div>

            <Button onClick={() => verifyOTP()} disabled={otpDigits.some(d => d === '') || otpVerifying || countdown === 0}
              className="w-full h-12 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40">
              {otpVerifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memverifikasi...</> : <>Verifikasi & Konfirmasi</>}
            </Button>

            <button onClick={() => setStep('form')} className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors">
              ← Kembali ubah detail
            </button>
          </div>
        )}

        {/* ===== SUCCESS STEP ===== */}
        {step === 'success' && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Penarikan Berhasil Diajukan!</h3>
              <p className="text-slate-400 text-sm mt-1">
                Permintaan Anda sedang diproses. Kripto akan dikirim ke alamat tujuan dalam 1–24 jam.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Aset</span><span className="text-white font-bold">{amountNum} {selectedCoin}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Diterima</span><span className="text-green-400 font-bold">{netAmount.toFixed(6)} {selectedCoin}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Tujuan</span><span className="text-white font-mono text-xs">{toAddress.slice(0,12)}...{toAddress.slice(-6)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status</span><span className="text-amber-400 font-semibold">Menunggu Proses</span></div>
            </div>

            <Button onClick={onClose}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold">
              Selesai
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}